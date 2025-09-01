// src/services/purchaseOrder.service.ts
import { Transaction, Op } from 'sequelize';
import { PurchaseOrder, PurchaseOrderLine, POApproval } from '../models/purchaseIndex.model.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import {
  ApplyGRNLine, CreatePOInput,
  POStatus, POLineStatus,
  ApprovalStage, ApprovalStatus
} from '../types/po.js';
import { sendMail } from '../utils/mailer.js';
import { generatePoPdf } from '../utils/poPdf.js';

// Approval flow order
const FLOW: ApprovalStage[] = [
  ApprovalStage.CATEGORY_HEAD,
  ApprovalStage.ADMIN,
  ApprovalStage.VENDOR,
];

// --- Small helpers
function assertFound<T>(v: T | null | undefined, msg: string, code = 404): T {
  if (!v) { const e: any = new Error(msg); e.status = code; throw e; }
  return v;
}
const assertx = (cond: any, msg: string, code = 400) => {
  if (!cond) { const e: any = new Error(msg); e.status = code; throw e; }
};
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

type POWithLines = PurchaseOrder & { lines?: PurchaseOrderLine[] };
type POWithApprovals = PurchaseOrder & { approvals?: POApproval[] };

function computeLineStatus(ordered: number, pass: number, fail: number): POLineStatus {
  const accounted = (pass || 0) + (fail || 0);
  if (accounted >= ordered) return POLineStatus.CLOSED;
  if (accounted > 0) return POLineStatus.PARTIAL;
  return POLineStatus.OPEN;
}
function rollupPOStatus(locked: boolean, lineStatuses: POLineStatus[]): POStatus {
  const allClosed = lineStatuses.every(s => s === POLineStatus.CLOSED);
  const anyPartial = lineStatuses.some(s => s === POLineStatus.PARTIAL);
  if (allClosed) return POStatus.CLOSED;
  if (locked && anyPartial) return POStatus.PARTIAL_GRN;
  return locked ? POStatus.INBOUND_IN_PROGRESS : POStatus.OPEN;
}
const nextAwaitingStatus = (stage: ApprovalStage): POStatus => {
  switch (stage) {
    case ApprovalStage.CATEGORY_HEAD: return POStatus.AWAITING_ADMIN_APPROVAL;
    case ApprovalStage.ADMIN:         return POStatus.AWAITING_VENDOR_APPROVAL;
    default:                          return POStatus.OPEN; // after vendor approval
  }
};

// Email helpers
const poSubject = (poNo: string, suffix: string) => `PO ${poNo} — ${suffix}`;
const stageToEmail = (stage: ApprovalStage, po?: PurchaseOrder) => {
  switch (stage) {
    case ApprovalStage.CATEGORY_HEAD: return process.env.PO_CATEGORY_HEAD_EMAIL || '';
    case ApprovalStage.ADMIN:         return process.env.PO_ADMIN_EMAIL || '';
    case ApprovalStage.VENDOR:        return process.env.PO_VENDOR_EMAIL || (po as any)?.vendor_email || '';
    default: return '';
  }
};
async function emailApprovalRequest(po: any, stage: ApprovalStage) {
  const to = stageToEmail(stage, po);
  if (!to) return;
  const pdf = await generatePoPdf(po);
  const stageLabel = stage === ApprovalStage.CATEGORY_HEAD ? 'Category Head'
                   : stage === ApprovalStage.ADMIN         ? 'Admin' : 'Vendor';
  await sendMail({
    to,
    subject: poSubject(po.po_no, `Approval Requested (${stageLabel})`),
    text: `Please review PO ${po.po_no}. Status: ${po.status}.`,
    html: `<p>Please review <b>PO ${po.po_no}</b>.</p><p>Status: <b>${po.status}</b></p>`,
    attachments: [{ filename: `PO-${po.po_no}.pdf`, content: pdf }]
  });
}
async function emailOutcome(po: any, approved: boolean, rejectedStage?: ApprovalStage, reason?: string) {
  const all = [process.env.PO_CATEGORY_HEAD_EMAIL, process.env.PO_ADMIN_EMAIL, process.env.PO_VENDOR_EMAIL]
    .filter(Boolean).join(',');
  if (!all) return;
  const pdf = await generatePoPdf(po);
  const title = approved ? 'Approved (All Stages)' : `Rejected at ${rejectedStage}`;
  const body  = approved
    ? `PO ${po.po_no} has been approved by Category Head, Admin and Vendor.`
    : `PO ${po.po_no} was rejected at stage ${rejectedStage}. ${reason ? 'Reason: ' + reason : ''}`;
  await sendMail({
    to: all,
    subject: poSubject(po.po_no, title),
    text: body,
    html: `<p>${body}</p>`,
    attachments: [{ filename: `PO-${po.po_no}.pdf`, content: pdf }]
  });
}

// Ensure approval rows exist for a PO
async function ensureApprovalSeed(po_id: string, t: Transaction) {
  const existing = await POApproval.findAll({ where: { po_id }, transaction: t });
  if (existing.length === 3) return;
  const missing = FLOW.filter(s => !existing.find(e => e.stage === s));
  if (missing.length) {
    await POApproval.bulkCreate(
      missing.map(stage => ({ po_id, stage, status: ApprovalStatus.PENDING })),
      { transaction: t }
    );
  }
}

// --- API functions

// Create PO -> status AWAITING_CATEGORY_APPROVAL + seed approvals + email category head
export async function createPO(input: CreatePOInput, actorId?: string) {
  assertx(input.lines?.length, 'PO must have at least one line');
  input.lines.forEach(l => {
    assertx(l.sku, 'Line sku required');
    assertx(l.orderedQty > 0, `orderedQty must be > 0 for ${l.sku}`);
    assertx(l.unitCost >= 0, `unitCost must be >= 0 for ${l.sku}`);
  });

  const po = await PurchaseOrder.sequelize!.transaction(async (t) => {
    const header = await PurchaseOrder.create({
      po_no: input.poNo,
      vendor_id: input.vendorId,
      vendor_name: input.vendorName ?? null,
      po_date: input.poDate ? new Date(input.poDate) : new Date(),
      expected_date: input.expectedDate ? new Date(input.expectedDate) : null,
      currency: input.currency ?? 'INR',
      payment_terms: input.paymentTerms ?? null,
      site_id: input.siteId ?? null,
      status: POStatus.AWAITING_CATEGORY_APPROVAL,
      locked: false,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
    }, { transaction: t });

    await PurchaseOrderLine.bulkCreate(
      input.lines.map(l => ({
        po_id: header.id,
        sku: l.sku,
        ordered_qty: l.orderedQty,
        unit_cost: l.unitCost,
        tax_pct: l.taxPct ?? 0,
        mrp: l.mrp ?? null,
      })), { transaction: t }
    );

    await ensureApprovalSeed(header.id, t);
    return header;
  });

  eventBus?.emit?.(EVENTS.PO_CREATED, { id: po.id, poNo: po.po_no });

  const full = await getPO(po.id);
  await emailApprovalRequest(full, ApprovalStage.CATEGORY_HEAD);
  return full;
}

export async function getPO(idOrNo: string) {
  const where = isUUID(idOrNo) ? { id: idOrNo } : { po_no: idOrNo };
  const po = assertFound<POWithLines & POWithApprovals>(await PurchaseOrder.findOne({
    where,
    include: [
      { model: PurchaseOrderLine, as: 'lines', separate: true, order: [['id','ASC']] },
      { model: POApproval, as: 'approvals' }
    ]
  }), 'PO not found', 404);

  const totals = (po.lines || []).reduce(
    (acc, l) => {
      acc.totalOrderedQty += l.ordered_qty;
      acc.subtotal += Number(l.ordered_qty) * Number(l.unit_cost);
      acc.tax += Number(l.ordered_qty) * Number(l.unit_cost) * Number(l.tax_pct || 0) / 100;
      return acc;
    },
    { currency: (po as any).currency, totalOrderedQty: 0, subtotal: 0, tax: 0 }
  );

  return { ...po.toJSON(), totals: { ...totals, grandTotal: totals.subtotal + totals.tax } };
}

export async function listPO(query: any, limit = 50, page = 1) {
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.vendorId) where.vendor_id = query.vendorId;
  if (query.poNo) where.po_no = query.poNo;
  if (query.siteId) where.site_id = query.siteId;

  const { rows, count } = await PurchaseOrder.findAndCountAll({
    where,
    order: [['createdAt','DESC']], // if your columns are snake_case, change to 'created_at'
    limit: Math.min(limit, 200),
    offset: (Math.max(page, 1) - 1) * limit,
    include: [{ model: PurchaseOrderLine, as: 'lines', attributes: ['ordered_qty','unit_cost','tax_pct','qc_pass_qty','qc_fail_qty'] }]
  });

  const items = rows.map(po => {
    const lines = (po as any).lines as PurchaseOrderLine[] || [];
    const subtotal = lines.reduce((a, l) => a + Number(l.ordered_qty) * Number(l.unit_cost), 0);
    const tax = lines.reduce((a, l) => a + Number(l.ordered_qty) * Number(l.unit_cost) * Number(l.tax_pct || 0) / 100, 0);
    const totalOrderedQty = lines.reduce((a, l) => a + l.ordered_qty, 0);
    const totalAccountedQty = lines.reduce((a, l) => a + (l.qc_pass_qty || 0) + (l.qc_fail_qty || 0), 0);
    return { ...po.toJSON(), subtotal, tax, totalOrderedQty, totalAccountedQty };
  });

  return { items, total: count, page, limit };
}

export async function updatePO(id: string, patch: Partial<CreatePOInput>, actorId?: string) {
  return PurchaseOrder.sequelize!.transaction(async (t) => {
    const po = assertFound(await PurchaseOrder.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE }), 'PO not found', 404);
    assertx(!po.locked, 'PO is locked once inbound starts. Edits not allowed');
    assertx([POStatus.DRAFT, POStatus.OPEN, POStatus.AWAITING_CATEGORY_APPROVAL, POStatus.AWAITING_ADMIN_APPROVAL, POStatus.AWAITING_VENDOR_APPROVAL].includes(po.status),
      'Only certain statuses can be edited');

    await po.update({
      vendor_name: patch.vendorName ?? (po as any).vendor_name,
      expected_date: patch.expectedDate ? new Date(patch.expectedDate) : (po as any).expected_date,
      currency: patch.currency ?? (po as any).currency,
      payment_terms: patch.paymentTerms ?? (po as any).payment_terms,
      site_id: patch.siteId ?? (po as any).site_id,
      updated_by: actorId ?? null,
    }, { transaction: t });

    if (patch.lines) {
      const receipts = await PurchaseOrderLine.count({
        where: { po_id: id, [Op.or]: [{ received_qty: { [Op.gt]: 0 } }, { qc_pass_qty: { [Op.gt]: 0 } }, { qc_fail_qty: { [Op.gt]: 0 } }] },
        transaction: t,
      });
      assertx(receipts === 0, 'Cannot edit lines after inbound has started');

      await PurchaseOrderLine.destroy({ where: { po_id: id }, transaction: t });
      await PurchaseOrderLine.bulkCreate(
        patch.lines.map(l => ({
          po_id: id,
          sku: l.sku,
          ordered_qty: l.orderedQty,
          unit_cost: l.unitCost,
          tax_pct: l.taxPct ?? 0,
          mrp: l.mrp ?? null,
        })), { transaction: t }
      );
    }

    eventBus?.emit?.(EVENTS.PO_UPDATED, { id, poNo: (po as any).po_no });
    return getPO(id);
  });
}

export async function submitPO(id: string, actorId?: string) {
  const po = assertFound(await PurchaseOrder.findByPk(id, { include: [{ model: POApproval, as: 'approvals' }] }), 'PO not found', 404);
  const approvals = ((po as any).approvals as POApproval[]) || [];
  const allApproved = FLOW.every(stage => approvals.find(a => a.stage === stage && a.status === ApprovalStatus.APPROVED));
  assertx(allApproved, 'PO not fully approved yet', 409);

  await po.update({ status: POStatus.OPEN, updated_by: actorId ?? null });
  eventBus?.emit?.(EVENTS.PO_UPDATED, { id: (po as any).id, poNo: (po as any).po_no, status: POStatus.OPEN });
  return getPO(id);
}

export async function lockPO(id: string, actorId?: string) {
  const po = assertFound(await PurchaseOrder.findByPk(id), 'PO not found', 404);
  await po.update({ locked: true, status: POStatus.INBOUND_IN_PROGRESS, updated_by: actorId ?? null });
  eventBus?.emit?.(EVENTS.PO_LOCKED, { id: (po as any).id, poNo: (po as any).po_no });
  return getPO(id);
}

export async function applyGRN(id: string, lines: ApplyGRNLine[], actorId?: string) {
  assertx(lines?.length, 'No GRN lines supplied');

  return PurchaseOrder.sequelize!.transaction(async (t: Transaction) => {
    const po = assertFound(await PurchaseOrder.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE }), 'PO not found', 404);
    assertx(
      [POStatus.OPEN, POStatus.INBOUND_IN_PROGRESS, POStatus.PARTIAL_GRN].includes((po as any).status),
      'PO is not in a receivable state'
    );

    if (!(po as any).locked) await po.update({ locked: true, status: POStatus.INBOUND_IN_PROGRESS, updated_by: actorId ?? null }, { transaction: t });

    for (const d of lines) {
      const line = assertFound(await PurchaseOrderLine.findOne({
        where: { po_id: id, sku: d.sku },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }), `SKU ${d.sku} not found in PO`);

      const r = Math.max(0, d.receivedQty || 0);
      const p = Math.max(0, d.qcPassQty || 0);
      const f = Math.max(0, d.qcFailQty || 0);
      assertx(p + f <= r || r === 0, `For ${d.sku}, qcPass + qcFail cannot exceed received`);

      const received_qty = (line as any).received_qty + r;
      const qc_pass_qty = (line as any).qc_pass_qty + p;
      const qc_fail_qty = (line as any).qc_fail_qty + f;

      const accounted = qc_pass_qty + qc_fail_qty;
      if (accounted > (line as any).ordered_qty) {
        const e: any = new Error(`Over-receipt for SKU ${d.sku}. Requires approval.`);
        e.status = 409;
        throw e;
      }

      const reasonsSet = new Set<string>(Array.isArray((line as any).reasons) ? ((line as any).reasons as any) : []);
      (d.reasonCodes || []).forEach(c => reasonsSet.add(c));
      const status = computeLineStatus((line as any).ordered_qty, qc_pass_qty, qc_fail_qty);

      await line.update(
        {
          received_qty,
          qc_pass_qty,
          qc_fail_qty,
          status,
          reasons: Array.from(reasonsSet),
        },
        { transaction: t }
      );
    }

    const allLines = await PurchaseOrderLine.findAll({ where: { po_id: id }, transaction: t });
    const newStatus = rollupPOStatus(true, allLines.map((l: any) => l.status));
    await po.update({ status: newStatus, updated_by: actorId ?? null }, { transaction: t });

    eventBus?.emit?.(EVENTS.PO_GRN_APPLIED, { id: (po as any).id, status: newStatus });
    return getPO(id);
  });
}

export async function closePO(id: string, _reason?: string, actorId?: string) {
  return PurchaseOrder.sequelize!.transaction(async (t) => {
    const po = assertFound(await PurchaseOrder.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE }), 'PO not found', 404);
    const lines = await PurchaseOrderLine.findAll({ where: { po_id: id }, transaction: t, lock: t.LOCK.UPDATE });
    assertx(lines.length > 0, 'PO has no lines');
    const allClosed = lines.every((l: any) => computeLineStatus(l.ordered_qty, l.qc_pass_qty, l.qc_fail_qty) === POLineStatus.CLOSED);
    assertx(allClosed, 'Cannot close PO: some lines are not fully accounted (need APPROVAL to force-close)', 409);

    await po.update({ status: POStatus.CLOSED, updated_by: actorId ?? null }, { transaction: t });
  }).then(async () => {
    const po = await getPO(id);
    eventBus?.emit?.(EVENTS.PO_CLOSED, { id: (po as any).id, poNo: (po as any).po_no });
    return po;
  });
}

// --- Approvals
export async function approvePO(id: string, stage: ApprovalStage, comment: string | undefined, actor: any) {
  assertx(FLOW.includes(stage), 'Unknown approval stage');

  await PurchaseOrder.sequelize!.transaction(async (t) => {
    const po = assertFound<POWithApprovals>(await PurchaseOrder.findByPk(id, {
      transaction: t, lock: t.LOCK.UPDATE, include: [{ model: POApproval, as: 'approvals' }]
    }), 'PO not found', 404);
    assertx((po as any).status !== POStatus.REJECTED, 'PO already rejected');

    await ensureApprovalSeed(id, t);

    const approvals = po.approvals ?? [];
    const firstPending = FLOW.find(s => !approvals.find(a => a.stage === s && a.status === ApprovalStatus.APPROVED));
    assertx(firstPending === stage, `Out of order. Next required stage is ${firstPending}`);

    const row = assertFound(approvals.find(a => a.stage === stage), 'Approval row missing');
    await row.update({
      status: ApprovalStatus.APPROVED,
      approver_id: actor?.id ?? 'system',
      approver_name: actor?.name ?? actor?.role ?? 'system',
      comment: comment ?? null,
      decided_at: new Date()
    }, { transaction: t });

    const newStatus = nextAwaitingStatus(stage);
    await po.update({ status: newStatus, updated_by: actor?.id ?? null }, { transaction: t });
  });

  const full = await getPO(id);

  const status = await getApprovalStatus(id);
  if (status.overall === 'APPROVED') {
    await emailOutcome(full, true);
  } else {
    const next = status.pendingStage!;
    await emailApprovalRequest(full, next as ApprovalStage);
  }

  return full;
}

export async function rejectPO(id: string, stage: ApprovalStage, reason: string | undefined, actor: any) {
  assertx(FLOW.includes(stage), 'Unknown approval stage');

  await PurchaseOrder.sequelize!.transaction(async (t) => {
    const po = assertFound<POWithApprovals>(await PurchaseOrder.findByPk(id, {
      transaction: t, lock: t.LOCK.UPDATE, include: [{ model: POApproval, as: 'approvals' }]
    }), 'PO not found', 404);
    await ensureApprovalSeed(id, t);

    const approvals = po.approvals ?? [];
    const firstPending = FLOW.find(s => !approvals.find(a => a.stage === s && a.status === ApprovalStatus.APPROVED));
    assertx(firstPending === stage, `Out of order. Current stage is ${firstPending}`);

    const row = assertFound(approvals.find(a => a.stage === stage), 'Approval row missing');
    await row.update({
      status: ApprovalStatus.REJECTED,
      approver_id: actor?.id ?? 'system',
      approver_name: actor?.name ?? actor?.role ?? 'system',
      comment: reason ?? null,
      decided_at: new Date()
    }, { transaction: t });

    await po.update({ status: POStatus.REJECTED, updated_by: actor?.id ?? null }, { transaction: t });
  });

  const full = await getPO(id);
  await emailOutcome(full, false, stage, reason);
  return full;
}

// Frontend summary for banner: "Pending by X" / "Approved" / "Rejected"
export async function getApprovalStatus(id: string) {
  const po = assertFound<POWithApprovals>(await PurchaseOrder.findByPk(id, { include: [{ model: POApproval, as: 'approvals' }] }), 'PO not found', 404);
  const approvals = po.approvals ?? [];
  const byStage: Record<string, ApprovalStatus> = {};
  approvals.forEach(a => { byStage[a.stage] = a.status; });

  let overall: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  if ((po as any).status === POStatus.REJECTED) overall = 'REJECTED';
  else if (FLOW.every(s => byStage[s] === ApprovalStatus.APPROVED)) overall = 'APPROVED';

  const pendingStage = overall === 'PENDING' ? FLOW.find(s => byStage[s] !== ApprovalStatus.APPROVED) : null;

  return {
    po_id: (po as any).id,
    po_no: (po as any).po_no,
    status: (po as any).status,
    overall,
    pendingStage,
    approvals: approvals.map(a => ({
      stage: a.stage,
      status: a.status,
      approver_name: (a as any).approver_name,
      decided_at: (a as any).decided_at,
    })),
  };
}

export async function resendApproval(id: string, stage: ApprovalStage) {
  const full = await getPO(id);
  const status = await getApprovalStatus(id);
  assertx(status.overall === 'PENDING', 'PO already finalized', 409);
  await emailApprovalRequest(full, stage);
  return { ok: true };
}
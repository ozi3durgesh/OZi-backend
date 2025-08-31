import { Transaction, Op } from 'sequelize';
import { PurchaseOrder, PurchaseOrderLine, POApproval } from '../models/purchaseIndex.model.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import {
  ApplyGRNLine,
  CreatePOInput,
  POStatus,
  POLineStatus,
  ApprovalStage,
  ApprovalStatus,
} from '../types/po.js';

// ---- helpers & types ----
const FLOW: ApprovalStage[] = [
  ApprovalStage.CATEGORY_HEAD,
  ApprovalStage.ADMIN,
  ApprovalStage.VENDOR,
];

const assertx = (cond: any, msg: string, code = 400) => {
  if (!cond) { const e: any = new Error(msg); e.status = code; throw e; }
};

const must = <T>(val: T | null | undefined, msg = 'Not found', code = 404): NonNullable<T> => {
  if (val == null) { const e: any = new Error(msg); e.status = code; throw e; }
  return val as NonNullable<T>;
};

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

type POLoaded = PurchaseOrder & {
  lines: PurchaseOrderLine[];
  approvals?: POApproval[];
};

const computeLineStatus = (ordered: number, pass: number, fail: number): POLineStatus => {
  const accounted = (pass || 0) + (fail || 0);
  if (accounted >= ordered) return POLineStatus.CLOSED;
  if (accounted > 0) return POLineStatus.PARTIAL;
  return POLineStatus.OPEN;
};

const rollupPOStatus = (locked: boolean, lineStatuses: POLineStatus[]): POStatus => {
  const allClosed = lineStatuses.every(s => s === POLineStatus.CLOSED);
  const anyPartial = lineStatuses.some(s => s === POLineStatus.PARTIAL);
  if (allClosed) return POStatus.CLOSED;
  if (locked && anyPartial) return POStatus.PARTIAL_GRN;
  return locked ? POStatus.INBOUND_IN_PROGRESS : POStatus.OPEN;
};

const nextAwaitingStatus = (stage: ApprovalStage): POStatus => {
  switch (stage) {
    case ApprovalStage.CATEGORY_HEAD: return POStatus.AWAITING_ADMIN_APPROVAL;
    case ApprovalStage.ADMIN:         return POStatus.AWAITING_VENDOR_APPROVAL;
    default:                          return POStatus.OPEN; // after vendor approval
  }
};

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

// ---- CRUD & flows ----

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
      status: POStatus.AWAITING_CATEGORY_APPROVAL, // start gated
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

  eventBus?.emit(EVENTS.PO_CREATED, { id: po.id, poNo: po.po_no });
  return getPO(po.id);
}

export async function getPO(idOrNo: string) {
  const where = isUUID(idOrNo) ? { id: idOrNo } : { po_no: idOrNo };
  const poRaw = await PurchaseOrder.findOne({
    where,
    include: [
      { model: PurchaseOrderLine, as: 'lines', separate: true, order: [['id', 'ASC']] },
      { model: POApproval, as: 'approvals' },
    ],
  }) as POLoaded | null;

  const po = must(poRaw, 'PO not found', 404);

  const totals = (po.lines || []).reduce(
    (acc, l) => {
      acc.totalOrderedQty += l.ordered_qty;
      acc.subtotal += Number(l.ordered_qty) * Number(l.unit_cost);
      acc.tax += Number(l.ordered_qty) * Number(l.unit_cost) * Number(l.tax_pct || 0) / 100;
      return acc;
    },
    { currency: po.currency, totalOrderedQty: 0, subtotal: 0, tax: 0 }
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
    // Avoid createdAt/created_at mismatch -> order by po_date then id
    order: [['po_date', 'DESC'], ['id', 'DESC']],
    limit: Math.min(Number(limit) || 50, 200),
    offset: (Math.max(Number(page) || 1, 1) - 1) * (Number(limit) || 50),
    include: [
      { model: PurchaseOrderLine, as: 'lines', attributes: ['ordered_qty', 'unit_cost', 'tax_pct', 'qc_pass_qty', 'qc_fail_qty'] },
    ],
  });

  const items = rows.map(po => {
    const lines = ((po as unknown as POLoaded).lines) || [];
    const subtotal = lines.reduce((a, l) => a + Number(l.ordered_qty) * Number(l.unit_cost), 0);
    const tax = lines.reduce((a, l) => a + Number(l.ordered_qty) * Number(l.unit_cost) * Number(l.tax_pct || 0) / 100, 0);
    const totalOrderedQty = lines.reduce((a, l) => a + Number(l.ordered_qty), 0);
    const totalAccountedQty = lines.reduce((a, l) => a + Number(l.qc_pass_qty || 0) + Number(l.qc_fail_qty || 0), 0);
    return { ...po.toJSON(), subtotal, tax, totalOrderedQty, totalAccountedQty };
  });

  return { items, total: count, page: Number(page) || 1, limit: Number(limit) || 50 };
}

export async function updatePO(id: string, patch: Partial<CreatePOInput>, actorId?: string) {
  return PurchaseOrder.sequelize!.transaction(async (t) => {
    const po = must(await PurchaseOrder.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE }), 'PO not found', 404);
    assertx(!po.locked, 'PO is locked once inbound starts. Edits not allowed');
    assertx([POStatus.DRAFT, POStatus.OPEN].includes(po.status), 'Only DRAFT/OPEN POs can be edited');

    await po.update({
      vendor_name: patch.vendorName ?? po.vendor_name,
      expected_date: patch.expectedDate ? new Date(patch.expectedDate) : po.expected_date,
      currency: patch.currency ?? po.currency,
      payment_terms: patch.paymentTerms ?? po.payment_terms,
      site_id: patch.siteId ?? po.site_id,
      updated_by: actorId ?? null,
    }, { transaction: t });

    if (patch.lines) {
      const receipts = await PurchaseOrderLine.count({
        where: {
          po_id: id,
          [Op.or]: [
            { received_qty: { [Op.gt]: 0 } },
            { qc_pass_qty: { [Op.gt]: 0 } },
            { qc_fail_qty: { [Op.gt]: 0 } },
          ],
        },
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

    eventBus?.emit(EVENTS.PO_UPDATED, { id, poNo: po.po_no });
    return getPO(id);
  });
}

export async function submitPO(id: string, actorId?: string) {
  const poRaw = await PurchaseOrder.findByPk(id, {
    include: [{ model: POApproval, as: 'approvals' }],
  }) as (PurchaseOrder & { approvals?: POApproval[] }) | null;

  const po = must(poRaw, 'PO not found', 404);

  const approvals = po.approvals ?? [];
  const allApproved = FLOW.every(stage =>
    approvals.find(a => a.stage === stage && a.status === ApprovalStatus.APPROVED)
  );
  assertx(allApproved, 'PO not fully approved yet', 409);

  await po.update({ status: POStatus.OPEN, updated_by: actorId ?? null });
  eventBus?.emit(EVENTS.PO_UPDATED, { id: po.id, poNo: po.po_no, status: POStatus.OPEN });
  return getPO(id);
}

export async function lockPO(id: string, actorId?: string) {
  const po = must(await PurchaseOrder.findByPk(id), 'PO not found', 404);
  await po.update({ locked: true, status: POStatus.INBOUND_IN_PROGRESS, updated_by: actorId ?? null });
  eventBus?.emit(EVENTS.PO_LOCKED, { id: po.id, poNo: po.po_no });
  return getPO(id);
}

export async function applyGRN(id: string, lines: ApplyGRNLine[], actorId?: string) {
  assertx(lines?.length, 'No GRN lines supplied');

  return PurchaseOrder.sequelize!.transaction(async (t: Transaction) => {
    const po = must(
      await PurchaseOrder.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE }),
      'PO not found',
      404
    );

    assertx(
      [POStatus.OPEN, POStatus.INBOUND_IN_PROGRESS, POStatus.PARTIAL_GRN].includes(po.status),
      'PO is not in a receivable state'
    );

    if (!po.locked) {
      await po.update({ locked: true, status: POStatus.INBOUND_IN_PROGRESS, updated_by: actorId ?? null }, { transaction: t });
    }

    for (const d of lines) {
      const line = must(
        await PurchaseOrderLine.findOne({
          where: { po_id: id, sku: d.sku },
          transaction: t,
          lock: t.LOCK.UPDATE,
        }),
        `SKU ${d.sku} not found in PO`
      );

      const r = Math.max(0, d.receivedQty || 0);
      const p = Math.max(0, d.qcPassQty || 0);
      const f = Math.max(0, d.qcFailQty || 0);
      assertx(p + f <= r || r === 0, `For ${d.sku}, qcPass + qcFail cannot exceed received`);

      const received_qty = Number(line.received_qty || 0) + r;
      const qc_pass_qty = Number(line.qc_pass_qty || 0) + p;
      const qc_fail_qty = Number(line.qc_fail_qty || 0) + f;

      const accounted = qc_pass_qty + qc_fail_qty;
      if (accounted > Number(line.ordered_qty)) {
        const e: any = new Error(`Over-receipt for SKU ${d.sku}. Requires approval.`);
        e.status = 409;
        throw e;
      }

      const reasonsSet = new Set<string>(Array.isArray(line.reasons) ? (line.reasons as any) : []);
      (d.reasonCodes || []).forEach(c => reasonsSet.add(c));

      const status = computeLineStatus(Number(line.ordered_qty), qc_pass_qty, qc_fail_qty);

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
    const newStatus = rollupPOStatus(true, allLines.map(l => l.status));
    await po.update({ status: newStatus, updated_by: actorId ?? null }, { transaction: t });

    eventBus?.emit(EVENTS.PO_GRN_APPLIED, { id: po.id, status: newStatus });
    return getPO(id);
  });
}

export async function closePO(id: string, _reason?: string, actorId?: string) {
  return PurchaseOrder.sequelize!.transaction(async (t) => {
    const po = must(await PurchaseOrder.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE }), 'PO not found', 404);

    const lines = await PurchaseOrderLine.findAll({ where: { po_id: id }, transaction: t, lock: t.LOCK.UPDATE });
    assertx(lines.length > 0, 'PO has no lines');

    const allClosed = lines.every(l =>
      computeLineStatus(Number(l.ordered_qty), Number(l.qc_pass_qty || 0), Number(l.qc_fail_qty || 0)) === POLineStatus.CLOSED
    );
    assertx(allClosed, 'Cannot close PO: some lines are not fully accounted (need APPROVAL to force-close)', 409);

    await po.update({ status: POStatus.CLOSED, updated_by: actorId ?? null }, { transaction: t });
  }).then(async () => {
    const po = await getPO(id);
    eventBus?.emit(EVENTS.PO_CLOSED, { id: (po as any).id, poNo: (po as any).po_no });
    return po;
  });
}

// ---- approvals ----

export async function approvePO(id: string, stage: ApprovalStage, comment: string | undefined, actor: any) {
  assertx(FLOW.includes(stage), 'Unknown approval stage');

  return PurchaseOrder.sequelize!.transaction(async (t) => {
    const poRaw = await PurchaseOrder.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      include: [{ model: POApproval, as: 'approvals' }],
    }) as (PurchaseOrder & { approvals?: POApproval[] }) | null;

    const po = must(poRaw, 'PO not found', 404);
    assertx(po.status !== POStatus.REJECTED, 'PO already rejected');

    await ensureApprovalSeed(id, t);

    const approvals = po.approvals ?? [];
    const firstPending = FLOW.find(s => !approvals.find(a => a.stage === s && a.status === ApprovalStatus.APPROVED));
    assertx(firstPending === stage, `Out of order. Next required stage is ${firstPending}`);

    const row = must(approvals.find(a => a.stage === stage), 'Approval row missing');
    await row.update({
      status: ApprovalStatus.APPROVED,
      approver_id: actor?.id ?? 'system',
      approver_name: actor?.name ?? actor?.role ?? 'system',
      comment: comment ?? null,
      decided_at: new Date(),
    }, { transaction: t });

    const newStatus = nextAwaitingStatus(stage);
    await po.update({ status: newStatus, updated_by: actor?.id ?? null }, { transaction: t });

    return getPO(id);
  });
}

export async function rejectPO(id: string, stage: ApprovalStage, reason: string | undefined, actor: any) {
  assertx(FLOW.includes(stage), 'Unknown approval stage');

  return PurchaseOrder.sequelize!.transaction(async (t) => {
    const poRaw = await PurchaseOrder.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      include: [{ model: POApproval, as: 'approvals' }],
    }) as (PurchaseOrder & { approvals?: POApproval[] }) | null;

    const po = must(poRaw, 'PO not found', 404);
    await ensureApprovalSeed(id, t);

    const approvals = po.approvals ?? [];
    const firstPending = FLOW.find(s => !approvals.find(a => a.stage === s && a.status === ApprovalStatus.APPROVED));
    assertx(firstPending === stage, `Out of order. Current stage is ${firstPending}`);

    const row = must(approvals.find(a => a.stage === stage), 'Approval row missing');
    await row.update({
      status: ApprovalStatus.REJECTED,
      approver_id: actor?.id ?? 'system',
      approver_name: actor?.name ?? actor?.role ?? 'system',
      comment: reason ?? null,
      decided_at: new Date(),
    }, { transaction: t });

    await po.update({ status: POStatus.REJECTED, updated_by: actor?.id ?? null }, { transaction: t });
    return getPO(id);
  });
}
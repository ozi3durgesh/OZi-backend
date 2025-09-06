import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
import { ResponseHandler } from '../middleware/responseHandler';
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Approval Emails
const approvalEmails: Record<string, string> = {
  category_head: 'ozipurchaseorders@gmail.com',
  admin: 'ankit.gupta@ozi.in',
  vendor: 'ozipurchaseorders@gmail.com'
};

/**
 * Token Utilities
 */
function generateApprovalToken(poId: number, role: string, expiresInMinutes = 60) {
  const payload = {
    po_id: poId,
    role,
    exp: Date.now() + expiresInMinutes * 60 * 1000
  };
  const stringData = JSON.stringify(payload);

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.TOKEN_SECRET!, "hex"),
    Buffer.alloc(16, 0) // static IV for simplicity
  );
  let encrypted = cipher.update(stringData, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

function decryptApprovalToken(token: string) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.TOKEN_SECRET!, "hex"),
    Buffer.alloc(16, 0)
  );
  let decrypted = decipher.update(token, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

/**
 * Send Approval Email
 */
async function sendApprovalEmail(po: any, role: 'category_head' | 'admin' | 'vendor') {
  let productLines = '';
  for (const p of po.products ?? []) {
    productLines += `${p.product} | SKU: ${p.sku_id} | Units: ${p.units} | MRP: ₹${p.mrp} | Amount: ₹${p.amount}\n`;
  }

  let approvalLink = "";
  if (role !== "vendor") {
    const token = generateApprovalToken(po.id, role, 60); // 1 hour expiry
    approvalLink = `${process.env.APP_BASE_URL_FRONTEND}/po-approval/${encodeURIComponent(token)}`;
  }

  const mailOptions: any = {
    from: process.env.EMAIL_USER,
    to: approvalEmails[role],
    subject: `PO ${po.po_id} - ${role === "vendor" ? "Purchase Order" : "Approval Request"}`,
    text: `Dear ${role.replace('_', ' ')},

Vendor: ${po.vendor_name}
PO Amount: ₹${po.total_amount}
PO ID: ${po.po_id}

Products:
${productLines}

${role !== "vendor" ? `Approval Link: ${approvalLink}` : "Please find the attached Purchase Order."}

Thanks,
Ozi Technologies`
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${role}: ${approvalEmails[role]}`);
}

/**
 * Create Purchase Order
 */
export const createPurchaseOrder = async (req: Request, res: Response) => {
  const { vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
    payment_term, payment_mode, purchase_date, expected_delivery_date,
    shipping_address, billing_address, products } = req.body;

  try {
    const totalAmount = products.reduce((sum: number, prod: any) => sum + prod.amount, 0);
    const totalUnits = products.reduce((sum: number, prod: any) => sum + prod.units, 0);
    const totalSkus = products.length;
    const base_price = products.reduce(
      (sum: number, prod: any) => sum + prod.mrp * prod.units / (1 + parseFloat(prod.total_gst)),
      0
    );

    let latestPo = await PurchaseOrder.findOne({
      order: [['id', 'DESC']],
      attributes: ['po_id']
    });

    let lastPoNumber = 0;
    if (latestPo) lastPoNumber = parseInt(latestPo.po_id.replace('OZIPO', ''), 10) || 0;
    let nextPoId = `OZIPO${lastPoNumber + 1}`;
    while (await PurchaseOrder.findOne({ where: { po_id: nextPoId } })) {
      lastPoNumber++;
      nextPoId = `OZIPO${lastPoNumber + 1}`;
    }

    const newPo = await PurchaseOrder.create({
      po_id: nextPoId,
      vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
      payment_term, payment_mode, purchase_date, expected_delivery_date,
      shipping_address, billing_address,
      total_amount: totalAmount,
      total_units: totalUnits,
      total_skus: totalSkus,
      base_price,
      approval_status: 'pending',
      current_approver: 'category_head'
    });

    const productRecords = products.map((p: any) => ({
      po_id: newPo.id,
      product: p.product,
      sku_id: p.sku_id,
      item_code: p.item_code,
      units: p.units,
      mrp: p.mrp,
      margin: p.margin,
      rlp_w_o_tax: p.rlp_w_o_tax,
      total_gst: p.total_gst,
      amount: p.amount
    }));
    await POProduct.bulkCreate(productRecords);

    const poWithProducts = await PurchaseOrder.findByPk(newPo.id, {
      include: [{ model: POProduct, as: 'products' }]
    });

    if (poWithProducts) {
      // Send to category head first
      await sendApprovalEmail(poWithProducts, 'category_head');

      return ResponseHandler.success(res, {
        PO: { message: 'PO created, approval link sent to category head', po_id: newPo.po_id }
      }, 201);
    }

    return ResponseHandler.error(res, 'PO creation failed', 500);
  } catch (error: any) {
    console.error('Error creating PO:', error);
    return ResponseHandler.error(res, error.message || 'Error creating PO', 500);
  }
};

/**
 * Approve / Reject PO
 */
export const approvePO = async (req: Request, res: Response) => {
  const role = (req.body.role || req.query.role) as 'category_head' | 'admin';
  const action = (req.body.action || req.query.action) as 'approve' | 'reject';
  const reason = (req.body.reason || req.query.reason) as string;

  if (!['category_head', 'admin'].includes(role)) {
    return ResponseHandler.error(res, 'Invalid role', 400);
  }

  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: POProduct, as: 'products' }]
    });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);

    if (action === 'reject') {
      po.approval_status = 'rejected';
      (po as any).rejection_reason = reason || `${role} rejected the PO`;
      po.current_approver = null;
      await po.save();
      return ResponseHandler.success(res, {
        PO: { message: `PO rejected by ${role}`, po_id: po.po_id }
      }, 200);
    }

    if (action === 'approve') {
      let nextRole: 'admin' | null = null;

      if (role === 'category_head') nextRole = 'admin';
      else if (role === 'admin') {
        // Send to vendor (no approval required)
        await sendApprovalEmail(po, 'vendor');
        po.approval_status = 'approved';
        po.current_approver = null;
        await po.save();
        return ResponseHandler.success(res, {
          PO: { message: `PO fully approved`, po_id: po.po_id }
        }, 200);
      }

      po.approval_status = role;
      po.current_approver = nextRole;
      await po.save();

      if (nextRole) {
        await sendApprovalEmail(po, nextRole);
      }

      return ResponseHandler.success(res, {
        PO: { message: `PO approved by ${role}`, po_id: po.po_id }
      }, 200);
    }

    return ResponseHandler.error(res, 'Invalid action', 400);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error approving PO', 500);
  }
};

/**
 * Get All POs
 */
export const getAllPOs = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", status } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (status) whereClause.approval_status = status;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [{ model: POProduct, as: 'products' }],
      limit: limitNum,
      offset,
      order: [['id', 'DESC']]
    });

    return ResponseHandler.success(res, {
      PO: rows,
      pagination: { total: count, page: pageNum, pages: Math.ceil(count / limitNum), limit: limitNum }
    });
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching POs', 500);
  }
};

/**
 * Get PO by ID
 */
export const getPOById = async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: POProduct, as: 'products' }]
    });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);

    return ResponseHandler.success(res, { PO: po }, 200);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching PO', 500);
  }
};

/**
 * Decode approval token (for frontend)
 */
export const getPOByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const payload = decryptApprovalToken(token);

    if (Date.now() > payload.exp) {
      return ResponseHandler.error(res, 'Token expired', 400);
    }

    const po = await PurchaseOrder.findByPk(payload.po_id, {
      include: [{ model: POProduct, as: 'products' }]
    });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);

    return ResponseHandler.success(res, { PO: po, role: payload.role }, 200);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Invalid token', 400);
  }
};

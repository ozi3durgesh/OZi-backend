import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
import Product from '../models/productModel';
import { ResponseHandler } from '../middleware/responseHandler';
import dotenv from 'dotenv';
import crypto from 'crypto';

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
  creator: 'ozipurchaseorders@gmail.com'
};

/** Token Utilities */
function generateApprovalToken(poId: number, role: string, expiresInMinutes = 60) {
  const payload = { po_id: poId, role, exp: Date.now() + expiresInMinutes * 60 * 1000 };
  const stringData = JSON.stringify(payload);

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.TOKEN_SECRET!, 'hex'),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(stringData, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decryptApprovalToken(token: string) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.TOKEN_SECRET!, 'hex'),
    Buffer.alloc(16, 0)
  );
  let decrypted = decipher.update(token, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

/** Send Approval Email */
async function sendApprovalEmail(po: any, role: 'category_head' | 'admin' | 'creator') {
  let productLines = '';
  for (const p of po.products ?? []) {
    productLines += `${p.product} | SKU: ${p.sku_id} | Units: ${p.units} | MRP: ₹${p.mrp} | SP: ₹${p.sp} | Amount: ₹${p.amount}\n`;
  }

  let approvalLink = '';
  if (role !== 'creator') {
    const token = generateApprovalToken(po.id, role, 60);
    approvalLink = `${process.env.APP_BASE_URL_FRONTEND}/po-approval/${encodeURIComponent(token)}`;
  }

  const mailOptions: any = {
    from: process.env.EMAIL_USER,
    to: approvalEmails[role],
    subject: `PO ${po.po_id} - ${role === 'creator' ? 'Purchase Order' : 'Approval Request'}`,
    text: `Dear ${role.replace('_', ' ')},

Vendor: ${po.vendor_name}
PO Amount: ₹${po.total_amount}
PO ID: ${po.po_id}

Products:
${productLines}

${role !== 'creator' ? `Approval Link: ${approvalLink}` : 'Please check the PO and submit PI details.'}

Thanks,
Ozi Technologies`
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${role}: ${approvalEmails[role]}`);
}

/** Create Draft or Final PO */
export const createPurchaseOrder = async (req: Request, res: Response) => {
  const { draft = true, vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
    payment_term, payment_mode, purchase_date, expected_delivery_date,
    shipping_address, billing_address, products,
    total_amount, total_units, total_skus, base_price } = req.body;

  try {
    // Generate PO ID robustly
    let nextPoId = 'OZIPO1';
    const latestPo = await PurchaseOrder.findOne({ order: [['id','DESC']] });
    if (latestPo && latestPo.po_id) {
      const lastPoNumber = parseInt(latestPo.po_id.replace('OZIPO','')) || 0;
      nextPoId = `OZIPO${lastPoNumber + 1}`;
    }

    console.log('Creating PO with po_id:', nextPoId);

    const newPo = await PurchaseOrder.create({
      po_id: nextPoId,
      vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
      payment_term, payment_mode, purchase_date, expected_delivery_date,
      shipping_address, billing_address,
      total_amount, total_units, total_skus, base_price,
      approval_status: draft ? 'draft' : 'pending',
      current_approver: draft ? null : 'category_head'
    });

    // Prepare product records
    const productRecords = products.map((p: any) => ({
      po_id: newPo.id,
      product: p.product,
      sku_id: p.sku_id,
      item_code: p.item_code,
      units: p.units,
      mrp: p.mrp,
      sp: p.sp,
      margin: p.margin,
      rlp: p.rlp,
      rlp_w_o_tax: p.rlp_w_o_tax,
      tax_type: p.tax_type,
      gst1: p.gst1,
      gst2: p.gst2,
      total_gst: p.total_gst,
      tax_amount: p.tax_amount,
      amount: p.amount
    }));

    await POProduct.bulkCreate(productRecords);

    const poWithProducts = await PurchaseOrder.findByPk(newPo.id, { include: [{ model: POProduct, as: 'products' }] });

    if (!draft && poWithProducts) {
      await sendApprovalEmail(poWithProducts, 'category_head');
    }

    return ResponseHandler.success(res, {
      PO: { message: draft ? 'Draft PO created' : 'PO created and sent for approval', po_id: newPo.po_id }
    }, 201);

  } catch (error: any) {
    console.error('Error creating PO:', error);
    return ResponseHandler.error(res, error.message || 'Error creating PO', 500);
  }
};

/** Update Draft PO */
export const updateDraftPO = async (req: Request, res: Response) => {
  const poId = req.params.id;
  const { products, ...poData } = req.body;

  try {
    const po = await PurchaseOrder.findByPk(poId, { include: [{ model: POProduct, as: 'products' }] });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);
    if (po.approval_status !== 'draft') return ResponseHandler.error(res, 'Only draft POs can be updated', 400);

    await po.update(poData);

    if (products) {
      await POProduct.destroy({ where: { po_id: po.id } });
      const productRecords = products.map((p: any) => ({
        po_id: po.id,
        product: p.product,
        sku_id: p.sku_id,
        item_code: p.item_code,
        units: p.units,
        mrp: p.mrp,
        sp: p.sp,
        margin: p.margin,
        rlp: p.rlp,
        rlp_w_o_tax: p.rlp_w_o_tax,
        tax_type: p.tax_type,
        gst1: p.gst1,
        gst2: p.gst2,
        total_gst: p.total_gst,
        tax_amount: p.tax_amount,
        amount: p.amount
      }));
      await POProduct.bulkCreate(productRecords);
    }

    return ResponseHandler.success(res, { PO: { message: 'Draft PO updated', po_id: po.po_id } }, 200);

  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error updating PO', 500);
  }
};

/** Submit Draft PO */
export const submitDraftPO = async (req: Request, res: Response) => {
  const poId = req.params.id;
  try {
    const po = await PurchaseOrder.findByPk(poId, { include: [{ model: POProduct, as: 'products' }] });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);
    if (po.approval_status !== 'draft') return ResponseHandler.error(res, 'Only draft POs can be submitted', 400);

    po.approval_status = 'pending';
    po.current_approver = 'category_head';
    await po.save();

    await sendApprovalEmail(po, 'category_head');

    return ResponseHandler.success(res, { PO: { message: 'PO submitted for approval', po_id: po.po_id } }, 200);

  } catch(error:any){
    return ResponseHandler.error(res, error.message || 'Error submitting PO', 500);
  }
};

/** Approve / Reject PO */
export const approvePO = async (req: Request, res: Response) => {
  const role = (req.body.role || req.query.role) as 'category_head'|'admin';
  const action = (req.body.action || req.query.action) as 'approve'|'reject';
  const reason = (req.body.reason || req.query.reason) as string;

  if (!['category_head','admin'].includes(role)) {
    return ResponseHandler.error(res,'Invalid role for approval',400);
  }

  try {
    const po = await PurchaseOrder.findByPk(req.params.id, { include: [{ model: POProduct, as: 'products' }] });
    if (!po) return ResponseHandler.error(res,'PO not found',404);

    if (action === 'reject') {
      po.approval_status = 'rejected';
      po.rejection_reason = reason || `${role} rejected the PO`;
      po.current_approver = null;
      await po.save();
      return ResponseHandler.success(res,{PO:{message:`PO rejected by ${role}`, po_id: po.po_id}},200);
    }

    if (action === 'approve') {
      if (role === 'category_head') {
        po.approval_status = 'category_head';
        po.current_approver = 'admin';
        await po.save();
        await sendApprovalEmail(po,'admin');
        return ResponseHandler.success(res,{PO:{message:'PO approved by Category Head, sent to Admin', po_id: po.po_id}},200);
      }

      if (role === 'admin') {
        po.approval_status = 'admin';
        po.current_approver = 'creator'; // Hand over to creator for PI
        await po.save();
        await sendApprovalEmail(po,'creator');
        return ResponseHandler.success(res,{PO:{message:'PO approved by Admin, sent to Creator for PI', po_id: po.po_id}},200);
      }
    }

    return ResponseHandler.error(res,'Invalid action',400);

  } catch(error:any){
    return ResponseHandler.error(res,error.message||'Error approving PO',500);
  }
};

/** Save PI / Final Delivery (Creator action) */
export const savePI = async (req: Request, res: Response) => {
  const poId = req.params.id;
  const { pi_number, pi_url, final_delivery_date } = req.body;

  try {
    const po = await PurchaseOrder.findByPk(poId);
    if (!po) return ResponseHandler.error(res,'PO not found',404);

    if (po.current_approver !== 'creator') {
      return ResponseHandler.error(res,'PI can only be saved when Creator is responsible',400);
    }

    po.pi_number = pi_number;
    po.pi_url = pi_url;
    po.final_delivery_date = final_delivery_date;
    po.approval_status = 'approved';
    po.current_approver = null;
    await po.save();

    return ResponseHandler.success(res,{PO:{message:'PI & Delivery details saved, PO completed', po_id: po.po_id}},200);

  } catch(error:any){
    return ResponseHandler.error(res,error.message||'Error saving PI',500);
  }
};

/** Get All POs */
export const getAllPOs = async (req: Request,res: Response)=>{
  try{
    const { page="1", limit="20", status } = req.query;
    const pageNum=parseInt(String(page),10);
    const limitNum=parseInt(String(limit),10);
    const offset=(pageNum-1)*limitNum;

    const whereClause:any={};
    if(status) whereClause.approval_status=status;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
  where: whereClause,
  include: [
    {
      model: POProduct,
      as: "products",
      include: [
        {
          model: Product,
          as: "productInfo",   // 👈 updated alias
          attributes: ["EAN_UPC"],
        },
      ],
    },
  ],
  limit: limitNum,
  offset,
  order: [["id", "DESC"]],
});

// flatten EAN_UPC into products
const data = rows.map((po) => ({
  ...po.toJSON(),
  products: (po.products ?? []).map((p: any) => ({
  ...p.toJSON(),
  EAN_UPC: p.productInfo?.EAN_UPC || null,
  productInfo: undefined,
  })),
}));

    return ResponseHandler.success(res,{
      PO:rows,
      pagination:{total:count, page:pageNum, pages:Math.ceil(count/limitNum), limit:limitNum}
    });
  }catch(error:any){
    return ResponseHandler.error(res,error.message||'Error fetching POs',500);
  }
};

/** Get PO by ID */
export const getPOById = async (req: Request,res: Response)=>{
  try{
    const po = await PurchaseOrder.findByPk(req.params.id,{include:[{model:POProduct, as:'products'}]});
    if(!po) return ResponseHandler.error(res,'PO not found',404);

    return ResponseHandler.success(res,{PO:po},200);
  }catch(error:any){
    return ResponseHandler.error(res,error.message||'Error fetching PO',500);
  }
};

/** Get PO by Token */
export const getPOByToken = async (req: Request,res: Response)=>{
  try{
    const { token } = req.params;
    const payload = decryptApprovalToken(token);

    if(Date.now()>payload.exp) return ResponseHandler.error(res,'Token expired',400);

    const po = await PurchaseOrder.findByPk(payload.po_id,{include:[{model:POProduct, as:'products'}]});
    if(!po) return ResponseHandler.error(res,'PO not found',404);

    return ResponseHandler.success(res,{PO:po, role:payload.role},200);

  }catch(error:any){
    return ResponseHandler.error(res,error.message||'Invalid token',400);
  }
};

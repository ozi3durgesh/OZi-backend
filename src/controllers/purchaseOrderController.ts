import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
import { ResponseHandler } from '../middleware/responseHandler';
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

// AWS S3 Client
const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = "oms-stage-storage"; // your bucket
const FOLDER_NAME = "po-approval-pdf";   // folder inside bucket

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Approval Emails
const approvalEmails: Record<string, string> = {
  category_head: 'ankit.gupta@ozi.in',
  admin: 'ozipurchaseorders@gmail.com',
  vendor: 'ankit.gupta@ozi.in'
};

// Utility to calculate total
function calculateTotalAmount(products: any[]) {
  return products.reduce((sum, prod) => sum + prod.amount, 0);
}

// Generate PDF in memory
async function generatePOPdf(po: any, products: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: any[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(18).text("PURCHASE ORDER", { align: "center", underline: true });
      doc.moveDown();

      doc.fontSize(12).text(`PO No: ${po.po_id ?? 'N/A'}`);
      doc.text(`PO Date: ${po.purchase_date ?? 'N/A'}`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Vendor Details:");
      doc.font("Helvetica").text(`Vendor: ${po.vendor_name ?? 'N/A'}`);
      doc.text(`Vendor Tax ID: ${po.vendor_tax_id ?? 'N/A'}`);
      doc.text(`POC: ${(po.poc_name ?? 'N/A')} (${po.poc_phone ?? 'N/A'})`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Order Details:");
      doc.font("Helvetica").text(`Payment Term: ${po.payment_term ?? 'N/A'}`);
      doc.text(`Payment Mode: ${po.payment_mode ?? 'N/A'}`);
      doc.text(`Expected Delivery: ${po.expected_delivery_date ?? 'N/A'}`);
      doc.moveDown();

      doc.font("Helvetica-Bold");
      doc.text("Product", 50, doc.y, { continued: true });
      doc.text("SKU", 200, doc.y, { continued: true });
      doc.text("Units", 280, doc.y, { continued: true });
      doc.text("MRP", 340, doc.y, { continued: true });
      doc.text("Amount", 420);
      doc.moveDown();
      doc.font("Helvetica");

      products.forEach((p: any) => {
        const productName = p.product ?? 'N/A';
        const skuId = p.sku_id ?? 'N/A';
        const units = p.units != null ? p.units.toString() : '0';
        const mrp = p.mrp != null ? `₹${p.mrp}` : '₹0';
        const amount = p.amount != null ? `₹${p.amount}` : '₹0';

        doc.text(productName, 50, doc.y, { continued: true });
        doc.text(skuId, 200, doc.y, { continued: true });
        doc.text(units, 280, doc.y, { continued: true });
        doc.text(mrp, 340, doc.y, { continued: true });
        doc.text(amount, 420);
      });

      doc.moveDown();

      doc.font("Helvetica-Bold");
      doc.text(`TOTAL UNITS: ${po.total_units ?? 0}`);
      doc.text(`TOTAL SKUS: ${po.total_skus ?? 0}`);
      doc.text(`BASE PRICE: ₹${Number(po.base_price ?? 0).toFixed(2)}`);
      doc.text(`TOTAL AMOUNT: ₹${Number(po.total_amount ?? 0).toFixed(2)}`);
      doc.moveDown();

      doc.text("For Ozi Technologies Pvt Ltd", { align: "right" });
      doc.text("Authorised Signatory", { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Upload PDF to S3 inside folder
async function uploadPdfToS3(buffer: Buffer, fileName: string) {
  const key = `${FOLDER_NAME}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
  });

  await s3.send(command);

  return `https://${BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${key}`;
}

// Send Approval Email
async function sendApprovalEmail(po: any, role: 'category_head' | 'admin' | 'vendor', pdfBuffer?: Buffer, s3Url?: string) {
  let productLines = '';
  for (const p of po.products ?? []) {
    productLines += `${p.product} | SKU: ${p.sku_id} | Units: ${p.units} | MRP: ₹${p.mrp} | Amount: ₹${p.amount}\n`;
  }

  const approveUrl = `${process.env.APP_BASE_URL}/api/purchase-orders/${po.id}/approve?role=${role}&action=approve`;
  const rejectUrl = `${process.env.APP_BASE_URL}/api/purchase-orders/${po.id}/approve?role=${role}&action=reject`;

  const mailOptions: any = {
    from: process.env.EMAIL_USER,
    to: approvalEmails[role],
    subject: `PO ${po.po_id} - Approval Request`,
    text: `Dear ${role.replace('_', ' ')},

Please review the Purchase Order and approve/reject it.

Vendor: ${po.vendor_name}
PO Amount: ₹${po.total_amount}
PO ID: ${po.po_id}

Products:
${productLines}

Approve: ${approveUrl}
Reject: ${rejectUrl}

PDF Link: ${s3Url || 'Attached'}
    
Thanks,
Ozi Technologies`,
  };

  if (pdfBuffer) {
    mailOptions.attachments = [{
      filename: `PO_${po.po_id}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf"
    }];
  }

  await transporter.sendMail(mailOptions);
  console.log(`Approval email sent to ${role}: ${approvalEmails[role]}`);
}

// Create Purchase Order
export const createPurchaseOrder = async (req: Request, res: Response) => {
  const { vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
    payment_term, payment_mode, purchase_date, expected_delivery_date,
    shipping_address, billing_address, products } = req.body;

  try {
    const totalAmount = calculateTotalAmount(products);
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
      const pdfBuffer = await generatePOPdf(poWithProducts, poWithProducts.products ?? []);
      const s3Url = await uploadPdfToS3(pdfBuffer, `PO_${poWithProducts.po_id}.pdf`);

      // Send to category head
      await sendApprovalEmail(poWithProducts, 'category_head', pdfBuffer, s3Url);

      return ResponseHandler.success(res, { 
        PO: { message: 'PO created, PDF uploaded to S3', po_id: newPo.po_id, pdf_url: s3Url } 
      }, 201);
    }

    return ResponseHandler.error(res, 'PO creation failed', 500);
  } catch (error: any) {
    console.error('Error creating PO:', error);
    return ResponseHandler.error(res, error.message || 'Error creating PO', 500);
  }
};

// Approve / Reject PO
export const approvePO = async (req: Request, res: Response) => {
  const role = (req.body.role || req.query.role) as 'category_head' | 'admin' | 'vendor';
  const action = (req.body.action || req.query.action) as 'approve' | 'reject';
  const reason = (req.body.reason || req.query.reason) as string;

  if (!['category_head', 'admin', 'vendor'].includes(role)) {
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
      return ResponseHandler.success(res, { PO: { message: `PO rejected by ${role}`, po_id: po.po_id } }, 200);
    }

    if (action === 'approve') {
      let nextRole: 'admin' | 'vendor' | null = null;

      if (role === 'category_head') nextRole = 'admin';
      else if (role === 'admin') nextRole = 'vendor';
      else if (role === 'vendor') {
        po.approval_status = 'approved';
        po.current_approver = null;
        await po.save();
        return ResponseHandler.success(res, { PO: { message: `PO fully approved`, po_id: po.po_id } }, 200);
      }

      po.approval_status = role;
      po.current_approver = nextRole;
      await po.save();

      if (nextRole) {
        const pdfBuffer = await generatePOPdf(po, po.products ?? []);
        const s3Url = await uploadPdfToS3(pdfBuffer, `PO_${po.po_id}.pdf`);
        await sendApprovalEmail(po, nextRole, pdfBuffer, s3Url);
      }

      return ResponseHandler.success(res, { PO: { message: `PO approved by ${role}`, po_id: po.po_id } }, 200);
    }

    return ResponseHandler.error(res, 'Invalid action', 400);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error approving PO', 500);
  }
};

// Get All POs
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

// Get PO by ID
export const getPOById = async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: POProduct, as: 'products' }]
    });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);
    return ResponseHandler.success(res, { PO: po }, 200);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching POs', 500);
  }
};

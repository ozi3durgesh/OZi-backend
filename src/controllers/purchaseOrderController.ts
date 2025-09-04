import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
import { ResponseHandler } from '../middleware/responseHandler';
import dotenv from "dotenv";
import PDFDocument from "pdfkit";

dotenv.config();

// 📧 Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// 📧 Approval Emails
const approvalEmails: Record<string, string> = {
  category_head: 'ankit.gupta@ozi.in',
  admin: 'ozipurchaseorders@gmail.com',
  vendor: 'ankit.gupta@ozi.in'
};

// 🧮 Utility to calculate totals
function calculateTotalAmount(products: any[]) {
  return products.reduce((sum, prod) => sum + prod.amount, 0);
}

// 📝 Generate PDF in memory (Buffer)
async function generatePOPdf(po: any, products: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: any[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(18).text("PURCHASE ORDER", { align: "center", underline: true });
      doc.moveDown();

      doc.fontSize(12).text(`PO No: ${po.po_id ?? 'N/A'}`);
      doc.text(`PO Date: ${po.purchase_date ?? 'N/A'}`);
      doc.moveDown();

      // Vendor details
      doc.font("Helvetica-Bold").text("Vendor Details:");
      doc.font("Helvetica").text(`Vendor: ${po.vendor_name ?? 'N/A'}`);
      doc.text(`Vendor Tax ID: ${po.vendor_tax_id ?? 'N/A'}`);
      doc.text(`POC: ${(po.poc_name ?? 'N/A')} (${po.poc_phone ?? 'N/A'})`);
      doc.moveDown();

      // Order details
      doc.font("Helvetica-Bold").text("Order Details:");
      doc.font("Helvetica").text(`Payment Term: ${po.payment_term ?? 'N/A'}`);
      doc.text(`Payment Mode: ${po.payment_mode ?? 'N/A'}`);
      doc.text(`Expected Delivery: ${po.expected_delivery_date ?? 'N/A'}`);
      doc.moveDown();

      // Product Table Header
      doc.font("Helvetica-Bold");
      doc.text("Product", 50, doc.y, { continued: true });
      doc.text("SKU", 200, doc.y, { continued: true });
      doc.text("Units", 280, doc.y, { continued: true });
      doc.text("MRP", 340, doc.y, { continued: true });
      doc.text("Amount", 420);
      doc.moveDown();
      doc.font("Helvetica");

      // Product Rows - Defensive
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

      // Totals - Defensive
      doc.font("Helvetica-Bold");
      const totalUnits = po.total_units ?? 0;
      const totalSkus = po.total_skus ?? 0;
      const basePrice = Number(po.base_price ?? 0);
      const totalAmount = Number(po.total_amount ?? 0);

      doc.text(`TOTAL UNITS: ${totalUnits}`);
      doc.text(`TOTAL SKUS: ${totalSkus}`);
      doc.text(`BASE PRICE: ₹${basePrice.toFixed(2)}`);
      doc.text(`TOTAL AMOUNT: ₹${totalAmount.toFixed(2)}`);
      doc.moveDown();

      // Footer
      doc.text("For Ozi Technologies Pvt Ltd", { align: "right" });
      doc.text("Authorised Signatory", { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// 📧 Send Approval Email
async function sendApprovalEmail(
  po: any,
  role: 'category_head' | 'admin' | 'vendor',
  pdfBuffer: Buffer
) {
  let productLines = '';
  for (const p of po.products ?? []) {
    productLines += `${p.product} | SKU: ${p.sku_id} | Units: ${p.units} | MRP: ₹${p.mrp} | Amount: ₹${p.amount}\n`;
  }

  const approveUrl = `${process.env.APP_BASE_URL}/api/purchase-orders/${po.id}/approve?role=${role}&action=approve`;
  const rejectUrl = `${process.env.APP_BASE_URL}/api/purchase-orders/${po.id}/approve?role=${role}&action=reject`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: approvalEmails[role],
    subject: `PO ${po.po_id} - Approval Request`,
    text: `Dear ${role.replace('_', ' ')},

Please review the attached Purchase Order and approve/reject it.

Vendor: ${po.vendor_name}
PO Amount: ₹${po.total_amount}
PO ID: ${po.po_id}

Products:
${productLines}

Approve: ${approveUrl}
Reject: ${rejectUrl}

Thanks,
Ozi Technologies`,
    attachments: [
      {
        filename: `PO_${po.po_id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  };

  await transporter.sendMail(mailOptions);
  console.log(`Approval email sent to ${role}: ${approvalEmails[role]}`);
}

//
// 📌 Create Purchase Order
//
export const createPurchaseOrder = async (req: Request, res: Response) => {
  const {
    vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
    payment_term, payment_mode, purchase_date, expected_delivery_date,
    shipping_address, billing_address, products
  } = req.body;

  try {
    // 🧮 Calculate totals
    const totalAmount = calculateTotalAmount(products);
    const totalUnits = products.reduce((sum: number, prod: any) => sum + prod.units, 0);
    const totalSkus = products.length;
    const base_price = products.reduce(
      (sum: number, prod: any) => sum + prod.mrp * prod.units / (1 + parseFloat(prod.total_gst)),
      0
    );

    // 🔢 Generate next PO ID
    let latestPo = await PurchaseOrder.findOne({
      order: [['id', 'DESC']],
      attributes: ['po_id']
    });

    let lastPoNumber = 0;
    if (latestPo) {
      const latestPoId = latestPo.po_id;
      lastPoNumber = parseInt(latestPoId.replace('OZIPO', ''), 10) || 0;
    }

    let nextPoId = `OZIPO${lastPoNumber + 1}`;
    while (await PurchaseOrder.findOne({ where: { po_id: nextPoId } })) {
      lastPoNumber++;
      nextPoId = `OZIPO${lastPoNumber + 1}`;
    }

    // 📝 Create the PO
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

    // 📦 Save products
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

    // 🔎 Fetch PO with products
    const poWithProducts = await PurchaseOrder.findByPk(newPo.id, {
      include: [{ model: POProduct, as: 'products' }]
    });

    // ✅ Generate PDF in memory
    let pdfBuffer: Buffer | undefined;
    if (poWithProducts) {
      pdfBuffer = await generatePOPdf(poWithProducts, poWithProducts.products ?? []);
    }

    // 📧 Send to Category Head first
    if (pdfBuffer && poWithProducts) {
      await sendApprovalEmail(poWithProducts, 'category_head', pdfBuffer);
    }

    return ResponseHandler.success(
      res,
      { PO: { message: 'PO created and sent for Category Head approval', po_id: newPo.po_id } },
      201
    );
  } catch (error: any) {
    console.error('Error creating PO:', error);
    return ResponseHandler.error(res, error.message || 'Error creating PO', 500);
  }
};

//
// 📌 Approve / Reject PO
//
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

    // ❌ Rejected
    if (action === 'reject') {
      po.approval_status = 'rejected' as 'rejected';
      (po as any).rejection_reason = reason || `${role} rejected the PO`;
      po.current_approver = null;
      await po.save();

      return ResponseHandler.success(res, { 
        PO: { message: `PO rejected by ${role}`, po_id: po.po_id } 
      }, 200);
    }

    // ✅ Approved
    if (action === 'approve') {
      let nextRole: 'admin' | 'vendor' | null = null;

      if (role === 'category_head') nextRole = 'admin';
      else if (role === 'admin') nextRole = 'vendor';
      else if (role === 'vendor') {
        po.approval_status = 'approved' as 'approved';
        po.current_approver = null;
        await po.save();

        return ResponseHandler.success(res, { 
          PO: { message: `PO fully approved`, po_id: po.po_id } 
        }, 200);
      }

      // Update PO for next approver
      po.approval_status = role as 'category_head' | 'admin' | 'vendor';
      po.current_approver = nextRole;
      await po.save();

      // 📧 Generate PDF again & send to next approver
      if (nextRole) {
        const pdfBuffer = await generatePOPdf(po, po.products ?? []);
        await sendApprovalEmail(po, nextRole, pdfBuffer);
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

//
// 📌 Get all POs
//
export const getAllPOs = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", status } = req.query;

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (status) {
      whereClause.approval_status = status;
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [{ model: POProduct, as: 'products' }],
      limit: limitNum,
      offset,
      order: [['id', 'DESC']]
    });

    return ResponseHandler.success(res, {
      PO: rows,
      pagination: {
        total: count,
        page: pageNum,
        pages: Math.ceil(count / limitNum),
        limit: limitNum
      }
    });
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching POs', 500);
  }
};

//
// 📌 Get PO by ID
//
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

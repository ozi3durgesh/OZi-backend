import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
import { ResponseHandler } from '../middleware/responseHandler';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const approvalEmails: Record<string, string> = {
  category_head: 'ankitgupta13c@gmail.com',
  admin: 'ankitg13c@gmail.com',
  vendor: 'ankit.gupta@ozi.in'
};

// Utility to calculate totals
function calculateTotalAmount(products: any[]) {
  return products.reduce((sum, prod) => sum + prod.amount, 0);
}

// Send approval email
/*async function sendApprovalEmail(po: any, role: 'category_head' | 'admin' | 'vendor', pdfPath: string) {
  let productLines = '';
  for (const p of po.products) {
    productLines += `${p.product} | SKU: ${p.sku_id} | Units: ${p.units} | MRP: ₹${p.mrp} | Amount: ₹${p.amount}\n`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: approvalEmails[role],
    subject: `PO ${po.po_id} - Approval Request`,
    text: `Dear ${role.replace('_', ' ')},

Please review the attached Purchase Order and approve it.

Vendor: ${po.vendor_name}
PO Amount: ₹${po.total_amount}
PO ID: ${po.po_id}

Products:
${productLines}

Thanks,
Ozi Technologies`,
    attachments: [{ filename: `PO_${po.po_id}.pdf`, path: pdfPath }]
  };

  await transporter.sendMail(mailOptions);
  console.log(`Approval email sent to ${role}: ${approvalEmails[role]}`);
}
*/

// Create PO
export const createPurchaseOrder = async (req: Request, res: Response) => {
  const {
    vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
    payment_term, payment_mode, purchase_date, expected_delivery_date,
    shipping_address, billing_address, products, pdfPath
  } = req.body;

  try {
    // Calculate totals
    const totalAmount = calculateTotalAmount(products);
    const totalUnits = products.reduce((sum: number, prod: any) => sum + prod.units, 0);
    const totalSkus = products.length;
    const base_price = products.reduce(
      (sum: number, prod: any) => sum + prod.mrp * prod.units / (1 + parseFloat(prod.total_gst)),
      0
    );

    // Query the last inserted purchase order to get the latest po_id
    let latestPo = await PurchaseOrder.findOne({
      order: [['id', 'DESC']],
      attributes: ['po_id']
    });

    // Generate the next po_id
    let lastPoNumber = 0;
    if (latestPo) {
      const latestPoId = latestPo.po_id;
      lastPoNumber = parseInt(latestPoId.replace('OZIPO', ''), 10) || 0;
    }

    let nextPoId = `OZIPO${lastPoNumber + 1}`;

    // Ensure unique po_id
    while (await PurchaseOrder.findOne({ where: { po_id: nextPoId } })) {
      lastPoNumber++;
      nextPoId = `OZIPO${lastPoNumber + 1}`;
    }

    // Create the PO
    const newPo = await PurchaseOrder.create({
      po_id: nextPoId,
      vendor_id, vendor_name, poc_name, poc_phone, vendor_tax_id,
      payment_term, payment_mode, purchase_date, expected_delivery_date,
      shipping_address, billing_address,
      total_amount: totalAmount,
      total_units: totalUnits,
      total_skus: totalSkus,
      base_price,
      approval_status: 'pending'
    });

    // Save products
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

    // Fetch PO with products for email (email logic commented out for now)
    // const poWithProducts = await PurchaseOrder.findByPk(newPo.id, { include: [{ model: POProduct, as: 'products' }] });

    // Send PDF to Category Head (email logic commented out for now)
    // if (pdfPath && poWithProducts) await sendApprovalEmail(poWithProducts, 'category_head', pdfPath);

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

// Get all POs with pagination
export const getAllPOs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};
    if (status) {
      whereClause.approval_status = status; // ✅ Optional filter by status
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [{ model: POProduct, as: 'products' }],
      limit: parseInt(limit.toString()),
      offset,
      order: [['id', 'DESC']] // ✅ changed from createdAt → id
    });

    return ResponseHandler.success(res, {
      PO: rows,
      pagination: {
        total: count,
        page: parseInt(page.toString()),
        pages: Math.ceil(count / parseInt(limit.toString())),
        limit: parseInt(limit.toString())
      }
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
    return ResponseHandler.error(res, error.message || 'Error fetching PO', 500);
  }
};

// Approve PO
export const approvePO = async (req: Request, res: Response) => {
  const { role, pdfPath } = req.body; // role: category_head/admin/vendor
  if (!['category_head', 'admin', 'vendor'].includes(role)) {
    return ResponseHandler.error(res, 'Invalid role', 400);
  }

  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: POProduct, as: 'products' }]
    });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);

    po.approval_status = role;
    await po.save();

    let nextRole: 'admin' | 'vendor' | null = null;
    if (role === 'category_head') nextRole = 'admin';
    else if (role === 'admin') nextRole = 'vendor';

    //if (nextRole && pdfPath) await sendApprovalEmail(po, nextRole, pdfPath);

    return ResponseHandler.success(
      res,
      { PO: { message: `PO approved by ${role}`, po_id: po.po_id } },
      200
    );
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error approving PO', 500);
  }
};

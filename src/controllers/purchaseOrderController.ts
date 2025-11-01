import { Request, Response } from 'express';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
import Product from '../models/productModel';
import { ResponseHandler } from '../middleware/responseHandler';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import DirectInventoryService from '../services/DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';
import { EmailService } from '../services/emailService';

dotenv.config();

// Approval Emails
const approvalEmails: Record<string, string> = {
  category_head: 'durgesh.singh@ozi.in',
  admin: 'durgesh.singh@ozi.in',
  creator: 'durgesh.singh@ozi.in'
};

const upload = multer({ storage: multer.memoryStorage() });

// AWS S3 Client
const s3 = new S3Client({
  region: "ap-south-1", // Your AWS region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
  let approvalLink = '';
  if (role !== 'creator') {
    const token = generateApprovalToken(po.id, role, 60);
    approvalLink = `${process.env.APP_BASE_URL_FRONTEND}/po-approval/${encodeURIComponent(token)}`;
  }

  // Prepare products data for email
  const products = po.products?.map((p: any) => ({
    productName: p.product,
    sku: p.sku_id,
    quantity: p.units,
    unitPrice: p.mrp,
    totalAmount: p.amount
  })) || [];

  // Send email using new EmailService
  const success = await EmailService.sendDCApprovalEmail(
    [approvalEmails[role]],
    po.po_id,
    po.vendor_name,
    'N/A', // DC name not available in regular PO
    po.total_amount,
    'Normal', // Priority not available in regular PO
    products,
    approvalLink,
    role
  );

  if (success) {
    console.log(`Email sent to ${role}: ${approvalEmails[role]}`);
  } else {
    console.error(`Failed to send email to ${role}: ${approvalEmails[role]}`);
  }
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
      pending_qty: p.units,
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

    // Update inventory for each product in the PO
    console.log('🔄 Updating inventory for PO products...');
    const inventoryUpdates: Array<{
      sku: string;
      status: string;
      message: string;
      data?: any;
    }> = [];

    for (const product of products) {
      try {
        const inventoryResult = await DirectInventoryService.updateInventory({
          sku: product.sku_id,
          operation: INVENTORY_OPERATIONS.PO,
          quantity: product.units,
          referenceId: nextPoId,
          operationDetails: {
            po_id: nextPoId,
            product_name: product.product,
            vendor_name: vendor_name,
            purchase_date: purchase_date,
            expected_delivery_date: expected_delivery_date,
            mrp: product.mrp,
            sp: product.sp,
            rlp: product.rlp
          },
          performedBy: 1 // System user
        });

        if (inventoryResult.success) {
          console.log(`✅ Inventory updated for SKU ${product.sku_id}: +${product.units} units`);
          inventoryUpdates.push({
            sku: product.sku_id,
            status: 'success',
            message: inventoryResult.message,
            data: inventoryResult.data
          });
        } else {
          console.error(`❌ Inventory update failed for SKU ${product.sku_id}: ${inventoryResult.message}`);
          inventoryUpdates.push({
            sku: product.sku_id,
            status: 'failed',
            message: inventoryResult.message
          });
        }
      } catch (error: any) {
        console.error(`❌ Error updating inventory for SKU ${product.sku_id}:`, error.message);
        inventoryUpdates.push({
          sku: product.sku_id,
          status: 'error',
          message: error.message
        });
      }
    }

    const inventorySummary = {
      total_skus: products.length,
      successful_updates: inventoryUpdates.filter(u => u.status === 'success').length,
      failed_updates: inventoryUpdates.filter(u => u.status === 'failed').length,
      error_updates: inventoryUpdates.filter(u => u.status === 'error').length,
      updates: inventoryUpdates
    };

    const poWithProducts = await PurchaseOrder.findByPk(newPo.id, { include: [{ model: POProduct, as: 'products' }] });

    if (!draft && poWithProducts) {
      await sendApprovalEmail(poWithProducts, 'category_head');
    }

    return ResponseHandler.success(res, {
      PO: { 
        message: draft ? 'Draft PO created' : 'PO created and sent for approval', 
        po_id: newPo.po_id,
        inventory_summary: inventorySummary
      }
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
        pending_qty: p.units,
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
      
      // Reverse inventory when PO is rejected
      try {
        console.log(`🔄 Reversing inventory for rejected PO ${po.po_id}...`);
        const inventoryUpdates: Array<{
          sku: string;
          status: string;
          message: string;
        }> = [];

        for (const product of po.products || []) {
          try {
            const inventoryResult = await DirectInventoryService.updateInventory({
              sku: product.sku_id,
              operation: INVENTORY_OPERATIONS.PO,
              quantity: -product.units, // Negative quantity to reverse
              referenceId: po.po_id,
              operationDetails: {
                po_id: po.po_id,
                product_name: product.product,
                operation: 'po_rejection',
                rejected_date: new Date().toISOString()
              },
              performedBy: 1 // System user
            });

            if (inventoryResult.success) {
              console.log(`✅ PO inventory reversed for SKU ${product.sku_id}: -${product.units} units`);
              inventoryUpdates.push({
                sku: product.sku_id,
                status: 'success',
                message: inventoryResult.message
              });
            } else {
              console.error(`❌ PO inventory reversal failed for SKU ${product.sku_id}: ${inventoryResult.message}`);
              inventoryUpdates.push({
                sku: product.sku_id,
                status: 'failed',
                message: inventoryResult.message
              });
            }
          } catch (error: any) {
            console.error(`❌ Error reversing PO inventory for SKU ${product.sku_id}:`, error.message);
            inventoryUpdates.push({
              sku: product.sku_id,
              status: 'error',
              message: error.message
            });
          }
        }

        console.log(`✅ Inventory reversal completed for rejected PO ${po.po_id}:`, inventoryUpdates);
      } catch (inventoryError: any) {
        console.error(`❌ Inventory reversal failed for rejected PO ${po.po_id}:`, inventoryError.message);
      }
      
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

      // Admin or other authorized role approval
      po.approval_status = 'admin';
      po.current_approver = 'creator'; // Hand over to creator for PI
      await po.save();
        
        // Update inventory when PO is finally approved (move from PO to GRN)
        try {
          console.log(`🔄 Updating inventory for approved PO ${po.po_id}...`);
          const inventoryUpdates: Array<{
            sku: string;
            status: string;
            message: string;
          }> = [];

          for (const product of po.products || []) {
            try {
              const inventoryResult = await DirectInventoryService.updateInventory({
                sku: product.sku_id,
                operation: INVENTORY_OPERATIONS.GRN,
                quantity: product.units,
                referenceId: po.po_id,
                operationDetails: {
                  po_id: po.po_id,
                  product_name: product.product,
                  operation: 'po_approval',
                  approved_date: new Date().toISOString()
                },
                performedBy: 1 // System user
              });

              if (inventoryResult.success) {
                console.log(`✅ GRN inventory updated for SKU ${product.sku_id}: +${product.units} units`);
                inventoryUpdates.push({
                  sku: product.sku_id,
                  status: 'success',
                  message: inventoryResult.message
                });
              } else {
                console.error(`❌ GRN inventory update failed for SKU ${product.sku_id}: ${inventoryResult.message}`);
                inventoryUpdates.push({
                  sku: product.sku_id,
                  status: 'failed',
                  message: inventoryResult.message
                });
              }
            } catch (error: any) {
              console.error(`❌ Error updating GRN inventory for SKU ${product.sku_id}:`, error.message);
              inventoryUpdates.push({
                sku: product.sku_id,
                status: 'error',
                message: error.message
              });
            }
          }

          console.log(`✅ Inventory update completed for approved PO ${po.po_id}:`, inventoryUpdates);
        } catch (inventoryError: any) {
          console.error(`❌ Inventory update failed for approved PO ${po.po_id}:`, inventoryError.message);
        }
        
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
  const { final_delivery_date } = req.body;

  try {
    const po = await PurchaseOrder.findByPk(poId);
    if (!po) return ResponseHandler.error(res, "PO not found", 404);

    if (po.current_approver !== "creator") {
      return ResponseHandler.error(
        res,
        "PI can only be saved when Creator is responsible",
        400
      );
    }

    // ✅ Upload PI File to S3 if provided
    let s3Url: string | null = null;
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const fileName = `po-invoice/${po.po_id}_${Date.now()}.${ext}`;

      const uploadParams = {
        Bucket: "oms-stage-storage",
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));

      s3Url = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      // Save S3 link in DB
      po.set("pi_url", s3Url);
    }

    if (final_delivery_date) {
      po.set("final_delivery_date", final_delivery_date);
    }

    po.approval_status = "approved";
    po.current_approver = null;
    await po.save();

    return ResponseHandler.success(
      res,
      {
        PO: {
          message: "PI & Delivery details saved, PO completed",
          po_id: po.po_id,
          pi_url: s3Url,
        },
      },
      200
    );
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || "Error saving PI", 500);
  }
};

// ⚡ Export Multer middleware (to be used in route)
export const uploadPIFile = upload.single("pi_file");


/** Get All POs */
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
      include: [
        {
          model: POProduct,
          as: "products",
          include: [
            {
              model: Product,
              as: "productInfo",
              attributes: ["EAN_UPC", "ImageURL"], 
            },
          ],
        },
      ],
      limit: limitNum,
      offset,
      order: [["id", "DESC"]],
    });

    // flatten EAN_UPC and ImageURL into products
    const data = rows.map((po) => ({
      ...po.toJSON(),
      products: (po.products ?? []).map((p: any) => ({
        ...p.toJSON(),
        EAN_UPC: p.productInfo?.EAN_UPC || null,
        ImageURL: p.productInfo?.ImageURL || null, // 👈 added flattening
        productInfo: undefined,
      })),
    }));

    return ResponseHandler.success(res, {
      PO: data, 
      pagination: {
        total: count,
        page: pageNum,
        pages: Math.ceil(count / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || "Error fetching POs", 500);
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

/** Get PO Inventory Summary */
export const getPOInventorySummary = async (req: Request, res: Response) => {
  const poId = req.params.id;
  
  try {
    const po = await PurchaseOrder.findByPk(poId, { include: [{ model: POProduct, as: 'products' }] });
    if (!po) return ResponseHandler.error(res, 'PO not found', 404);
    
    console.log(`🔍 Getting inventory summary for PO ${po.po_id} with ${po.products?.length || 0} products`);
    
    const inventorySummaries: Array<{
      sku: string;
      product_name: string;
      po_quantity: number;
      current_inventory: any;
    }> = [];
    
    // Debug: Check if products exist
    console.log(`🔍 PO products:`, po.products?.map(p => ({ sku: p.sku_id, name: p.product })));
    
    for (const product of po.products || []) {
      try {
        console.log(`🔍 Processing product SKU: ${product.sku_id}`);
        const summary = await DirectInventoryService.getInventorySummary(product.sku_id);
        console.log(`🔍 Summary for ${product.sku_id}:`, summary ? 'Found' : 'Not found');
        if (summary) {
          inventorySummaries.push({
            sku: product.sku_id,
            product_name: product.product,
            po_quantity: product.units,
            current_inventory: summary
          });
          console.log(`✅ Added inventory summary for SKU ${product.sku_id}`);
        } else {
          console.log(`❌ No inventory summary found for SKU ${product.sku_id}`);
        }
      } catch (error: any) {
        console.error(`❌ Error getting inventory summary for SKU ${product.sku_id}:`, error.message);
      }
    }

    const inventorySummary = {
      po_id: po.po_id,
      po_status: po.approval_status,
      total_products: po.products?.length || 0,
      inventory_summaries: inventorySummaries
    };
    
    return ResponseHandler.success(res, {
      po_id: po.po_id,
      po_status: po.approval_status,
      inventory_summary: inventorySummary
    });
    
  } catch (error: any) {
    console.error('Error getting PO inventory summary:', error);
    return ResponseHandler.error(res, error.message || 'Error getting PO inventory summary', 500);
  }
};

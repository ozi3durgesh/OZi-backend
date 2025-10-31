import { Op } from 'sequelize';
import { Transaction } from 'sequelize';
import sequelize from '../../config/database';
import crypto from 'crypto';
import DCPurchaseOrder, { DCPurchaseOrderCreationAttributes } from '../../models/DCPurchaseOrder';
import DCPOApproval, { DCPOApprovalCreationAttributes } from '../../models/DCPOApproval';
import DCPOSkuMatrix from '../../models/DCPOSkuMatrix';
import VendorDC from '../../models/VendorDC';
import ProductMaster from '../../models/NewProductMaster';
import { DistributionCenter, User } from '../../models';
import { DC_PO_CONSTANTS } from '../../constants/dcPOConstants';
import { EmailService } from '../emailService';
import { DCSkuSplittingService } from './dcSkuSplittingService';
import { DCInventory1Service } from '../DCInventory1Service';
import  PurchaseOrderEdit  from '../../models/PurchaseOrderEdits'
import  POEditHistory  from '../../models/POEditHistory';

interface DCPOFilters {
  search?: string;
  status?: string;
  dcId?: number;
  vendorId?: number;
  priority?: string;
}

interface CreateDCPOData {
  vendorId: number;
  dcId: number;
  products: Array<{
    catelogue_id: string;
    total_quantity: number;
    totalPrice: number;
    description?: string;
    notes?: string;
    sku_matrix_on_catelogue_id?: Array<{
      quantity: number;
      catalogue_id: string;
      category?: string;
      sku: string;
      product_name: string;
      description?: string;
      hsn?: string;
      image_url?: string;
      mrp?: string;
      ean_upc?: string;
      color?: string;
      size?: string;
      brand?: string;
      weight?: number;
      length?: number;
      height?: number;
      width?: number;
      inventory_threshold?: number;
      gst?: string;
      cess?: string;
      rlp: string;
      rlp_w_o_tax: string;
      gstType: string;
      selling_price?: string;
      margin?: string;
    }>;
  }>;
  description?: string;
  notes?: string;
  priority?: string;
  createdBy: number;
  paymentType: string;
  creditPeriodDays: number;
}

interface EditPOData {
  vendorId: number;
  dcId: number;
  priority: string;
  description?: string;
  final_delivery_date?: string;
  pi_url?: string;
  products: Array<any>;
}

export class DCPOService {

  /**
   * Helper function to transform SKU matrix entries grouped by catalogue_id into Products format
   */
  static transformSkuMatrixToProducts(skuMatrixEntries: any[]): any[] {
    // Group by catalogue_id
    const grouped = skuMatrixEntries.reduce((acc: any, sku: any) => {
      const catalogueId = sku.catalogue_id;
      if (!acc[catalogueId]) {
        acc[catalogueId] = {
          catalogue_id: catalogueId,
          skuMatrix: [],
          totalQuantity: 0,
          totalAmount: 0,
        };
      }
      acc[catalogueId].skuMatrix.push(sku);
      acc[catalogueId].totalQuantity += parseInt(sku.quantity || 0);
      const price = parseFloat(sku.rlp || sku.selling_price || 0);
      acc[catalogueId].totalAmount += price * parseInt(sku.quantity || 0);
      return acc;
    }, {});

    // Transform to Products format
    return Object.values(grouped).map((group: any) => {
      const firstSku = group.skuMatrix[0];
      const unitPrice = group.totalQuantity > 0 ? group.totalAmount / group.totalQuantity : 0;
      
      return {
        id: firstSku.id, // Use first SKU's ID as product ID
        dcPOId: firstSku.dcPOId,
        productId: 1, // Default product ID
        catalogue_id: group.catalogue_id,
        productName: firstSku.product_name || 'Unknown Product',
        quantity: group.totalQuantity,
        unitPrice: unitPrice,
        totalAmount: group.totalAmount,
        mrp: firstSku.mrp ? parseFloat(firstSku.mrp) : null,
        cost: unitPrice, // Use unit price as cost
        description: firstSku.description || null,
        notes: null,
        hsn: firstSku.hsn || null,
        ean_upc: firstSku.ean_upc || null,
        weight: firstSku.weight || null,
        length: firstSku.length || null,
        height: firstSku.height || null,
        width: firstSku.width || null,
        inventory_threshold: firstSku.inventory_threshold || null,
        gst: firstSku.gst || null,
        cess: firstSku.cess || null,
        image_url: firstSku.image_url || null,
        brand_id: null,
        category_id: firstSku.category || firstSku.brand || null,
        status: 1,
        sku_matrix_on_catelogue_id: group.skuMatrix, // Return as array, not stringified JSON
        SkuMatrix: group.skuMatrix,
        createdAt: firstSku.createdAt,
        updatedAt: firstSku.updatedAt,
      };
    });
  }

  /**
   * Generate unique PO ID
   */
  static async generatePOId(): Promise<string> {
    const { PO_ID_PREFIX, PO_ID_START_NUMBER } = DC_PO_CONSTANTS;

    // Find the latest PO
    const lastPO = await DCPurchaseOrder.findOne({
      order: [['createdAt', 'DESC']],
    });

    let newPOId = `${PO_ID_PREFIX}${PO_ID_START_NUMBER}`;

    if (lastPO && lastPO.poId) {
      // Extract the number from the PO ID
      const lastNumber = parseInt(
        lastPO.poId.replace(PO_ID_PREFIX, ''),
        10
      );
      const nextNumber = lastNumber + 1;
      newPOId = `${PO_ID_PREFIX}${nextNumber}`;
    }

    // Ensure uniqueness
    let poExists = await DCPurchaseOrder.findOne({
      where: { poId: newPOId },
    });

    while (poExists) {
      const lastNumber = parseInt(newPOId.replace(PO_ID_PREFIX, ''), 10);
      const nextNumber = lastNumber + 1;
      newPOId = `${PO_ID_PREFIX}${nextNumber}`;
      poExists = await DCPurchaseOrder.findOne({ where: { poId: newPOId } });
    }

    return newPOId;
  }

  /**
   * Create a new DC Purchase Order
   */
  static async createDCPO(data: CreateDCPOData) {
    // Skip vendor and DC validation - accept any data as-is

    // Skip product validation - accept all data as-is
    console.log('🔍 [DCPOService] Processing products:', data.products.length);

    // Calculate total amount
    let totalAmount = 0;
    const validatedProducts = data.products.map(productData => {
      // Use totalPrice directly instead of calculating
      const productTotal = productData.totalPrice;
      totalAmount += productTotal;

      return {
        productId: 1, // Use default product ID
        catalogue_id: productData.catelogue_id, // Store catalogue_id as provided
        productName: productData.sku_matrix_on_catelogue_id?.[0]?.product_name || 'Unknown Product',
        quantity: productData.total_quantity,
        unitPrice: productData.totalPrice / productData.total_quantity, // Calculate unit price
        totalAmount: productTotal,
        mrp: productData.sku_matrix_on_catelogue_id?.[0]?.mrp || 0,
        cost: productData.totalPrice / productData.total_quantity, // Use calculated cost
        description: productData.description || '',
        notes: productData.notes || '',
        // Additional product details from SKU matrix
        hsn: productData.sku_matrix_on_catelogue_id?.[0]?.hsn || '',
        ean_upc: productData.sku_matrix_on_catelogue_id?.[0]?.ean_upc || '',
        weight: productData.sku_matrix_on_catelogue_id?.[0]?.weight || 0,
        length: productData.sku_matrix_on_catelogue_id?.[0]?.length || 0,
        height: productData.sku_matrix_on_catelogue_id?.[0]?.height || 0,
        width: productData.sku_matrix_on_catelogue_id?.[0]?.width || 0,
        inventory_threshold: 0,
        gst: productData.sku_matrix_on_catelogue_id?.[0]?.gst || 0,
        cess: productData.sku_matrix_on_catelogue_id?.[0]?.cess || 0,
        image_url: '',
        brand_id: 1,
        category_id: productData.sku_matrix_on_catelogue_id?.[0]?.brand || '',
        status: 1,
        // Store SKU matrix data for later processing
        skuMatrix: productData.sku_matrix_on_catelogue_id || [],
      };
    });

    // Generate unique PO ID
    const poId = await this.generatePOId();

    // Create the PO
    const newPO = await DCPurchaseOrder.create({
      poId,
      vendorId: data.vendorId,
      dcId: data.dcId,
      totalAmount,
      description: data.description,
      notes: data.notes,
      priority: data.priority || DC_PO_CONSTANTS.DEFAULTS.PRIORITY,
      status: DC_PO_CONSTANTS.STATUS.DRAFT,
      createdBy: data.createdBy,
      paymentType: data.paymentType,
      creditPeriodDays: data.creditPeriodDays
    } as DCPurchaseOrderCreationAttributes);

    // Create SKU matrix entries directly - ignore any database errors
    for (let i = 0; i < validatedProducts.length; i++) {
      const productData = validatedProducts[i];
      
      // Create SKU matrix entries if provided
      if (productData.skuMatrix && productData.skuMatrix.length > 0) {
        try {
          const skuMatrixEntries = productData.skuMatrix.map((sku: any) => ({
            dcPOId: newPO.id,
            dcPOProductId: null, // No longer needed, kept for backward compatibility
            quantity: sku.quantity,
            catalogue_id: sku.catalogue_id,
            category: sku.category || sku.Category || null,
            sku: sku.sku || sku.SKU,
            product_name: sku.product_name || sku.ProductName,
            description: sku.description || sku.Description || null,
            hsn: sku.hsn || null,
            image_url: sku.image_url || sku.ImageURL || null,
            mrp: sku.mrp || sku.MRP || null,
            ean_upc: sku.ean_upc || sku.EAN_UPC || null,
            color: sku.color || sku.Color || null,
            size: sku.size || sku.Size || null,
            brand: sku.brand || sku.Brand || null,
            weight: sku.weight || sku.Weight || null,
            length: sku.length || sku.Length || null,
            height: sku.height || sku.Height || null,
            width: sku.width || sku.Width || null,
            inventory_threshold: sku.inventory_threshold || sku.InventoryThreshold || null,
            gst: sku.gst || null,
            cess: sku.cess || sku.CESS || null,
            rlp: sku.rlp || null,
            rlp_w_o_tax: sku.rlp_w_o_tax || null,
            gstType: sku.gstType || null,
            selling_price: sku.selling_price || null,
            margin: sku.margin || null,
          }));

          await DCPOSkuMatrix.bulkCreate(skuMatrixEntries);
        } catch (skuError) {
          console.log(`SKU matrix creation failed for product ${i}, continuing...`, skuError);
        }
      }
    }

    // Initialize approval workflow
    await this.initializeApprovalWorkflow(newPO.id);

    // Update DC Inventory 1 for PO raise
    for (const product of validatedProducts) {
      // Get the actual SKU from SKU matrix if available, otherwise use catalogue_id
      let skuId = product.catalogue_id.toString().padStart(12, '0');
      
      if (product.skuMatrix && product.skuMatrix.length > 0) {
        // Use the first SKU from the matrix as the primary SKU
        skuId = product.skuMatrix[0].sku;
      }
      
      await DCInventory1Service.updateOnPORaise(
        skuId,
        data.dcId,
        product.quantity
      );
    }

    // Fetch the created PO with associations
    const po = await DCPurchaseOrder.findByPk(newPO.id, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
          attributes: ['id', 'vendorId', 'tradeName', 'pocName', 'pocEmail', 'marginOn'],
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: DCPOSkuMatrix,
          as: 'SkuMatrix',
          attributes: ['id', 'dcPOId', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin', 'createdAt', 'updatedAt'],
        },
        {
          model: DCPOApproval,
          as: 'Approvals',
          include: [
            {
              model: User,
              as: 'Approver',
              attributes: ['id', 'email', 'name'],
            },
          ],
        },
      ],
    });

    // Transform SKU matrix to Products format for backward compatibility
    if (!po) {
      throw new Error('Purchase Order not found');
    }
    
    const poData: any = po.toJSON();
    if ((po as any).SkuMatrix && (po as any).SkuMatrix.length > 0) {
      poData.Products = this.transformSkuMatrixToProducts((po as any).SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
    } else {
      poData.Products = [];
    }

    return poData;
  }

  /**
   * Initialize approval workflow
   */
  static async initializeApprovalWorkflow(poId: number) {
    const approvalRoles = ['creator', 'category_head', 'admin'];
    
    for (const role of approvalRoles) {
      await DCPOApproval.create({
        dcPOId: poId,
        approverRole: role,
        action: 'PENDING',
      } as DCPOApprovalCreationAttributes);
    }
  }

  /**
   * Submit PO for approval
   */
  static async submitForApproval(poId: number, userId: number) {
    const po = await DCPurchaseOrder.findByPk(poId, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
        },
        {
          model: DCPOSkuMatrix,
          as: 'SkuMatrix',
          attributes: ['id', 'dcPOId', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin', 'createdAt', 'updatedAt'],
        },
      ],
    });

    if (!po) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    if (po.status !== DC_PO_CONSTANTS.STATUS.DRAFT) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.INVALID_STATUS);
      error.statusCode = 400;
      throw error;
    }

    // Update status to pending category head approval
    await po.update({
      status: DC_PO_CONSTANTS.STATUS.PENDING_CATEGORY_HEAD,
      updatedBy: userId,
    });

    // Send approval email to category head
    // Transform SKU matrix to Products format for email
    const poData: any = po.toJSON();
    if ((po as any).SkuMatrix && (po as any).SkuMatrix.length > 0) {
      poData.Products = this.transformSkuMatrixToProducts((po as any).SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
    } else {
      poData.Products = [];
    }
    await this.sendApprovalEmail(poData, 'category_head');

    return poData;
  }

  /**
   * Generate approval token
   */
  static generateApprovalToken(poId: number, role: string, expiresInMinutes = DC_PO_CONSTANTS.EMAIL.TOKEN_EXPIRY_MINUTES) {
    const payload = { 
      po_id: poId, 
      role, 
      exp: Date.now() + expiresInMinutes * 60 * 1000 
    };
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

  /**
   * Decrypt approval token
   */
  static decryptApprovalToken(token: string) {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(process.env.TOKEN_SECRET!, 'hex'),
        Buffer.alloc(16, 0)
      );
      let decrypted = decipher.update(token, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(DC_PO_CONSTANTS.ERRORS.INVALID_TOKEN);
    }
  }

  /**
   * Send approval email
   */
  static async sendApprovalEmail(po: any, role: 'category_head' | 'admin' | 'creator') {
    let approvalLink = '';
    // Generate approval token for all roles including creator
    const token = this.generateApprovalToken(po.id, role);
    approvalLink = `${process.env.APP_BASE_URL_FRONTEND}dc/po-approval/${encodeURIComponent(token)}`;

    // Get recipient email
    const recipientEmail = DC_PO_CONSTANTS.EMAIL.APPROVAL_EMAILS[role];
    
    // Transform SKU matrix to Products format if Products doesn't exist
    let products = po.Products || [];
    if (!products || products.length === 0) {
      const skuMatrix = (po.SkuMatrix || []).map((s: any) => s.toJSON ? s.toJSON() : s);
      if (skuMatrix.length > 0) {
        products = this.transformSkuMatrixToProducts(skuMatrix);
      }
    }
    
    // Send email using new EmailService
    const success = await EmailService.sendDCApprovalEmail(
      [recipientEmail],
      po.poId,
      po.Vendor?.tradeName || po.Vendor?.dataValues?.tradeName || 'N/A',
      po.DistributionCenter?.name || po.DistributionCenter?.dataValues?.name || 'N/A',
      po.totalAmount,
      po.priority,
      products,
      approvalLink,
      role
    );

    if (success) {
      console.log(`Email sent to ${role}: ${recipientEmail}`);
    } else {
      console.error(`Failed to send email to ${role}: ${recipientEmail}`);
    }
  }


  /**
   * Process approval/rejection
   */
  static async processApproval(token: string, action: 'APPROVED' | 'REJECTED', comments?: string, password?: string) {
    // Decrypt and validate token
    const tokenData = this.decryptApprovalToken(token);
    
    if (Date.now() > tokenData.exp) {
      throw new Error(DC_PO_CONSTANTS.ERRORS.TOKEN_EXPIRED);
    }

    const { po_id, role } = tokenData;

    // Validate password if provided
    if (password && process.env.APPROVAL_PASSWORD) {
      if (password !== process.env.APPROVAL_PASSWORD) {
        throw new Error('Invalid approval password');
      }
    }

    // Find the PO
    const po = await DCPurchaseOrder.findByPk(po_id, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
        },
        {
          model: DCPOSkuMatrix,
          as: 'SkuMatrix',
        },
      ],
    });

    if (!po) {
      throw new Error(DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
    }

    // Update approval record
    const approval = await DCPOApproval.findOne({
      where: {
        dcPOId: po_id,
        approverRole: role,
        action: 'PENDING'
      }
    });

    if (!approval) {
      throw new Error('Approval record not found');
    }

    await approval.update({
      action,
      comments,
      approvedAt: new Date(),
    });

    // Update PO status based on action and current workflow
    let newStatus = po.status;
    
    if (action === 'REJECTED') {
      newStatus = DC_PO_CONSTANTS.STATUS.REJECTED;
      await po.update({
        status: newStatus,
        rejectedBy: null, // We don't have user ID from token
        rejectedAt: new Date(),
        rejectionReason: comments,
      });
    } else if (action === 'APPROVED') {
      // Move to next approval stage
      if (role === 'category_head') {
        newStatus = DC_PO_CONSTANTS.STATUS.PENDING_ADMIN;
        // Send email to admin
        await this.sendApprovalEmail(po, 'admin');
      } else if (role === 'admin') {
        newStatus = DC_PO_CONSTANTS.STATUS.PENDING_CREATOR_REVIEW;
        // Send email to creator for final review
        await this.sendApprovalEmail(po, 'creator');
      } else if (role === 'creator') {
        newStatus = DC_PO_CONSTANTS.STATUS.APPROVED;
        await po.update({
          status: newStatus,
          approvedBy: null, // We don't have user ID from token
          approvedAt: new Date(),
        });

        // Update DC Inventory 1 for PO approval
        const skuMatrixEntries = await DCPOSkuMatrix.findAll({
          where: { dcPOId: po.id },
          attributes: ['catalogue_id', 'quantity', 'sku']
        });

        // Group by catalogue_id and sum quantities
        const grouped = skuMatrixEntries.reduce((acc: any, entry: any) => {
          const catId = entry.catalogue_id;
          if (!acc[catId]) {
            acc[catId] = { catalogue_id: catId, quantity: 0, sku: entry.sku };
          }
          acc[catId].quantity += parseInt(entry.quantity || 0);
          return acc;
        }, {});

        for (const product of Object.values(grouped) as any[]) {
          const skuId = product.sku || product.catalogue_id.toString().padStart(12, '0');
          await DCInventory1Service.updateOnPOApprove(
            skuId,
            po.dcId,
            product.quantity
          );
        }
      }
    }

    if (newStatus !== po.status) {
      await po.update({ status: newStatus });
    }

    return po;
  }

  /**
   * Get DC Purchase Orders with filters and pagination
   */
  static async getDCPOs(filters: DCPOFilters, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    // Apply filters
    if (filters.search) {
      whereClause[Op.or] = [
        { poId: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.dcId) {
      whereClause.dcId = filters.dcId;
    }

    if (filters.vendorId) {
      whereClause.vendorId = filters.vendorId;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    const { count, rows } = await DCPurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
          attributes: ['id', 'vendorId', 'tradeName', 'pocName', 'marginOn'],
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: DCPOSkuMatrix,
          as: 'SkuMatrix',
          attributes: ['id', 'catalogue_id', 'product_name', 'quantity', 'rlp', 'selling_price', 'sku', 'createdAt', 'updatedAt'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Transform the data to handle status logic for edited POs
    const transformedRows = rows.map(po => {
      const poData = po.toJSON();
      
      // If the PO is edited, set status to PENDING_CATEGORY_HEAD
      // if (poData.isEdited && poData.status === 'APPROVED') {
      //   poData.status = 'PENDING_CATEGORY_HEAD';
      // }
      
      return poData;
    });

    return {
      purchaseOrders: transformedRows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get DC Purchase Order by ID
   */
  static async getDCPOById(id: number) {
    const po = await DCPurchaseOrder.findByPk(id, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
          attributes: ['id', 'vendorId', 'tradeName', 'pocName', 'pocEmail', 'businessAddress', 'marginOn'],
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state', 'address'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'UpdatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'ApprovedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'RejectedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: DCPOSkuMatrix,
          as: 'SkuMatrix',
          attributes: ['id', 'dcPOId', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin', 'createdAt', 'updatedAt'],
        },
        {
          model: DCPOApproval,
          as: 'Approvals',
          include: [
            {
              model: User,
              as: 'Approver',
              attributes: ['id', 'email', 'name'],
            },
          ],
        },
      ],
    });

    if (!po) {
      return null;
    }

    // Transform SKU matrix to Products format and add sp field
    if (!po) {
      return null;
    }
    
    const poData: any = po.toJSON();
    if ((po as any)?.SkuMatrix && (po as any).SkuMatrix.length > 0) {
      const skuMatrixArray = (po as any).SkuMatrix.map((s: any) => {
        const sku = s.toJSON ? s.toJSON() : s;
        sku.sp = sku.selling_price;
        return sku;
      });
      poData.Products = this.transformSkuMatrixToProducts(skuMatrixArray);
      poData.SkuMatrix = skuMatrixArray;
    } else {
      poData.Products = [];
      poData.SkuMatrix = [];
    }

    return poData;
  }

  /**
   * Update DC Purchase Order
   */
  static async updateDCPO(id: number, updateData: any, userId: number) {
    const po = await DCPurchaseOrder.findByPk(id);

    if (!po) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Only allow updates if status is DRAFT
    if (po.status !== DC_PO_CONSTANTS.STATUS.DRAFT) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.INVALID_STATUS);
      error.statusCode = 400;
      throw error;
    }

    await po.update({
      ...updateData,
      updatedBy: userId,
    });

    return await this.getDCPOById(id);
  }

  /**
   * Delete DC Purchase Order
   */
  static async deleteDCPO(id: number) {
    const po = await DCPurchaseOrder.findByPk(id);

    if (!po) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Only allow deletion if status is DRAFT
    if (po.status !== DC_PO_CONSTANTS.STATUS.DRAFT) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.INVALID_STATUS);
      error.statusCode = 400;
      throw error;
    }

    await po.destroy();
    return true;
  }

  /**
   * Get complete product details for a DC Purchase Order
   */
  static async getDCPOProductDetails(poId: number): Promise<any> {
    console.log('🔍 Getting DC PO Product Details for PO ID:', poId);
    const po: any = await DCPurchaseOrder.findByPk(poId, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
          attributes: ['id', 'vendorId', 'tradeName', 'pocName', 'pocEmail', 'businessAddress', 'city', 'state'],
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state', 'address'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: DCPOSkuMatrix,
          as: 'SkuMatrix',
          attributes: [
            'id', 'dcPOId', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 
            'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 
            'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 
            'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin', 'createdAt', 'updatedAt'
          ],
        },
        {
          model: DCPOApproval,
          as: 'Approvals',
          include: [
            {
              model: User,
              as: 'Approver',
              attributes: ['id', 'email', 'name'],
            },
          ],
        },
      ],
    });

    if (!po) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Transform SKU matrix to Products format
    const skuMatrixArray = (po.SkuMatrix || []).map((s: any) => s.toJSON ? s.toJSON() : s);
    const products = this.transformSkuMatrixToProducts(skuMatrixArray);

    // Calculate summary statistics
    const productSummary = {
      totalProducts: products.length || 0,
      totalQuantity: products.reduce((sum: number, product: any) => sum + product.quantity, 0) || 0,
      totalAmount: po.totalAmount,
      averageUnitPrice: products.length > 0 ? 
        po.totalAmount / (products.reduce((sum: number, product: any) => sum + product.quantity, 0)) : 0,
      categories: [...new Set(products.map((p: any) => p.category_id).filter(Boolean) || [])],
      brands: [...new Set(skuMatrixArray.map((s: any) => s.brand).filter(Boolean) || [])],
    };

    // Add calculated fields and SKU splitting status to each product
    console.log('📦 Processing products:', products.length || 0);
    const productsWithCalculations = await Promise.all((products || []).map(async (product: any) => {
      console.log('🔍 Product ID:', product.id, 'SKU Matrix count:', product.SkuMatrix?.length || 0);
      let skuSplittingStatus: any = null;
      
      // Only get SKU splitting status for approved POs
      if (po.status === 'APPROVED') {
        try {
          skuSplittingStatus = await DCSkuSplittingService.getSkuSplittingStatus(poId, product.catalogue_id);
        } catch (error) {
          console.warn(`Failed to get SKU splitting status for product ${product.catalogue_id}:`, error);
          // Set default status if there's an error
          skuSplittingStatus = {
            status: 'pending',
            totalSplitQuantity: 0,
            remainingQuantity: product.quantity,
            splitSkusCount: 0
          };
        }
      }

      return {
        ...product,
        // Add calculated fields
        totalOrderedValue: product.quantity * product.unitPrice,
        marginAmount: product.unitPrice - (product.cost || 0),
        marginPercentage: product.cost ? 
          ((product.unitPrice - product.cost) / product.cost * 100) : 0,
        savingsFromMRP: (parseFloat(product.mrp || 0)) - product.unitPrice,
        savingsPercentage: product.mrp ? 
          ((parseFloat(product.mrp) - product.unitPrice) / parseFloat(product.mrp) * 100) : 0,
        // Add SKU Matrix information
        SkuMatrix: product.SkuMatrix || [],
        // Add SKU splitting information
        sku_splitting_status: skuSplittingStatus?.status || null,
        sku_splitting_summary: skuSplittingStatus ? {
          total_split_quantity: skuSplittingStatus.totalSplitQuantity,
          remaining_quantity: skuSplittingStatus.remainingQuantity,
          split_skus_count: skuSplittingStatus.splitSkusCount
        } : null
      };
    }));

    return {
      purchaseOrder: {
        id: po.id,
        poId: po.poId,
        status: po.status,
        priority: po.priority,
        totalAmount: po.totalAmount,
        description: po.description,
        notes: po.notes,
        createdAt: po.createdAt,
        updatedAt: po.updatedAt,
        Vendor: po.Vendor,
        DistributionCenter: po.DistributionCenter,
        CreatedBy: po.CreatedBy,
        Approvals: po.Approvals,
      },
      products: productsWithCalculations,
      summary: productSummary,
    };
  }

  /**
   * Creator upload PI and set delivery date
   */
  static async uploadPIAndSetDeliveryDate(poId: number, data: {
    expectedDeliveryDate: Date;
    piNotes?: string;
    piFileUrl?: string;
    updatedBy: number;
  }) {
    const po = await DCPurchaseOrder.findByPk(poId);

    if (!po) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Only allow if status is PENDING_CREATOR_REVIEW
    if (po.status !== DC_PO_CONSTANTS.STATUS.PENDING_CREATOR_REVIEW) {
      const error: any = new Error('Purchase Order is not in the correct status for PI upload');
      error.statusCode = 400;
      throw error;
    }

    // Update PO with PI details and delivery date
    await po.update({
      status: DC_PO_CONSTANTS.STATUS.APPROVED,
      final_delivery_date: data.expectedDeliveryDate,
      pi_notes: data.piNotes,
      pi_file_url: data.piFileUrl,
      updatedBy: data.updatedBy,
      approvedAt: new Date(),
    });

    // Update creator approval record to APPROVED
    await DCPOApproval.update(
      {
        action: 'APPROVED',
        approverId: data.updatedBy,
        approvedAt: new Date(),
        comments: 'PI uploaded and delivery date confirmed',
      },
      {
        where: {
          dcPOId: poId,
          approverRole: 'creator',
          action: 'PENDING'
        }
      }
    );

    // Update DC Inventory 1 more PO approval
    const skuMatrixEntries = await DCPOSkuMatrix.findAll({
      where: { dcPOId: poId },
      attributes: ['catalogue_id', 'quantity', 'sku']
    });

    // Group by catalogue_id and sum quantities
    const grouped = skuMatrixEntries.reduce((acc: any, entry: any) => {
      const catId = entry.catalogue_id;
      if (!acc[catId]) {
        acc[catId] = { catalogue_id: catId, quantity: 0, sku: entry.sku };
      }
      acc[catId].quantity += parseInt(entry.quantity || 0);
      return acc;
    }, {});

    for (const product of Object.values(grouped) as any[]) {
      const skuId = product.sku || product.catalogue_id.toString().padStart(12, '0');
      await DCInventory1Service.updateOnPOApprove(
        skuId,
        po.dcId,
        product.quantity
      );
    }

    // Send final notification email to all stakeholders
    await this.sendFinalNotificationEmail(poId);

    // Return updated PO with associations
    return await this.getDCPOById(poId);
  }

  /**
   * Send final notification email to all stakeholders
   */
  static async sendFinalNotificationEmail(poId: number) {
    try {
      // Get the complete PO with all associations
      const po = await DCPurchaseOrder.findByPk(poId, {
        include: [
          {
            model: VendorDC,
            as: 'Vendor',
            attributes: ['id', 'tradeName', 'pocName', 'pocEmail', 'businessAddress']
          },
          {
            model: DistributionCenter,
            as: 'DistributionCenter',
            attributes: ['id', 'name', 'city', 'state', 'address']
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: DCPOSkuMatrix,
            as: 'SkuMatrix',
          }
        ]
      });

      if (!po) {
        console.error('PO not found for final notification email');
        return;
      }

      // Transform SKU matrix to Products format for email
      const skuMatrixArray = (po as any).SkuMatrix?.map((s: any) => s.toJSON ? s.toJSON() : s) || [];
      const products = this.transformSkuMatrixToProducts(skuMatrixArray);

      // Get all stakeholder emails
      const stakeholderEmails = [
        DC_PO_CONSTANTS.EMAIL.APPROVAL_EMAILS.admin,
        DC_PO_CONSTANTS.EMAIL.APPROVAL_EMAILS.category_head,
        DC_PO_CONSTANTS.EMAIL.APPROVAL_EMAILS.creator
      ];

      // Send final notification email
      const success = await EmailService.sendDCFinalNotificationEmail(
        stakeholderEmails,
        po.poId,
        (po as any).Vendor?.tradeName || 'N/A',
        (po as any).DistributionCenter?.name || 'N/A',
        po.totalAmount,
        po.priority,
        po.final_delivery_date,
        po.pi_notes,
        po.pi_file_url,
        products
      );

      if (success) {
        console.log(`Final notification email sent to all stakeholders for PO: ${po.poId}`);
      } else {
        console.error(`Failed to send final notification email for PO: ${po.poId}`);
      }

    } catch (error) {
      console.error('Error sending final notification email:', error);
    }
  }

  static async editPO(poId: number, data: EditPOData, userId: number) {
    const transaction = await sequelize.transaction();

    try {
      // 1️⃣ Fetch existing PO and SKU matrix entries
      const existingPO = await DCPurchaseOrder.findByPk(poId, {
        include: [{ model: DCPOSkuMatrix, as: 'SkuMatrix' }],
        transaction,
      });

      if (!existingPO) throw new Error('DC Purchase Order not found');
      if (existingPO.isEdited)
        throw new Error('This PO has already been edited once.');

      const editLogs: any[] = [];

      // 2️⃣ Track PO header changes
      const headerFields: any = {
        vendorId: data.vendorId,
        dcId: data.dcId,
        priority: data.priority,
        description: data.description || null,
      };

      // Track header field changes (including gstType if it exists in data but not in model)
      for (const [field, newValue] of Object.entries(headerFields)) {
        const oldValue = (existingPO as any)[field];
        if (oldValue !== newValue && newValue !== undefined) {
          editLogs.push({
            po_id: poId,
            product_id: null,
            field,
            old_value: oldValue?.toString() || null,
            new_value: newValue?.toString() || null,
            change_type: 'HEADER_EDITED',
            changed_by: userId,
            changed_at: new Date(),
          });
        }
      }

      // Track gstType if present in data (may not be a PO field but track it anyway)
      if ((data as any).gstType !== undefined) {
        const oldGstType = (existingPO as any).gstType;
        const newGstType = (data as any).gstType;
        if (oldGstType !== newGstType) {
          editLogs.push({
            po_id: poId,
            product_id: null,
            field: 'gstType',
            old_value: oldGstType?.toString() || null,
            new_value: newGstType?.toString() || null,
            change_type: 'HEADER_EDITED',
            changed_by: userId,
            changed_at: new Date(),
          });
        }
      }

      // Update PO header fields
      await existingPO.update(
        {
          ...headerFields,
          updatedBy: userId,
        },
        { transaction }
      );

      // 3️⃣ Get all existing SKU matrix entries mapped by SKU code
      const existingSkuEntries = await DCPOSkuMatrix.findAll({
        where: { dcPOId: poId },
        transaction,
      });

      const existingSkuMap: Map<string, any> = new Map(
        existingSkuEntries.map((sku: any) => {
          const skuData = sku.toJSON ? sku.toJSON() : sku;
          return [skuData.sku, skuData];
        })
      );

      // Track input SKUs to identify removed ones
      const inputSkuCodes = new Set<string>();

      // 4️⃣ Process input products and SKUs
      const skusToUpdate: any[] = [];
      const skusToCreate: any[] = [];
      const skusToDelete: number[] = [];

      if (data.products?.length) {
        for (const product of data.products) {
          if (!product.sku_matrix_on_catelogue_id?.length) continue;

          for (const skuItem of product.sku_matrix_on_catelogue_id) {
            const skuCode = skuItem.sku;
            const newQuantity = parseInt(skuItem.quantity) || 0;

            const existingSku = existingSkuMap.get(skuCode);

            if (existingSku) {
              // If quantity is 0, treat as removal
              if (newQuantity === 0) {
                // Mark for deletion
                skusToDelete.push(existingSku.id);

                // Track deletion in history
                editLogs.push({
                  po_id: poId,
                  product_id: existingSku.id,
                  field: 'sku_removed',
                  old_value: JSON.stringify({
                    sku: skuCode,
                    catalogue_id: existingSku.catalogue_id,
                    product_name: existingSku.product_name,
                    quantity: existingSku.quantity,
                    rlp: existingSku.rlp,
                    mrp: existingSku.mrp,
                  }),
                  new_value: null,
                  change_type: 'PRODUCT_EDITED',
                  changed_by: userId,
                  changed_at: new Date(),
                });

                // Remove from inputSkuCodes so it's not processed as "removed" later
                inputSkuCodes.delete(skuCode);
                continue;
              }

              // SKU exists with quantity > 0 - check for changes and update
              inputSkuCodes.add(skuCode);

              const fieldsToCompare = [
                'quantity',
                'product_name',
                'hsn',
                'ean_upc',
                'brand',
                'weight',
                'length',
                'height',
                'width',
                'gst',
                'cess',
                'rlp',
                'rlp_w_o_tax',
                'gstType',
                'mrp',
                'selling_price',
              ];

              let hasChanges = false;
              const skuUpdateData: any = {
                id: existingSku.id,
              };

              for (const field of fieldsToCompare) {
                let newValue = (skuItem as any)[field];
                let oldValue = existingSku[field];

                // Normalize values for comparison
                if (field === 'quantity') {
                  newValue = parseInt(newValue) || 0;
                  oldValue = parseInt(oldValue) || 0;
                } else if (['weight', 'length', 'height', 'width'].includes(field)) {
                  newValue = newValue !== null && newValue !== undefined ? parseFloat(newValue) : null;
                  oldValue = oldValue !== null && oldValue !== undefined ? parseFloat(oldValue) : null;
                } else if (['rlp', 'rlp_w_o_tax', 'mrp', 'selling_price'].includes(field)) {
                  newValue = newValue !== null && newValue !== undefined ? newValue.toString() : null;
                  oldValue = oldValue !== null && oldValue !== undefined ? oldValue.toString() : null;
                } else {
                  newValue = newValue !== null && newValue !== undefined ? newValue : null;
                  oldValue = oldValue !== null && oldValue !== undefined ? oldValue : null;
                }

                if (newValue !== oldValue) {
                  hasChanges = true;

                  // Track change in history
                  editLogs.push({
                    po_id: poId,
                    product_id: existingSku.id,
                    field: `sku_${field}`,
                    old_value: oldValue?.toString() || null,
                    new_value: newValue?.toString() || null,
                    change_type: 'PRODUCT_EDITED',
                    changed_by: userId,
                    changed_at: new Date(),
                  });

                  // Map field names for SKU matrix update
                  if (field === 'product_name') {
                    skuUpdateData.product_name = newValue;
                  } else {
                    skuUpdateData[field] = newValue;
                  }
                }
              }

              if (hasChanges) {
                skusToUpdate.push(skuUpdateData);
              }
            } else {
              // New SKU - only create if quantity > 0
              if (newQuantity > 0) {
                inputSkuCodes.add(skuCode);

                const newSkuEntry = {
                  dcPOId: poId,
                  dcPOProductId: null,
                  catalogue_id: skuItem.catalogue_id,
                  sku: skuCode,
                  product_name: skuItem.product_name || '',
                  quantity: newQuantity,
                  hsn: skuItem.hsn || null,
                  ean_upc: skuItem.ean_upc || null,
                  brand: skuItem.brand || null,
                  weight: skuItem.weight !== null && skuItem.weight !== undefined ? parseFloat(skuItem.weight) : null,
                  length: skuItem.length !== null && skuItem.length !== undefined ? parseFloat(skuItem.length) : null,
                  height: skuItem.height !== null && skuItem.height !== undefined ? parseFloat(skuItem.height) : null,
                  width: skuItem.width !== null && skuItem.width !== undefined ? parseFloat(skuItem.width) : null,
                  gst: skuItem.gst !== null && skuItem.gst !== undefined ? skuItem.gst.toString() : null,
                  cess: skuItem.cess !== null && skuItem.cess !== undefined ? skuItem.cess.toString() : null,
                  rlp: skuItem.rlp !== null && skuItem.rlp !== undefined ? skuItem.rlp.toString() : null,
                  rlp_w_o_tax: skuItem.rlp_w_o_tax !== null && skuItem.rlp_w_o_tax !== undefined ? skuItem.rlp_w_o_tax.toString() : null,
                  gstType: skuItem.gstType || null,
                  mrp: skuItem.mrp !== null && skuItem.mrp !== undefined ? skuItem.mrp.toString() : null,
                  selling_price: skuItem.selling_price !== null && skuItem.selling_price !== undefined ? skuItem.selling_price.toString() : null,
                };

                skusToCreate.push(newSkuEntry);

                // Track new SKU in history
                editLogs.push({
                  po_id: poId,
                  product_id: null,
                  field: 'sku',
                  old_value: null,
                  new_value: JSON.stringify({ sku: skuCode, catalogue_id: skuItem.catalogue_id, product_name: skuItem.product_name }),
                  change_type: 'PRODUCT_ADDED',
                  changed_by: userId,
                  changed_at: new Date(),
                });
              }
              // If new SKU with quantity 0, skip it (don't create)
            }
          }
        }
      }

      // 5️⃣ Delete SKUs with quantity 0 first
      if (skusToDelete.length > 0) {
        await DCPOSkuMatrix.destroy({
          where: {
            id: { [Op.in]: skusToDelete },
            dcPOId: poId,
          },
          transaction,
        });
      }

      // 6️⃣ Update existing SKU matrix entries
      for (const skuUpdate of skusToUpdate) {
        const { id, ...updateFields } = skuUpdate;
        await DCPOSkuMatrix.update(updateFields, {
          where: { id, dcPOId: poId },
          transaction,
        });
      }

      // 7️⃣ Create new SKU matrix entries
      if (skusToCreate.length > 0) {
        await DCPOSkuMatrix.bulkCreate(skusToCreate, { transaction });
      }

      // 8️⃣ Handle completely removed SKUs (exists in DB but not in input at all)
      const remainingSkusToDelete: number[] = [];
      for (const [skuCode, existingSku] of existingSkuMap.entries()) {
        if (!inputSkuCodes.has(skuCode)) {
          // SKU was completely removed from input (not even with quantity 0)
          remainingSkusToDelete.push(existingSku.id);

          // Track removal in history
          editLogs.push({
            po_id: poId,
            product_id: existingSku.id,
            field: 'sku_removed',
            old_value: JSON.stringify({
              sku: skuCode,
              catalogue_id: existingSku.catalogue_id,
              product_name: existingSku.product_name,
              quantity: existingSku.quantity,
              rlp: existingSku.rlp,
              mrp: existingSku.mrp,
            }),
            new_value: null,
            change_type: 'PRODUCT_EDITED',
            changed_by: userId,
            changed_at: new Date(),
          });
        }
      }

      // Delete completely removed SKUs
      if (remainingSkusToDelete.length > 0) {
        await DCPOSkuMatrix.destroy({
          where: {
            id: { [Op.in]: remainingSkusToDelete },
            dcPOId: poId,
          },
          transaction,
        });
      }

      // 9️⃣ Save edit history
      if (editLogs.length > 0) {
        await POEditHistory.bulkCreate(editLogs, { transaction });
      }

      // 🔟 Update PO status and mark as edited
      await existingPO.update(
        {
          isEdited: true,
          status: 'PENDING_CATEGORY_HEAD',
          updatedBy: userId,
        },
        { transaction }
      );

      // Recalculate total amount from SKU matrix
      const allSkuEntries = await DCPOSkuMatrix.findAll({
        where: { dcPOId: poId },
        transaction,
      });

      let totalAmount = 0;
      for (const sku of allSkuEntries) {
        const price = parseFloat(sku.rlp || sku.selling_price || '0');
        const qty = parseInt(sku.quantity?.toString() || '0');
        totalAmount += price * qty;
      }

      await existingPO.update({ totalAmount }, { transaction });

      await transaction.commit();
      return { message: 'PO edited successfully', poId };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }


  static async approvePO(poId: number, userId: number, isApproved:boolean) {

    try {
      // 1️ Check if original DC Purchase Order exists
      const editedPO = await PurchaseOrderEdit.findOne(
        {where: { purchase_order_id: poId },}
      );
      if (!editedPO) {
        throw new Error('DC Purchase Order Edit not found');
      }

      if(editedPO.status == "APPROVED"){
        throw new Error("PO is already Approved");
      }
      
      if (isApproved){
        var status = "APPROVED"
      } else {
        var status = "REJECTED"
      }

      // 3️ Create edited PO header
      await editedPO.update({
          status: status,
          approvedBy: userId, // We don't have user ID from token
          approvedAt: new Date(),
      })

      return "PO Approved successfully";

    } catch (error) {
      throw error;
    }
  }

  /**
   * Direct approval/rejection without hierarchy
   */
  static async directApproval(poId: number, action: 'APPROVED' | 'REJECTED', userId: number, approverRole: string, comments?: string) {
    const transaction = await sequelize.transaction();

    try {
      // Find the PO
      const po = await DCPurchaseOrder.findByPk(poId, {
        include: [
          {
            model: VendorDC,
            as: 'Vendor',
          },
          {
            model: DistributionCenter,
            as: 'DistributionCenter',
          },
          {
            model: DCPOSkuMatrix,
            as: 'SkuMatrix',
          },
        ],
        transaction
      });

      if (!po) {
        const error: any = new Error(DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Check if PO is in a state that can be directly approved/rejected
      const validStatuses: string[] = [
        DC_PO_CONSTANTS.STATUS.PENDING_CATEGORY_HEAD,
        DC_PO_CONSTANTS.STATUS.PENDING_ADMIN,
        DC_PO_CONSTANTS.STATUS.PENDING_CREATOR_REVIEW
      ];

      if (!validStatuses.includes(po.status)) {
        const error: any = new Error('Purchase Order is not in a state that can be directly approved/rejected');
        error.statusCode = 400;
        throw error;
      }

      let newStatus: string;
      let updateData: any = {};

      if (action === 'REJECTED') {
        newStatus = DC_PO_CONSTANTS.STATUS.REJECTED;
        updateData = {
          status: newStatus,
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectionReason: comments,
        };
      } else {
        // Direct approval - skip all hierarchy and mark as fully approved
        newStatus = DC_PO_CONSTANTS.STATUS.APPROVED;
        updateData = {
          status: newStatus,
          approvedBy: userId,
          approvedAt: new Date(),
        };
      }

      // Update the PO
      await po.update(updateData, { transaction });

      // Update all pending approval records to reflect the direct action
      // IMPORTANT: Preserve original approverRole - do not change it
      await DCPOApproval.update(
        {
          action,
          approverId: userId,
          comments,
          approvedAt: new Date(),
        },
        {
          where: {
            dcPOId: poId,
            action: 'PENDING'
          },
          transaction
        }
      );

      // If approved, update DC Inventory 1
      if (action === 'APPROVED') {
        const skuMatrixEntries = await DCPOSkuMatrix.findAll({
          where: { dcPOId: po.id },
          attributes: ['catalogue_id', 'quantity', 'sku'],
          transaction
        });

        // Group by catalogue_id and sum quantities
        const grouped = skuMatrixEntries.reduce((acc: any, entry: any) => {
          const catId = entry.catalogue_id;
          if (!acc[catId]) {
            acc[catId] = { catalogue_id: catId, quantity: 0, sku: entry.sku };
          }
          acc[catId].quantity += parseInt(entry.quantity || 0);
          return acc;
        }, {});

        for (const product of Object.values(grouped) as any[]) {
          const skuId = product.sku || product.catalogue_id.toString().padStart(12, '0');
          await DCInventory1Service.updateOnPOApprove(
            skuId,
            po.dcId,
            product.quantity
          );
        }
      }

      await transaction.commit();

      // Return the updated PO with all associations
      return await this.getDCPOById(poId);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

}

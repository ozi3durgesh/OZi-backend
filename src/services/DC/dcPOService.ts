import { Op } from 'sequelize';
import { Transaction } from 'sequelize';
import sequelize from '../../config/database';
import crypto from 'crypto';
import DCPurchaseOrder, { DCPurchaseOrderCreationAttributes } from '../../models/DCPurchaseOrder';
import DCPOProduct, { DCPOProductCreationAttributes } from '../../models/DCPOProduct';
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
    } as DCPurchaseOrderCreationAttributes);

    // Create PO products and their SKU matrix - ignore any database errors
    const poProducts: any[] = [];
    for (let i = 0; i < validatedProducts.length; i++) {
      const productData = validatedProducts[i];
      try {
        const poProduct = await DCPOProduct.create({
          dcPOId: newPO.id,
          productId: productData.productId,
          catalogue_id: productData.catalogue_id.toString(),
          productName: productData.productName,
          quantity: productData.quantity,
          unitPrice: productData.unitPrice,
          totalAmount: productData.totalAmount,
        mrp: typeof productData.mrp === 'string' ? parseFloat(productData.mrp) : productData.mrp,
        cost: typeof productData.cost === 'string' ? parseFloat(productData.cost) : productData.cost,
        description: productData.description,
        notes: productData.notes,
        hsn: productData.hsn,
        ean_upc: productData.ean_upc,
        weight: typeof productData.weight === 'string' ? parseFloat(productData.weight) : productData.weight,
        length: typeof productData.length === 'string' ? parseFloat(productData.length) : productData.length,
        height: typeof productData.height === 'string' ? parseFloat(productData.height) : productData.height,
        width: typeof productData.width === 'string' ? parseFloat(productData.width) : productData.width,
        inventory_threshold: typeof productData.inventory_threshold === 'string' ? parseInt(productData.inventory_threshold) : productData.inventory_threshold,
        gst: typeof productData.gst === 'string' ? parseFloat(productData.gst) : productData.gst,
        cess: typeof productData.cess === 'string' ? parseFloat(productData.cess) : productData.cess,
          image_url: productData.image_url,
          brand_id: productData.brand_id,
          category_id: productData.category_id,
          status: productData.status,
        });

        // Create SKU matrix entries if provided
        if (productData.skuMatrix && productData.skuMatrix.length > 0) {
          try {
            const skuMatrixEntries = productData.skuMatrix.map((sku: any) => ({
              dcPOProductId: poProduct.id,
              quantity: sku.quantity,
              catalogue_id: sku.catalogue_id,
              category: sku.category || sku.Category,
              sku: sku.sku || sku.SKU,
              product_name: sku.product_name || sku.ProductName,
              description: sku.description || sku.Description,
              hsn: sku.hsn,
              image_url: sku.image_url || sku.ImageURL,
              mrp: sku.mrp || sku.MRP,
              ean_upc: sku.ean_upc || sku.EAN_UPC,
              color: sku.color || sku.Color,
              size: sku.size || sku.Size,
              brand: sku.brand || sku.Brand,
              weight: sku.weight || sku.Weight,
              length: sku.length || sku.Length,
              height: sku.height || sku.Height,
              width: sku.width || sku.Width,
              inventory_threshold: sku.inventory_threshold || sku.InventoryThreshold,
              gst: sku.gst,
              cess: sku.cess || sku.CESS,
              rlp: sku.rlp,
              rlp_w_o_tax: sku.rlp_w_o_tax,
              gstType: sku.gstType,
              selling_price: sku.selling_price,
              margin: sku.margin,
            }));

            await DCPOSkuMatrix.bulkCreate(skuMatrixEntries);
            
            // Update the DCPOProduct with the SKU matrix JSON data
            await poProduct.update({
              sku_matrix_on_catelogue_id: JSON.stringify(productData.skuMatrix)
            });
          } catch (skuError) {
            console.log('SKU matrix creation failed, continuing...', skuError);
          }
        }

        poProducts.push(poProduct);
      } catch (productError) {
        console.log(`Product ${i} creation failed, continuing...`, productError);
        // Create a dummy product to continue
        poProducts.push({
          id: i + 1,
          dcPOId: newPO.id,
          productId: productData.productId,
          catalogue_id: productData.catalogue_id.toString(),
          productName: productData.productName,
          quantity: productData.quantity,
          unitPrice: productData.unitPrice,
          totalAmount: productData.totalAmount,
        } as any);
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
          model: DCPOProduct,
          as: 'Products',
          attributes: [
            'id', 'dcPOId', 'productId', 'catalogue_id', 'productName', 'quantity', 
            'unitPrice', 'totalAmount', 'mrp', 'cost', 'description', 'notes', 
            'hsn', 'ean_upc', 'weight', 'length', 'height', 'width', 
            'inventory_threshold', 'gst', 'cess', 'image_url', 'brand_id', 
            'category_id', 'status', 'sku_matrix_on_catelogue_id', 'createdAt', 'updatedAt'
          ],
          include: [
            {
              model: ProductMaster,
              as: 'Product',
              attributes: ['id', 'catelogue_id', 'name', 'mrp'],
            },
            {
              model: DCPOSkuMatrix,
              as: 'SkuMatrix',
              attributes: ['id', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin'],
            },
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

    return po;
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
          model: DCPOProduct,
          as: 'Products',
          attributes: [
            'id', 'dcPOId', 'productId', 'catalogue_id', 'productName', 'quantity', 
            'unitPrice', 'totalAmount', 'mrp', 'cost', 'description', 'notes', 
            'hsn', 'ean_upc', 'weight', 'length', 'height', 'width', 
            'inventory_threshold', 'gst', 'cess', 'image_url', 'brand_id', 
            'category_id', 'status', 'sku_matrix_on_catelogue_id', 'createdAt', 'updatedAt'
          ],
          include: [
            {
              model: ProductMaster,
              as: 'Product',
              attributes: ['id', 'catelogue_id', 'name', 'mrp', 'hsn', 'brand_id'],
            },
            {
              model: DCPOSkuMatrix,
              as: 'SkuMatrix',
              attributes: ['id', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin'],
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
    await this.sendApprovalEmail(po, 'category_head');

    return po;
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
    
    // Send email using new EmailService
    const success = await EmailService.sendDCApprovalEmail(
      [recipientEmail],
      po.poId,
      po.Vendor?.tradeName || po.Vendor?.dataValues?.tradeName || 'N/A',
      po.DistributionCenter?.name || po.DistributionCenter?.dataValues?.name || 'N/A',
      po.totalAmount,
      po.priority,
      po.Products ?? [],
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
          model: DCPOProduct,
          as: 'Products',
          include: [
            {
              model: DCPOSkuMatrix,
              as: 'SkuMatrix',
            },
          ],
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
        const products = await DCPOProduct.findAll({
          where: { dcPOId: po.id },
          attributes: ['catalogue_id', 'quantity', 'sku_matrix_on_catelogue_id']
        });

        for (const product of products) {
          // Get the actual SKU from SKU matrix if available, otherwise use catalogue_id
          let skuId = product.catalogue_id.toString().padStart(12, '0');
          
          if (product.sku_matrix_on_catelogue_id) {
            try {
              const skuMatrix = typeof product.sku_matrix_on_catelogue_id === 'string' 
                ? JSON.parse(product.sku_matrix_on_catelogue_id)
                : product.sku_matrix_on_catelogue_id;
              
              if (skuMatrix && skuMatrix.length > 0) {
                // Use the first SKU from the matrix as the primary SKU
                skuId = skuMatrix[0].sku;
              }
            } catch (error) {
              console.error('Error parsing SKU matrix for PO approval:', error);
            }
          }
          
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
          model: DCPOProduct,
          as: 'Products',
          attributes: ['id', 'catalogue_id', 'productName', 'quantity', 'unitPrice', 'totalAmount'],
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
          model: DCPOProduct,
          as: 'Products',
          attributes: [
            'id', 'dcPOId', 'productId', 'catalogue_id', 'productName', 'quantity', 
            'unitPrice', 'totalAmount', 'mrp', 'cost', 'description', 'notes', 
            'hsn', 'ean_upc', 'weight', 'length', 'height', 'width', 
            'inventory_threshold', 'gst', 'cess', 'image_url', 'brand_id', 
            'category_id', 'status', 'sku_matrix_on_catelogue_id', 'createdAt', 'updatedAt'
          ],
          include: [
            {
              model: ProductMaster,
              as: 'Product',
              attributes: ['id', 'catelogue_id', 'name', 'mrp', 'hsn', 'brand_id'],
            },
            {
              model: DCPOSkuMatrix,
              as: 'SkuMatrix',
              attributes: ['id', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin'],
            },
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
      return null;
    }

    // Transform the data to add sp field to SkuMatrix
    const poData = po.toJSON();
    
    if (poData.Products) {
      poData.Products.forEach((product: any) => {
        if (product.SkuMatrix) {
          product.SkuMatrix.forEach((sku: any) => {
            // Map selling_price to sp field
            sku.sp = sku.selling_price;
          });
        }
      });
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
          model: DCPOProduct,
          as: 'Products',
          include: [
            {
              model: ProductMaster,
              as: 'Product',
              attributes: [
                'id', 'catelogue_id', 'name', 'description', 'category', 'brand_id', 
                'mrp', 'hsn', 'ean_upc', 'weight', 'length', 'height', 'width', 
                'inventory_threshold', 'gst', 'cess', 'image_url', 'status',
                'created_at', 'updated_at'
              ],
            },
            {
              model: DCPOSkuMatrix,
              as: 'SkuMatrix',
              attributes: [
                'id', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 
                'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 
                'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 
                'gst', 'cess', 'createdAt', 'updatedAt'
              ],
            },
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

    // Calculate summary statistics
    const productSummary = {
      totalProducts: po.Products?.length || 0,
      totalQuantity: po.Products?.reduce((sum: number, product: any) => sum + product.quantity, 0) || 0,
      totalAmount: po.totalAmount,
      averageUnitPrice: po.Products?.length > 0 ? 
        po.totalAmount / (po.Products.reduce((sum: number, product: any) => sum + product.quantity, 0)) : 0,
      categories: [...new Set(po.Products?.map((p: any) => p.Product?.Category).filter(Boolean) || [])],
      brands: [...new Set(po.Products?.map((p: any) => p.Product?.Brand).filter(Boolean) || [])],
    };

    // Add calculated fields and SKU splitting status to each product
    console.log('📦 Processing products:', po.Products?.length || 0);
    const productsWithCalculations = await Promise.all((po.Products || []).map(async (product: any) => {
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
        ...product.toJSON(),
        Product: {
          ...product.Product?.toJSON(),
          // Add calculated fields
          totalOrderedValue: product.quantity * product.unitPrice,
          marginAmount: product.unitPrice - (product.cost || 0), // Use product.cost from DCPOProduct
          marginPercentage: product.cost ? 
            ((product.unitPrice - product.cost) / product.cost * 100) : 0,
          savingsFromMRP: (product.Product?.mrp || 0) - product.unitPrice,
          savingsPercentage: product.Product?.mrp ? 
            ((product.Product.mrp - product.unitPrice) / product.Product.mrp * 100) : 0,
        },
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

    // Update DC Inventory 1 for PO approval
    const products = await DCPOProduct.findAll({
      where: { dcPOId: poId },
      attributes: ['catalogue_id', 'quantity', 'sku_matrix_on_catelogue_id']
    });

    for (const product of products) {
      // Get the actual SKU from SKU matrix if available, otherwise use catalogue_id
      let skuId = product.catalogue_id.toString().padStart(12, '0');
      
      if (product.sku_matrix_on_catelogue_id) {
        try {
          const skuMatrix = typeof product.sku_matrix_on_catelogue_id === 'string' 
            ? JSON.parse(product.sku_matrix_on_catelogue_id)
            : product.sku_matrix_on_catelogue_id;
          
          if (skuMatrix && skuMatrix.length > 0) {
            // Use the first SKU from the matrix as the primary SKU
            skuId = skuMatrix[0].sku;
          }
        } catch (error) {
          console.error('Error parsing SKU matrix for PO approval:', error);
        }
      }
      
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
            model: DCPOProduct,
            as: 'Products',
            include: [
              {
                model: ProductMaster,
                as: 'Product',
                attributes: ['id', 'catelogue_id', 'name', 'mrp', 'hsn', 'brand_id']
              }
            ]
          }
        ]
      });

      if (!po) {
        console.error('PO not found for final notification email');
        return;
      }

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
        (po as any).Products ?? []
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
    // 1️⃣ Fetch existing PO and products once
    const existingPO = await DCPurchaseOrder.findByPk(poId, {
  include: [{ model: DCPOProduct, as: 'Products' }],
  transaction,
});

    if (!existingPO) throw new Error('DC Purchase Order not found');
    if (existingPO.isEdited)
      throw new Error('This PO has already been edited once.');

    const editLogs: any[] = [];

    // Convert products array to Map for quick access
    const existingProductsMap: Map<string, DCPOProduct> = new Map(
  (existingPO.Products ?? []).map((p: DCPOProduct) => [p.catalogue_id, p])
);


    const updatedProducts: any[] = [];
    const newProducts: any[] = [];

    // 2️⃣ Iterate through input products
    if (data.products?.length) {
      for (const product of data.products) {
        for (const skuItem of product.sku_matrix_on_catelogue_id) {
          const existingProduct = existingProductsMap.get(skuItem.catalogue_id);

          if (existingProduct) {
            // Compare field-wise differences
            const productFields = [
              'quantity',
              'unitPrice',
              'totalAmount',
              'mrp',
              'hsn',
              'ean_upc',
              'weight',
              'length',
              'height',
              'width',
            ];

            let modified = false;

            for (const field of productFields) {
              const newValue = (skuItem as any)[field];
              const oldValue = (existingProduct as any)[field];

              // Compare only if defined and changed
              if (
                newValue !== undefined &&
                newValue !== null &&
                newValue !== oldValue
              ) {
                modified = true;

                // Add to history log
                editLogs.push({
                  po_id: poId,
                  product_id: existingProduct.id,
                  field,
                  old_value: oldValue,
                  new_value: newValue,
                  change_type: 'PRODUCT_EDITED',
                  changed_by: userId,
                  changed_at: new Date(),
                });

                // Update in-memory for batch update
                (existingProduct as any)[field] = newValue;
              }
            }

            if (modified) updatedProducts.push(existingProduct);
          } else {
            // Product doesn’t exist → new addition
            const newProduct = {
              dcPOId: poId,
              productId: parseInt(skuItem.catalogue_id),
              catalogue_id: skuItem.catalogue_id,
              productName: skuItem.product_name,
              quantity: skuItem.quantity,
              unitPrice: parseFloat(skuItem.selling_price),
              totalAmount:
                parseFloat(skuItem.selling_price) * parseFloat(skuItem.quantity),
              mrp: parseFloat(skuItem.mrp),
              hsn: skuItem.hsn,
              ean_upc: skuItem.ean_upc,
              weight: skuItem.weight,
              length: skuItem.length,
              height: skuItem.height,
              width: skuItem.width,
              sku_matrix_on_catelogue_id: JSON.stringify(
                product.sku_matrix_on_catelogue_id
              ),
            };

            newProducts.push(newProduct);

            // Log product addition
            editLogs.push({
              po_id: poId,
              field: 'product',
              old_value: null,
              new_value: JSON.stringify(newProduct),
              change_type: 'PRODUCT_ADDED',
              changed_by: userId,
              changed_at: new Date(),
            });
          }
        }
      }
    }

    // 3️⃣ Bulk update existing modified products
    if (updatedProducts.length) {
      // If DB supports it, use upsert-like pattern
      const safeUpdatedProducts = updatedProducts.map((p: any) => ({
  id: p.id,                     // primary key, used for update
  dcPOId: p.dcPOId,             // required
  productId: p.productId,       // required
  catalogue_id: p.catalogue_id, // required
  productName: p.productName,   // required
  quantity: p.quantity,
  unitPrice: p.unitPrice,
  totalAmount: p.totalAmount,
  mrp: p.mrp,
  hsn: p.hsn,
  ean_upc: p.ean_upc,
  weight: p.weight,
  length: p.length,
  height: p.height,
  width: p.width,
  updatedAt: new Date(),
}));

await DCPOProduct.bulkCreate(safeUpdatedProducts, {
  updateOnDuplicate: [
    'quantity',
    'unitPrice',
    'totalAmount',
    'mrp',
    'hsn',
    'ean_upc',
    'weight',
    'length',
    'height',
    'width',
    'updatedAt',
  ],
  transaction,
});
    }

    // 4️⃣ Bulk insert new products
    if (newProducts.length) {
      await DCPOProduct.bulkCreate(newProducts, { transaction });
    }

    // 5️⃣ Save edit history
    if (editLogs.length) {
      await POEditHistory.bulkCreate(editLogs, { transaction });
    }

    // 6️⃣ Mark PO as edited (only once)
    existingPO.isEdited = true;
    existingPO.status = 'PENDING_CATEGORY_HEAD'
    await existingPO.save({ transaction });

    await transaction.commit();
    return { message: 'PO edited successfully (products only)', poId };
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
            model: DCPOProduct,
            as: 'Products',
            include: [
              {
                model: DCPOSkuMatrix,
                as: 'SkuMatrix',
              },
            ],
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
      await DCPOApproval.update(
        {
          action,
          approverRole,
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
        const products = await DCPOProduct.findAll({
          where: { dcPOId: po.id },
          attributes: ['catalogue_id', 'quantity', 'sku_matrix_on_catelogue_id'],
          transaction
        });

        for (const product of products) {
          // Get the actual SKU from SKU matrix if available, otherwise use catalogue_id
          let skuId = product.catalogue_id.toString().padStart(12, '0');
          
          if (product.sku_matrix_on_catelogue_id) {
            try {
              const skuMatrix = typeof product.sku_matrix_on_catelogue_id === 'string' 
                ? JSON.parse(product.sku_matrix_on_catelogue_id)
                : product.sku_matrix_on_catelogue_id;
              
              if (skuMatrix && skuMatrix.length > 0) {
                // Use the first SKU from the matrix as the primary SKU
                skuId = skuMatrix[0].sku;
              }
            } catch (error) {
              console.error('Error parsing SKU matrix for PO approval:', error);
            }
          }
          
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

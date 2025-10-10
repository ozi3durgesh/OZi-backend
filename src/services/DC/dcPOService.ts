import { Op } from 'sequelize';
import crypto from 'crypto';
import DCPurchaseOrder, { DCPurchaseOrderCreationAttributes } from '../../models/DCPurchaseOrder';
import DCPOProduct, { DCPOProductCreationAttributes } from '../../models/DCPOProduct';
import DCPOApproval, { DCPOApprovalCreationAttributes } from '../../models/DCPOApproval';
import VendorDC from '../../models/VendorDC';
import ParentProductMasterDC from '../../models/ParentProductMasterDC';
import { DistributionCenter, User } from '../../models';
import { DC_PO_CONSTANTS } from '../../constants/dcPOConstants';
import { EmailService } from '../emailService';

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
    productId: number;
    quantity: number;
    unitPrice: number;
    description?: string;
    notes?: string;
  }>;
  description?: string;
  notes?: string;
  priority?: string;
  createdBy: number;
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
    // Validate vendor exists
    const vendor = await VendorDC.findByPk(data.vendorId);
    if (!vendor) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.INVALID_VENDOR);
      error.statusCode = 400;
      throw error;
    }

    // Validate DC exists
    const dc = await DistributionCenter.findByPk(data.dcId);
    if (!dc) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.INVALID_DC);
      error.statusCode = 400;
      throw error;
    }

    // Validate products exist
    const productIds = data.products.map(p => p.productId);
    const products = await ParentProductMasterDC.findAll({
      where: { id: { [Op.in]: productIds } }
    });

    if (products.length !== productIds.length) {
      const error: any = new Error(DC_PO_CONSTANTS.ERRORS.PRODUCT_REQUIRED);
      error.statusCode = 400;
      throw error;
    }

    // Calculate total amount
    let totalAmount = 0;
    const validatedProducts = data.products.map(productData => {
      const product = products.find(p => p.id === productData.productId);
      const productTotal = productData.quantity * productData.unitPrice;
      totalAmount += productTotal;

      return {
        productId: productData.productId,
        sku: product!.catalogue_id,
        productName: product!.name || 'Unknown Product',
        quantity: productData.quantity,
        unitPrice: productData.unitPrice,
        totalAmount: productTotal,
        mrp: product!.mrp,
        cost: product!.cost,
        description: productData.description,
        notes: productData.notes,
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

    // Create PO products
    const poProducts = await Promise.all(
      validatedProducts.map(productData =>
        DCPOProduct.create({
          dcPOId: newPO.id,
          ...productData,
        } as DCPOProductCreationAttributes)
      )
    );

    // Initialize approval workflow
    await this.initializeApprovalWorkflow(newPO.id);

    // Fetch the created PO with associations
    const po = await DCPurchaseOrder.findByPk(newPO.id, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
          attributes: ['id', 'vendorId', 'businessName', 'pocName', 'pocEmail'],
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
          include: [
            {
              model: ParentProductMasterDC,
              as: 'Product',
              attributes: ['id', 'SKU', 'ProductName', 'MRP', 'COST'],
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
          include: [
            {
              model: ParentProductMasterDC,
              as: 'Product',
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
    approvalLink = `${process.env.APP_BASE_URL_FRONTEND}/dc-po-approval/${encodeURIComponent(token)}`;

    // Get recipient email
    const recipientEmail = DC_PO_CONSTANTS.EMAIL.APPROVAL_EMAILS[role];
    
    // Send email using new EmailService
    const success = await EmailService.sendDCApprovalEmail(
      [recipientEmail],
      po.poId,
      po.Vendor?.businessName || 'N/A',
      po.DistributionCenter?.name || 'N/A',
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
          attributes: ['id', 'vendorId', 'businessName', 'pocName'],
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
          attributes: ['id', 'sku', 'productName', 'quantity', 'unitPrice', 'totalAmount'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      purchaseOrders: rows,
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
    return await DCPurchaseOrder.findByPk(id, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
          attributes: ['id', 'vendorId', 'businessName', 'pocName', 'pocEmail', 'businessAddress'],
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
          include: [
            {
              model: ParentProductMasterDC,
              as: 'Product',
              attributes: ['id', 'SKU', 'ProductName', 'MRP', 'COST', 'hsn', 'Brand'],
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
    const po: any = await DCPurchaseOrder.findByPk(poId, {
      include: [
        {
          model: VendorDC,
          as: 'Vendor',
          attributes: ['id', 'vendorId', 'businessName', 'pocName', 'pocEmail', 'businessAddress', 'city', 'state'],
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
              model: ParentProductMasterDC,
              as: 'Product',
              attributes: [
                'id', 'SKU', 'ProductName', 'Description', 'Category', 'Brand', 
                'MRP', 'COST', 'hsn', 'EAN_UPC', 'Color', 'Size', 'Weight', 
                'Length', 'Height', 'Width', 'Flammable', 'SPThreshold', 
                'InventoryThreshold', 'ShelfLife', 'ShelfLifePercentage', 
                'ProductExpiryInDays', 'gst', 'CESS', 'ImageURL', 'Status',
                'CreatedDate', 'LastUpdatedDate'
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

    // Add calculated fields to each product
    const productsWithCalculations = (po.Products || []).map((product: any) => ({
      ...product.toJSON(),
      Product: {
        ...product.Product?.toJSON(),
        // Add calculated fields
        totalOrderedValue: product.quantity * product.unitPrice,
        marginAmount: product.unitPrice - (product.Product?.COST || 0),
        marginPercentage: product.Product?.COST ? 
          ((product.unitPrice - product.Product.COST) / product.Product.COST * 100) : 0,
        savingsFromMRP: (product.Product?.MRP || 0) - product.unitPrice,
        savingsPercentage: product.Product?.MRP ? 
          ((product.Product.MRP - product.unitPrice) / product.Product.MRP * 100) : 0,
      }
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
}

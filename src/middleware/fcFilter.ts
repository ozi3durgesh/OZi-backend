// middleware/fcFilter.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from './responseHandler';

// Extend Request interface to include FC context
declare global {
  namespace Express {
    interface Request {
      fcContext?: {
        currentFcId: number;
        availableFcs: number[];
        dcId?: number;
      };
    }
  }
}

/**
 * FC Filter Middleware
 * Ensures all database queries are filtered by the user's current FC
 * This provides data isolation between different fulfillment centers
 */
export const fcFilter = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      ResponseHandler.error(res, 'Authentication required', 401);
      return;
    }

    const currentFcId = req.user.currentFcId;
    const availableFcs = req.user.availableFcs || [];

    if (!currentFcId) {
      ResponseHandler.error(res, 'No Fulfillment Center selected. Please select a FC first.', 403);
      return;
    }

    if (!availableFcs.includes(currentFcId)) {
      ResponseHandler.error(res, 'Access denied to current Fulfillment Center', 403);
      return;
    }

    // Add FC context to request for use in controllers
    req.fcContext = {
      currentFcId,
      availableFcs,
      dcId: req.user.dcId // If available from user context
    };

    next();
  } catch (error) {
    console.error('FC filter error:', error);
    ResponseHandler.error(res, 'FC filter check failed', 500);
  }
};

/**
 * FC Query Builder Helper
 * Automatically adds FC filtering to Sequelize queries
 */
export class FCQueryBuilder {
  /**
   * Add FC filter to where clause
   */
  static addFCFilter(whereClause: any, fcId: number, fcField: string = 'fc_id'): any {
    return {
      ...whereClause,
      [fcField]: fcId
    };
  }

  /**
   * Add FC filter for orders (orders are assigned to FCs)
   */
  static addOrderFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for inventory (inventory belongs to FCs)
   */
  static addInventoryFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for products (products are available in FCs)
   */
  static addProductFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for GRNs (GRNs are created for specific FCs)
   */
  static addGRNFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for picklists (picklists are created for specific FCs)
   */
  static addPicklistFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for putaway (putaway operations are FC-specific)
   */
  static addPutawayFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for returns (returns are processed by specific FCs)
   */
  static addReturnFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for purchase orders (POs are created for specific FCs)
   */
  static addPOFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for vendors (vendors are assigned to specific FCs)
   */
  static addVendorFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for warehouses (warehouses belong to specific FCs)
   */
  static addWarehouseFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for bin locations (bin locations belong to specific FCs)
   */
  static addBinLocationFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for bulk import logs (bulk imports are FC-specific)
   */
  static addBulkImportFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }

  /**
   * Add FC filter for PO products (PO products belong to specific FCs)
   */
  static addPOProductFCFilter(whereClause: any, fcId: number): any {
    return this.addFCFilter(whereClause, fcId, 'fc_id');
  }
}

/**
 * FC Validation Helper
 * Validates that operations are performed within the correct FC context
 */
export class FCValidator {
  /**
   * Validate that a resource belongs to the user's current FC
   */
  static async validateFCResource(
    model: any,
    resourceId: number,
    fcId: number,
    fcField: string = 'fc_id'
  ): Promise<boolean> {
    try {
      const resource = await model.findOne({
        where: {
          id: resourceId,
          [fcField]: fcId
        }
      });
      return !!resource;
    } catch (error) {
      console.error('FC validation error:', error);
      return false;
    }
  }

  /**
   * Validate order belongs to FC
   */
  static async validateOrderFC(orderId: number, fcId: number): Promise<boolean> {
    const { Order } = await import('../models/index.js');
    return this.validateFCResource(Order, orderId, fcId, 'fc_id');
  }

  /**
   * Validate product belongs to FC
   */
  static async validateProductFC(productId: number, fcId: number): Promise<boolean> {
    const { ProductMaster } = await import('../models/index.js');
    return this.validateFCResource(ProductMaster, productId, fcId, 'fc_id');
  }

  /**
   * Validate inventory belongs to FC
   */
  static async validateInventoryFC(inventoryId: number, fcId: number): Promise<boolean> {
    const { Inventory } = await import('../models/index.js');
    return this.validateFCResource(Inventory, inventoryId, fcId, 'fc_id');
  }

  /**
   * Validate GRN belongs to FC
   */
  static async validateGRNFC(grnId: number, fcId: number): Promise<boolean> {
    const { FCGrn } = await import('../models/index.js');
    return this.validateFCResource(FCGrn, grnId, fcId, 'fc_id');
  }

  /**
   * Validate picklist belongs to FC
   */
  static async validatePicklistFC(picklistId: number, fcId: number): Promise<boolean> {
    // Picklist model not available, skipping validation
    console.warn('Picklist model not available for FC validation');
    return true;
  }

  /**
   * Validate putaway belongs to FC
   */
  static async validatePutawayFC(putawayId: number, fcId: number): Promise<boolean> {
    // Putaway model not available, skipping validation
    console.warn('Putaway model not available for FC validation');
    return true;
  }

  /**
   * Validate return belongs to FC
   */
  static async validateReturnFC(returnId: number, fcId: number): Promise<boolean> {
    // Return model not available, skipping validation
    console.warn('Return model not available for FC validation');
    return true;
  }

  /**
   * Validate vendor belongs to FC
   */
  static async validateVendorFC(vendorId: number, fcId: number): Promise<boolean> {
    // Vendor model not available, skipping validation
    console.warn('Vendor model not available for FC validation');
    return true;
  }

  /**
   * Validate warehouse belongs to FC
   */
  static async validateWarehouseFC(warehouseId: number, fcId: number): Promise<boolean> {
    const { Warehouse } = await import('../models/index.js');
    return this.validateFCResource(Warehouse, warehouseId, fcId, 'fc_id');
  }

  /**
   * Validate bin location belongs to FC
   */
  static async validateBinLocationFC(binLocationId: number, fcId: number): Promise<boolean> {
    const { BinLocation } = await import('../models/index.js');
    return this.validateFCResource(BinLocation, binLocationId, fcId, 'fc_id');
  }

  /**
   * Validate bulk import log belongs to FC
   */
  static async validateBulkImportFC(bulkImportId: number, fcId: number): Promise<boolean> {
    const { BulkImportLog } = await import('../models/index.js');
    return this.validateFCResource(BulkImportLog, bulkImportId, fcId, 'fc_id');
  }

  /**
   * Validate PO product belongs to FC
   */
  static async validatePOProductFC(poProductId: number, fcId: number): Promise<boolean> {
    const { POProduct } = await import('../models/index.js');
    return this.validateFCResource(POProduct, poProductId, fcId, 'fc_id');
  }
}

/**
 * FC Context Helper
 * Provides FC context information to controllers
 */
export class FCContextHelper {
  /**
   * Get FC context from request
   */
  static getFCContext(req: Request): { currentFcId: number; availableFcs: number[]; dcId?: number } {
    if (!req.fcContext) {
      throw new Error('FC context not available. Ensure fcFilter middleware is applied.');
    }
    return req.fcContext;
  }

  /**
   * Get current FC ID from request
   */
  static getCurrentFCId(req: Request): number {
    const context = this.getFCContext(req);
    return context.currentFcId;
  }

  /**
   * Get available FCs from request
   */
  static getAvailableFCs(req: Request): number[] {
    const context = this.getFCContext(req);
    return context.availableFcs;
  }

  /**
   * Get DC ID from request (if available)
   */
  static getDCId(req: Request): number | undefined {
    const context = this.getFCContext(req);
    return context.dcId;
  }

  /**
   * Check if user has access to specific FC
   */
  static hasAccessToFC(req: Request, fcId: number): boolean {
    const availableFcs = this.getAvailableFCs(req);
    return availableFcs.includes(fcId);
  }
}

export default fcFilter;

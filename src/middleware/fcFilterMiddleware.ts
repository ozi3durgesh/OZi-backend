// middleware/fcFilterMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from './responseHandler';
import { FCQueryBuilder, FCValidator, FCContextHelper } from './fcFilter';

/**
 * FC Filter Middleware Factory
 * Creates middleware that automatically filters data by FC
 */
export class FCFilterMiddlewareFactory {
  /**
   * Create FC filter middleware for a specific model
   */
  static createModelFilter(modelName: string, fcField: string = 'fc_id') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        // Add FC context to request
        req.fcContext = {
          currentFcId,
          availableFcs,
          dcId: req.user.dcId
        };

        // Add FC filter to query parameters
        if (req.query) {
          req.query[fcField] = currentFcId.toString();
        }

        // Add FC filter to body for POST/PUT requests
        if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          req.body[fcField] = currentFcId;
        }

        next();
      } catch (error) {
        console.error(`FC filter error for ${modelName}:`, error);
        ResponseHandler.error(res, 'FC filter check failed', 500);
      }
    };
  }

  /**
   * Create FC filter middleware for orders
   */
  static createOrderFilter() {
    return this.createModelFilter('Order', 'fc_id');
  }

  /**
   * Create FC filter middleware for products
   */
  static createProductFilter() {
    return this.createModelFilter('Product', 'fc_id');
  }

  /**
   * Create FC filter middleware for inventory
   */
  static createInventoryFilter() {
    return this.createModelFilter('Inventory', 'fc_id');
  }

  /**
   * Create FC filter middleware for purchase orders
   */
  static createPOFilter() {
    return this.createModelFilter('PurchaseOrder', 'fc_id');
  }

  /**
   * Create FC filter middleware for GRNs
   */
  static createGRNFilter() {
    return this.createModelFilter('GRN', 'fc_id');
  }

  /**
   * Create FC filter middleware for vendors
   */
  static createVendorFilter() {
    return this.createModelFilter('Vendor', 'fc_id');
  }

  /**
   * Create FC filter middleware for warehouses
   */
  static createWarehouseFilter() {
    return this.createModelFilter('Warehouse', 'fc_id');
  }

  /**
   * Create FC filter middleware for bin locations
   */
  static createBinLocationFilter() {
    return this.createModelFilter('BinLocation', 'fc_id');
  }

  /**
   * Create FC filter middleware for bulk imports
   */
  static createBulkImportFilter() {
    return this.createModelFilter('BulkImportLog', 'fc_id');
  }

  /**
   * Create FC filter middleware for PO products
   */
  static createPOProductFilter() {
    return this.createModelFilter('POProduct', 'fc_id');
  }

  /**
   * Create FC filter middleware for returns
   */
  static createReturnFilter() {
    return this.createModelFilter('ReturnRequestItem', 'fc_id');
  }

  /**
   * Create FC filter middleware for putaway tasks
   */
  static createPutawayFilter() {
    return this.createModelFilter('FC_PutawayTask', 'fc_id');
  }

  /**
   * Create FC filter middleware for picking waves
   */
  static createPickingWaveFilter() {
    return this.createModelFilter('PickingWave', 'fc_id');
  }

  /**
   * Create FC filter middleware for packing jobs
   */
  static createPackingJobFilter() {
    return this.createModelFilter('PackingJob', 'fc_id');
  }

  /**
   * Create FC filter middleware for handovers
   */
  static createHandoverFilter() {
    return this.createModelFilter('Handover', 'fc_id');
  }
}

/**
 * FC Resource Validator Middleware
 * Validates that a resource belongs to the user's current FC
 */
export const fcResourceValidator = (modelName: string, fcField: string = 'fc_id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = parseInt(req.params.id);
      const currentFcId = FCContextHelper.getCurrentFCId(req);

      if (isNaN(resourceId)) {
        ResponseHandler.error(res, 'Invalid resource ID', 400);
        return;
      }

      // Import the model dynamically
      const models = await import('../models/index.js');
      const Model = (models as any)[modelName];

      if (!Model) {
        ResponseHandler.error(res, `Model ${modelName} not found`, 500);
        return;
      }

      const isValid = await FCValidator.validateFCResource(Model, resourceId, currentFcId, fcField);
      
      if (!isValid) {
        ResponseHandler.error(res, 'Resource not found or access denied', 404);
        return;
      }

      next();
    } catch (error) {
      console.error('FC resource validation error:', error);
      ResponseHandler.error(res, 'Resource validation failed', 500);
    }
  };
};

/**
 * FC Query Helper Middleware
 * Automatically adds FC filtering to Sequelize queries
 */
export const fcQueryHelper = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.fcContext) {
      ResponseHandler.error(res, 'FC context not available', 500);
      return;
    }

    const { currentFcId } = req.fcContext;

    // Add helper methods to request object
    req.addFCFilter = (whereClause: any, fcField: string = 'fc_id') => {
      return FCQueryBuilder.addFCFilter(whereClause, currentFcId, fcField);
    };

    req.getCurrentFCId = () => currentFcId;
    req.getFCContext = () => req.fcContext;

    next();
  } catch (error) {
    console.error('FC query helper error:', error);
    ResponseHandler.error(res, 'FC query helper failed', 500);
  }
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      addFCFilter?: (whereClause: any, fcField?: string) => any;
      getCurrentFCId?: () => number;
      getFCContext?: () => any;
    }
  }
}

export default FCFilterMiddlewareFactory;

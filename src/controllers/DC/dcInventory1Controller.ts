import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { DCInventory1Service } from '../../services/DCInventory1Service';

interface AuthRequest extends Request {
  user?: any;
}

export class DCInventory1Controller {
  /**
   * Get all DC Inventory 1 records
   */
  static async getAll(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const records = await DCInventory1Service.getAll();
      
      return ResponseHandler.success(res, {
        message: 'DC Inventory 1 records retrieved successfully',
        data: records,
        count: records.length
      });
    } catch (error: any) {
      console.error('Get DC Inventory 1 records error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to retrieve DC Inventory 1 records', 500);
    }
  }

  /**
   * Get DC Inventory 1 record by SKU ID and DC ID
   */
  static async getBySkuIdAndDcId(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { skuId, dcId } = req.params;

      if (!skuId || !dcId) {
        return ResponseHandler.error(res, 'SKU ID and DC ID are required', 400);
      }

      const record = await DCInventory1Service.getBySkuIdAndDcId(skuId, parseInt(dcId));

      if (!record) {
        return ResponseHandler.error(res, 'DC Inventory 1 record not found', 404);
      }

      return ResponseHandler.success(res, {
        message: 'DC Inventory 1 record retrieved successfully',
        data: record
      });
    } catch (error: any) {
      console.error('Get DC Inventory 1 record error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to retrieve DC Inventory 1 record', 500);
    }
  }

  /**
   * Get DC Inventory 1 records by DC ID
   */
  static async getByDcId(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { dcId } = req.params;

      if (!dcId) {
        return ResponseHandler.error(res, 'DC ID is required', 400);
      }

      const records = await DCInventory1Service.getByDcId(parseInt(dcId));

      return ResponseHandler.success(res, {
        message: 'DC Inventory 1 records retrieved successfully',
        data: records,
        count: records.length
      });
    } catch (error: any) {
      console.error('Get DC Inventory 1 records error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to retrieve DC Inventory 1 records', 500);
    }
  }

  /**
   * Get DC Inventory 1 summary statistics
   */
  static async getSummary(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const records = await DCInventory1Service.getAll();
      
      const summary = {
        total_skus: records.length,
        total_po_raised: records.reduce((sum, record) => sum + record.po_raise_quantity, 0),
        total_po_approved: records.reduce((sum, record) => sum + record.po_approve_quantity, 0),
        total_grn_done: records.reduce((sum, record) => sum + record.grn_done, 0),
        pending_approvals: records.filter(record => record.po_raise_quantity > record.po_approve_quantity).length,
        fully_processed: records.filter(record => 
          record.po_raise_quantity === record.po_approve_quantity && 
          record.grn_done > 0
        ).length
      };

      return ResponseHandler.success(res, {
        message: 'DC Inventory 1 summary retrieved successfully',
        data: summary
      });
    } catch (error: any) {
      console.error('Get DC Inventory 1 summary error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to retrieve DC Inventory 1 summary', 500);
    }
  }
}

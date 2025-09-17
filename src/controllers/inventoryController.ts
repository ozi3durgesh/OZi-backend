import { Request, Response } from 'express';
import DirectInventoryService from '../services/DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';
import { AuthRequest } from '../types';

export class InventoryController {
  /**
   * Update inventory for a specific SKU
   */
  static async updateInventory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sku, operation, quantity, referenceId, operationDetails } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated'
        });
        return;
      }

      // Validate required fields
      if (!sku || !operation || quantity === undefined) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'sku, operation, and quantity are required'
        });
        return;
      }

      // Validate operation type
      const validOperations = Object.values(INVENTORY_OPERATIONS);
      if (!validOperations.includes(operation)) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: `Invalid operation. Must be one of: ${validOperations.join(', ')}`
        });
        return;
      }

      // Validate quantity
      if (typeof quantity !== 'number' || quantity === 0) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'quantity must be a non-zero number'
        });
        return;
      }

      const result = await DirectInventoryService.updateInventory({
        sku,
        operation,
        quantity,
        referenceId,
        operationDetails,
        performedBy: userId
      });

      if (result.success) {
        res.status(200).json({
          statusCode: 200,
          success: true,
          data: result.data,
          error: null
        });
      } else {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: result.message
        });
      }
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get inventory summary for a SKU
   */
  static async getInventorySummary(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;

      if (!sku) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU parameter is required'
        });
        return;
      }

      const summary = await DirectInventoryService.getInventorySummary(sku);

      if (summary) {
        res.status(200).json({
          statusCode: 200,
          success: true,
          data: summary,
          error: null
        });
      } else {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Inventory not found for this SKU'
        });
      }
    } catch (error: any) {
      console.error('Error getting inventory summary:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get inventory logs for a SKU
   */
  static async getInventoryLogs(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      const { limit = 10 } = req.query;

      if (!sku) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU parameter is required'
        });
        return;
      }

      const logs = await DirectInventoryService.getInventoryLogs(sku, Number(limit));

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          sku,
          logs,
          count: logs.length
        },
        error: null
      });
    } catch (error: any) {
      console.error('Error getting inventory logs:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Check inventory availability for a SKU
   */
  static async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      const { requiredQuantity } = req.query;

      if (!sku) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU parameter is required'
        });
        return;
      }

      if (!requiredQuantity || isNaN(Number(requiredQuantity))) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'requiredQuantity query parameter is required and must be a number'
        });
        return;
      }

      const availability = await DirectInventoryService.checkAvailability(
        sku, 
        Number(requiredQuantity)
      );

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: availability,
        error: null
      });
    } catch (error: any) {
      console.error('Error checking availability:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }
}

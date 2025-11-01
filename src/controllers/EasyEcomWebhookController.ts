import { Request, Response } from 'express';
import { ResponseHandler } from '../middleware/responseHandler';
import { Helpers } from '../utils/Helpers';
import Order from '../models/Order';
import EcomLog from '../models/EcomLog';
import { OrderAttributes } from '../types';
import DirectInventoryService from '../services/DirectInventoryService';
import Inventory from '../models/Inventory';
import PickingWave from '../models/PickingWave';
import PicklistItem from '../models/PicklistItem';
import OrderDetail from '../models/OrderDetail';
import { socketManager } from '../utils/socketManager';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    permissions: string[];
  };
}

export class EasyEcomWebhookController {
  /**
   * Get logs for ecommerce orders
   * This method calls Helpers::Ecommorder for each order
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async Getlogs(req: Request, res: Response): Promise<void> {
    try {
      // Get all orders that need to be processed
      const orders = await Order.findAll({
        where: {
          order_status: ['pending', 'confirmed', 'processing'],
          // Add any other conditions you need
        },
        include: [],
        order: [['created_at', 'DESC']],
        limit: 100, // Process in batches
      });

      if (!orders || orders.length === 0) {
        ResponseHandler.success(res, { message: 'No orders found for processing' });
        return;
      }

      const results: any[] = [];
      const errors: any[] = [];

      // Process each order through Ecommorder
      for (const order of orders) {
        try {
          const orderData = order.get({ plain: true }) as OrderAttributes;
          
          const result = await Helpers.Ecommorder(orderData);
          results.push({
            order_id: orderData.id,
            status: 'success',
            result
          });
          
        } catch (error: any) {
          const orderData = order.get({ plain: true }) as OrderAttributes;
          console.error(`Error processing order ${orderData.id}:`, error);
          
          errors.push({
            order_id: orderData.id,
            status: 'error',
            error: error.message
          });
        }
      }

      // Get recent ecommerce logs
      const recentLogs = await EcomLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 50,
      });

      ResponseHandler.success(res, {
        message: 'Orders processed successfully',
        summary: {
          total_orders: orders.length,
          successful: results.length,
          failed: errors.length
        },
        results,
        errors,
        recent_logs: recentLogs
      });

    } catch (error: any) {
      console.error('Error in Getlogs:', error);
      ResponseHandler.error(res, `Failed to process orders: ${error.message}`, 500);
    }
  }

  /**
   * Get ecommerce logs with pagination
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async getEcomLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const logs = await EcomLog.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      ResponseHandler.success(res, {
        logs: logs.rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(logs.count / limit),
          total_records: logs.count,
          records_per_page: limit
        }
      });

    } catch (error: any) {
      console.error('Error getting ecommerce logs:', error);
      ResponseHandler.error(res, `Failed to get logs: ${error.message}`, 500);
    }
  }

  /**
   * Get specific ecommerce log by ID
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async getEcomLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const log = await EcomLog.findByPk(id);
      
      if (!log) {
        ResponseHandler.error(res, 'Log not found', 404);
        return;
      }

      ResponseHandler.success(res, { log });

    } catch (error: any) {
      console.error('Error getting ecommerce log by ID:', error);
      ResponseHandler.error(res, `Failed to get log: ${error.message}`, 500);
    }
  }

  /**
   * Get ecommerce logs for specific order
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async getEcomLogsByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      const logs = await EcomLog.findAll({
        where: { order_id: orderId },
        order: [['created_at', 'DESC']],
      });

      ResponseHandler.success(res, { logs });

    } catch (error: any) {
      console.error('Error getting ecommerce logs by order ID:', error);
      ResponseHandler.error(res, `Failed to get logs: ${error.message}`, 500);
    }
  }

  /**
   * Retry failed ecommerce order
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async retryFailedOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        ResponseHandler.error(res, 'Order not found', 404);
        return;
      }

      
      const orderData = order.get({ plain: true }) as OrderAttributes;
      const result = await Helpers.Ecommorder(orderData);
      
      ResponseHandler.success(res, {
        message: 'Order retried successfully',
        order_id: orderId,
        result
      });

    } catch (error: any) {
      console.error('Error retrying order:', error);
      ResponseHandler.error(res, `Failed to retry order: ${error.message}`, 500);
    }
  }

  /**
   * PHP Integration endpoint - called directly from PHP Ecommorder function
   * This provides 100% flow matching with the PHP implementation
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async phpIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { order } = req.body;
      
      if (!order) {
        ResponseHandler.error(res, 'Order data is required', 400);
        return;
      }

      // Step 1: Extract SKUs with quantities and fc_id from order
      console.log(`🔍 Extracting SKUs with quantities and fc_id from order ${order.id}`);
      const skuData: Array<{ sku: string; quantity: number; fc_id: number }> = [];
      
      // Extract from cart items
      if (order.cart && Array.isArray(order.cart)) {
        for (const item of order.cart) {
          let sku: string | null = null;
          let fc_id: number | null = null;
          
          // Try to get SKU from item_details
          if (item.item_details) {
            try {
              const itemDetails = typeof item.item_details === 'string' 
                ? JSON.parse(item.item_details) 
                : item.item_details;
              sku = itemDetails.sku || itemDetails.id || null;
            } catch (e) {
              console.warn(`Failed to parse item_details for cart item:`, e);
            }
          }
          
          // Get fc_id from cart item or order
          fc_id = item.fc_id || order.fc_id || null;
          
          if (sku && fc_id && item.quantity) {
            skuData.push({
              sku: sku.toString(),
              quantity: parseInt(item.quantity) || 1,
              fc_id: parseInt(fc_id.toString())
            });
          }
        }
      }
      
      console.log(`📦 Extracted ${skuData.length} SKUs:`, skuData);

      // Step 2: Check inventory availability - verify sale_available_quantity >= ordered quantity
      let inventoryCheckFailed = false;
      const failedSkus: Array<{ sku: string; reason: string }> = [];
      
      for (const item of skuData) {
        try {
          // Check if SKU exists with matching fc_id in inventory table
          const inventory = await sequelize.query(
            'SELECT * FROM inventory WHERE sku = ? AND fc_id = ?',
            {
              replacements: [item.sku, item.fc_id],
              type: QueryTypes.SELECT
            }
          );

          if (inventory.length === 0) {
            inventoryCheckFailed = true;
            failedSkus.push({
              sku: item.sku,
              reason: `SKU not found in inventory for fc_id ${item.fc_id}`
            });
            console.error(`❌ SKU ${item.sku} not found in inventory for fc_id ${item.fc_id}`);
            continue;
          }

          const inv = inventory[0] as any;
          const saleAvailableQty = inv.sale_available_quantity || 0;
          const orderedQty = item.quantity;
          
          // Check if sale_available_quantity >= ordered quantity
          if (saleAvailableQty < orderedQty) {
            inventoryCheckFailed = true;
            failedSkus.push({
              sku: item.sku,
              reason: `Insufficient quantity. Available: ${saleAvailableQty}, Required: ${orderedQty}`
            });
            console.error(`❌ SKU ${item.sku} has insufficient sale_available_quantity. Available: ${saleAvailableQty}, Required: ${orderedQty}`);
          }
        } catch (error: any) {
          console.error(`❌ Error checking inventory for SKU ${item.sku}:`, error);
          inventoryCheckFailed = true;
          failedSkus.push({
            sku: item.sku,
            reason: `Error checking inventory: ${error.message}`
          });
        }
      }

      // Step 3: Generate picklist and assign picker even if inventory check failed
      // But mark order as failed-ordered so they can't start picking
      console.log(`🔄 Proceeding with picklist generation regardless of inventory check result`);
      
      // Step 4: Generate picklist and assign picker (proceed with normal flow)
      const result = await Helpers.Ecommorder(order);
      
      // Step 5: If inventory check failed, update order status and emit websocket
      if (inventoryCheckFailed) {
        console.error(`❌ Inventory check failed for order ${order.id}. Failed SKUs:`, failedSkus);
        
        // Update order status to failed-ordered
        try {
          const orderRecord = await Order.findByPk(order.id);
          if (orderRecord) {
            await orderRecord.update({ order_status: 'failed-ordered' });
          }
        } catch (updateError: any) {
          console.error(`❌ Failed to update order status:`, updateError);
        }

        // Get wave ID from result or find it
        let waveId: number | null = null;
        if (result && result.waveId) {
          waveId = result.waveId;
        } else {
          try {
            const wave = await PickingWave.findOne({
              where: { orderId: order.id },
              order: [['createdAt', 'DESC']]
            });
            if (wave) {
              waveId = wave.id;
            }
          } catch (waveError: any) {
            console.error(`❌ Failed to find wave:`, waveError);
          }
        }

        // Get assigned picker ID if wave exists
        let pickerId: number | null = null;
        if (waveId) {
          try {
            const wave = await PickingWave.findByPk(waveId);
            if (wave && wave.pickerId) {
              pickerId = wave.pickerId;
            }
          } catch (pickerError: any) {
            console.error(`❌ Failed to get picker ID:`, pickerError);
          }
        }

        // Emit websocket event with failed-ordered status globally and to specific picker
        socketManager.emit('orderStatusUpdate', {
          orderId: order.id,
          status: 'failed-ordered',
          waveId: waveId,
          reason: 'Inventory check failed',
          failedSkus: failedSkus
        });

        // Also emit to specific picker if assigned
        if (pickerId) {
          socketManager.emitToPicker(pickerId, 'orderStatusUpdate', {
            orderId: order.id,
            status: 'failed-ordered',
            waveId: waveId,
            reason: 'Inventory check failed',
            failedSkus: failedSkus
          });
          console.log(`📨 Emitted failed-ordered status to picker_${pickerId}`);
        }

        // Return response indicating inventory check failed but picklist generated
        ResponseHandler.success(res, {
          message: 'Order processed but inventory check failed. Picklist generated but picking is blocked.',
          order_id: order.id,
          status: 'failed-ordered',
          wave_id: waveId,
          picker_id: pickerId,
          reason: 'Inventory check failed',
          failed_skus: failedSkus,
          inventory_check_passed: false,
          picklist_generated: true
        });
        return;
      }

      console.log(`✅ Inventory check passed for all SKUs in order ${order.id}`);
      
      // Step 4 already executed above, just return success response
      ResponseHandler.success(res, {
        message: 'Order processed successfully via PHP integration',
        order_id: order.id,
        result: result,
        inventory_check_passed: true
      });
      
    } catch (error: any) {
      console.error('❌ PHP Integration error:', error);
      ResponseHandler.error(res, `PHP Integration failed: ${error.message}`, 500);
    }
  }

  /**
   * Direct logging endpoint for PHP - creates EcomLog entry immediately
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async logOrderDirectly(req: Request, res: Response): Promise<void> {
    try {
      const { order } = req.body;
      
      if (!order) {
        ResponseHandler.error(res, 'Order data is required', 400);
        return;
      }

      
      // Create EcomLog entry immediately
      const ecomLog = await EcomLog.create({
        order_id: order.id,
        action: 'order_received_from_php',
        payload: JSON.stringify({
          order_id: order.id,
          user_id: order.user_id,
          order_amount: order.order_amount,
          payment_method: order.payment_method,
          delivery_address: order.delivery_address,
          timestamp: new Date().toISOString()
        }),
        response: JSON.stringify({
          status: 'logged_successfully',
          node_service: 'ozi-backend',
          timestamp: new Date().toISOString()
        }),
        status: 'success'
      });
      
      const logData = ecomLog.get({ plain: true }) as any;
      
      ResponseHandler.success(res, {
        message: 'Order logged successfully in Node.js database',
        order_id: order.id,
        log_id: logData.id,
        log_entry: {
          id: logData.id,
          order_id: logData.order_id,
          action: logData.action,
          status: logData.status,
          created_at: logData.created_at
        }
      });
      
    } catch (error: any) {
      console.error('❌ Direct logging error:', error);
      ResponseHandler.error(res, `Direct logging failed: ${error.message}`, 500);
    }
  }

  /**
   * Test endpoint for EcomLog functionality
   * @param req - Request object
   * @param res - Response object
   */
  public static async testEcomLog(req: Request, res: Response): Promise<void> {
    try {
      
      // Test creating a log entry
      const testLog = await EcomLog.create({
        order_id: 999999, // Test order ID
        action: 'test',
        payload: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
        response: JSON.stringify({ status: 'test_success' }),
        status: 'success'
      });
      
      const logData = testLog.get({ plain: true }) as any;
      
      // Get all logs to verify
      const allLogs = await EcomLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 10
      });
      
      ResponseHandler.success(res, {
        message: 'EcomLog test successful',
        test_log: logData,
        total_logs: allLogs.length,
        recent_logs: allLogs.map(log => {
          const logData = log.get({ plain: true }) as any;
          return {
            id: logData.id,
            order_id: logData.order_id,
            action: logData.action,
            status: logData.status,
            created_at: logData.created_at
          };
        })
      });
      
    } catch (error: any) {
      console.error('❌ EcomLog test failed:', error);
      ResponseHandler.error(res, `EcomLog test failed: ${error.message}`, 500);
    }
  }

  /**
   * Test timestamp parsing functionality
   * @param req - Request object
   * @param res - Response object
   */
  public static async testTimestampParsing(req: Request, res: Response): Promise<void> {
    try {
      
      const testTimestamps = [
        '2025-08-30 16:24:03',
        '2025-08-30T16:24:03.000000Z',
        '1732986243',
        '1732986243000',
        new Date().toISOString(),
        Date.now().toString(),
        (Date.now() / 1000).toString()
      ];
      
      const results = testTimestamps.map(timestamp => {
        try {
          let parsedDate: Date;
          
          if (typeof timestamp === 'string') {
            if (timestamp.includes('T') || timestamp.includes(' ')) {
              parsedDate = new Date(timestamp);
            } else {
              const numTimestamp = parseInt(timestamp);
              if (!isNaN(numTimestamp)) {
                parsedDate = new Date(numTimestamp * 1000);
              } else {
                throw new Error('Invalid timestamp format');
              }
            }
          } else {
            parsedDate = new Date(timestamp);
          }
          
          const isValid = !isNaN(parsedDate.getTime());
          
          return {
            input: timestamp,
            parsed: parsedDate.toISOString(),
            valid: isValid,
            error: null
          };
        } catch (error: any) {
          return {
            input: timestamp,
            parsed: null,
            valid: false,
            error: error.message
          };
        }
      });
      
      ResponseHandler.success(res, {
        message: 'Timestamp parsing test completed',
        results
      });
      
    } catch (error: any) {
      console.error('❌ Timestamp parsing test failed:', error);
      ResponseHandler.error(res, `Timestamp parsing test failed: ${error.message}`, 500);
    }
  }

  /**
   * Health check endpoint for PHP to verify Node.js service is running
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async healthCheck(req: Request, res: Response): Promise<void> {
    ResponseHandler.success(res, {
      message: 'Node.js Ecommerce service is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy'
    });
  }

  /**
   * Refresh API - recheck inventory for orders with failed-ordered status
   * When inventory is updated, this will check again and update status to normal
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async refreshOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        ResponseHandler.error(res, 'Order ID is required', 400);
        return;
      }

      console.log(`🔄 Refreshing order status for order ${orderId}`);

      // Get order
      const order = await Order.findByPk(parseInt(orderId.toString()));
      if (!order) {
        ResponseHandler.error(res, 'Order not found', 404);
        return;
      }

      const originalStatus = order.order_status;

      // Extract SKUs with quantities and fc_id from order
      const orderData = order.get({ plain: true }) as any;
      const skuData: Array<{ sku: string; quantity: number; fc_id: number }> = [];
      
      // Get order details to extract SKUs
      const orderDetails = await OrderDetail.findAll({
        where: { order_id: parseInt(orderId.toString()) }
      });

      for (const orderDetail of orderDetails) {
        const detailData = orderDetail.get({ plain: true }) as any;
        let sku: string | null = null;
        let fc_id: number | null = null;
        
        // Try to get SKU from item_details
        if (detailData.item_details) {
          try {
            const itemDetails = typeof detailData.item_details === 'string' 
              ? JSON.parse(detailData.item_details) 
              : detailData.item_details;
            sku = itemDetails.sku || itemDetails.id || null;
          } catch (e) {
            console.warn(`Failed to parse item_details:`, e);
          }
        }
        
        // Get fc_id from order detail or order
        fc_id = detailData.fc_id || orderData.fc_id || null;
        
        if (sku && fc_id && detailData.quantity) {
          skuData.push({
            sku: sku.toString(),
            quantity: parseInt(detailData.quantity) || 1,
            fc_id: parseInt(fc_id.toString())
          });
        }
      }

      // If no SKUs found in order details, try cart
      if (skuData.length === 0 && orderData.cart && Array.isArray(orderData.cart)) {
        for (const item of orderData.cart) {
          let sku: string | null = null;
          let fc_id: number | null = null;
          
          if (item.item_details) {
            try {
              const itemDetails = typeof item.item_details === 'string' 
                ? JSON.parse(item.item_details) 
                : item.item_details;
              sku = itemDetails.sku || itemDetails.id || null;
            } catch (e) {
              console.warn(`Failed to parse item_details:`, e);
            }
          }
          
          fc_id = item.fc_id || orderData.fc_id || null;
          
          if (sku && fc_id && item.quantity) {
            skuData.push({
              sku: sku.toString(),
              quantity: parseInt(item.quantity) || 1,
              fc_id: parseInt(fc_id.toString())
            });
          }
        }
      }

      console.log(`📦 Found ${skuData.length} SKUs to check`);

      // Check inventory availability again
      let inventoryCheckPassed = true;
      const failedSkus: Array<{ sku: string; reason: string }> = [];
      
      for (const item of skuData) {
        try {
          const inventory = await sequelize.query(
            'SELECT * FROM inventory WHERE sku = ? AND fc_id = ?',
            {
              replacements: [item.sku, item.fc_id],
              type: QueryTypes.SELECT
            }
          );

          if (inventory.length === 0) {
            inventoryCheckPassed = false;
            failedSkus.push({
              sku: item.sku,
              reason: `SKU not found in inventory for fc_id ${item.fc_id}`
            });
            continue;
          }

          const inv = inventory[0] as any;
          const saleAvailableQty = inv.sale_available_quantity || 0;
          const orderedQty = item.quantity;
          
          // Check if sale_available_quantity >= ordered quantity
          if (saleAvailableQty < orderedQty) {
            inventoryCheckPassed = false;
            failedSkus.push({
              sku: item.sku,
              reason: `Insufficient quantity. Available: ${saleAvailableQty}, Required: ${orderedQty}`
            });
          }
        } catch (error: any) {
          console.error(`❌ Error checking inventory for SKU ${item.sku}:`, error);
          inventoryCheckPassed = false;
          failedSkus.push({
            sku: item.sku,
            reason: `Error checking inventory: ${error.message}`
          });
        }
      }

      // Update order status based on inventory check
      if (inventoryCheckPassed) {
        // Inventory is sufficient - update to pending if it was failed-ordered
        if (originalStatus === 'failed-ordered') {
          await order.update({ order_status: 'pending' });
          
          // Get wave ID if exists
          let waveId: number | null = null;
          const wave = await PickingWave.findOne({
            where: { orderId: parseInt(orderId.toString()) }
          });
          if (wave) {
            waveId = wave.id;
          }

          // Emit websocket event
          socketManager.emit('orderStatusUpdate', {
            orderId: parseInt(orderId.toString()),
            status: 'pending',
            waveId: waveId,
            reason: 'Inventory check passed after refresh'
          });

          console.log(`✅ Order ${orderId} status updated to pending after inventory refresh`);

          ResponseHandler.success(res, {
            message: 'Order status refreshed successfully',
            order_id: orderId,
            previous_status: 'failed-ordered',
            new_status: 'pending',
            inventory_check_passed: true
          });
        } else {
          // Already pending and inventory is sufficient
          ResponseHandler.success(res, {
            message: 'Order inventory check passed',
            order_id: orderId,
            current_status: 'pending',
            inventory_check_passed: true
          });
        }
      } else {
        // Inventory check failed - mark as failed-ordered if not already
        if (originalStatus !== 'failed-ordered') {
          await order.update({ order_status: 'failed-ordered' });
          
          // Get wave ID if exists
          let waveId: number | null = null;
          const wave = await PickingWave.findOne({
            where: { orderId: parseInt(orderId.toString()) }
          });
          if (wave) {
            waveId = wave.id;
          }

          // Emit websocket event
          socketManager.emit('orderStatusUpdate', {
            orderId: parseInt(orderId.toString()),
            status: 'failed-ordered',
            waveId: waveId,
            reason: 'Inventory check failed after refresh',
            failedSkus: failedSkus
          });

          console.log(`❌ Order ${orderId} status updated to failed-ordered due to insufficient inventory`);
        } else {
          console.log(`❌ Order ${orderId} still has inventory issues:`, failedSkus);
        }

        ResponseHandler.success(res, {
          message: 'Order status refresh completed but inventory check failed',
          order_id: orderId,
          previous_status: originalStatus,
          current_status: 'failed-ordered',
          failed_skus: failedSkus,
          inventory_check_passed: false
        });
      }

    } catch (error: any) {
      console.error('❌ Refresh order status error:', error);
      ResponseHandler.error(res, `Refresh failed: ${error.message}`, 500);
    }
  }
}

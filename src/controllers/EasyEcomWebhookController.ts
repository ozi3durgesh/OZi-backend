import { Request, Response } from 'express';
import { ResponseHandler } from '../middleware/responseHandler';
import { Helpers } from '../utils/Helpers';
import Order from '../models/Order';
import EcomLog from '../models/EcomLog';
import OrderDetails from '../models/OrderDetails';
import { OrderAttributes } from '../types';

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
        include: [
          {
            model: OrderDetails,
            as: 'orderDetails',
            required: false,
          }
        ],
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
          console.log(`Processing order ${orderData.id} through Ecommorder...`);
          
          const result = await Helpers.Ecommorder(orderData);
          results.push({
            order_id: orderData.id,
            status: 'success',
            result
          });
          
          console.log(`Order ${orderData.id} processed successfully`);
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
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { count, rows: logs } = await EcomLog.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      ResponseHandler.success(res, {
        logs,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_records: count,
          per_page: limit
        }
      });

    } catch (error: any) {
      console.error('Error getting ecommerce logs:', error);
      ResponseHandler.error(res, `Failed to get logs: ${error.message}`, 500);
    }
  }

  /**
   * Get ecommerce log by ID
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async getEcomLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const log = await EcomLog.findByPk(id);
      
      if (!log) {
        ResponseHandler.error(res, 'Ecommerce log not found', 404);
        return;
      }

      ResponseHandler.success(res, { log });

    } catch (error: any) {
      console.error('Error getting ecommerce log:', error);
      ResponseHandler.error(res, `Failed to get log: ${error.message}`, 500);
    }
  }

  /**
   * Get ecommerce logs by order ID
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
      
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderDetails,
            as: 'orderDetails',
            required: false,
          }
        ]
      });
      
      if (!order) {
        ResponseHandler.error(res, 'Order not found', 404);
        return;
      }

      console.log(`Retrying failed order ${orderId} through Ecommorder...`);
      
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

      console.log('🔄 PHP Integration called with order:', order.id);
      
      // Call the same Ecommorder function that matches PHP 100%
      const result = await Helpers.Ecommorder(order);
      
      ResponseHandler.success(res, {
        message: 'Order processed successfully via PHP integration',
        order_id: order.id,
        result
      });
      
    } catch (error: any) {
      console.error('❌ PHP Integration error:', error);
      ResponseHandler.error(res, `PHP Integration failed: ${error.message}`, 500);
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
}

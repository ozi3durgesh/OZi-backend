import { Request, Response } from 'express';
import Order from '../models/Order'; // Change this line
import { ResponseHandler } from '../middleware/responseHandler';
import { CartItem } from '../types';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export class OrderController {
  static async placeOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const {
        cart,
        coupon_discount_amount = 0.0,
        order_amount,
        order_type,
        payment_method,
        store_id,
        distance = 0.0,
        discount_amount = 0.0,
        tax_amount = 0.0,
        address,
        latitude = 0.0,
        longitude = 0.0,
        contact_person_name = '',
        contact_person_number,
        address_type = 'others',
        is_scheduled = 0,
        scheduled_timestamp,
        promised_delv_tat = '24'
      } = req.body;

      // Validation
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return ResponseHandler.error(res, 'Cart is required and must contain at least one item', 400);
      }

      if (!order_amount || order_amount <= 0) {
        return ResponseHandler.error(res, 'Order amount must be greater than 0', 400);
      }

      if (!order_type) {
        return ResponseHandler.error(res, 'Order type is required', 400);
      }

      if (!payment_method) {
        return ResponseHandler.error(res, 'Payment method is required', 400);
      }

      if (!store_id) {
        return ResponseHandler.error(res, 'Store ID is required', 400);
      }

      if (!address) {
        return ResponseHandler.error(res, 'Address is required', 400);
      }

      if (!contact_person_number) {
        return ResponseHandler.error(res, 'Contact person number is required', 400);
      }

      // Validate cart items
      for (const item of cart) {
        if (!item.sku || !item.amount || item.amount <= 0) {
          return ResponseHandler.error(res, 'Each cart item must have valid sku and amount', 400);
        }
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);

      const order = await Order.create({
        user_id: req.user!.id,
        cart,
        coupon_discount_amount: parseFloat(coupon_discount_amount.toString()),
        order_amount: parseFloat(order_amount.toString()),
        order_type,
        payment_method,
        store_id: parseInt(store_id.toString()),
        distance: parseFloat(distance.toString()),
        discount_amount: parseFloat(discount_amount.toString()),
        tax_amount: parseFloat(tax_amount.toString()),
        address,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        contact_person_name,
        contact_person_number,
        address_type,
        is_scheduled: parseInt(is_scheduled.toString()),
        scheduled_timestamp: scheduled_timestamp || currentTimestamp,
        promised_delv_tat,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      });

      return ResponseHandler.success(res, {
        order: {
          id: order.id,
          user_id: order.user_id,
          cart: order.cart,
          coupon_discount_amount: order.coupon_discount_amount,
          order_amount: order.order_amount,
          order_type: order.order_type,
          payment_method: order.payment_method,
          store_id: order.store_id,
          distance: order.distance,
          discount_amount: order.discount_amount,
          tax_amount: order.tax_amount,
          address: order.address,
          latitude: order.latitude,
          longitude: order.longitude,
          contact_person_name: order.contact_person_name,
          contact_person_number: order.contact_person_number,
          address_type: order.address_type,
          is_scheduled: order.is_scheduled,
          scheduled_timestamp: order.scheduled_timestamp,
          promised_delv_tat: order.promised_delv_tat,
          created_at: order.created_at,
        }
      }, 201);
    } catch (error) {
      console.error('Place order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async getOrderById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return ResponseHandler.error(res, 'Valid order ID is required', 400);
      }

      const order = await Order.findOne({
        where: {
          id: parseInt(id),
          user_id: req.user!.id,
        },
        raw: true
      });

      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      return ResponseHandler.success(res, {
        order
      });
    } catch (error) {
      console.error('Get order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async getUserOrders(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      const orders = await Order.findAll({
        where: {
          user_id: req.user!.id,
        },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit.toString()),
        offset,
        raw: true
      });

      return ResponseHandler.success(res, {
        orders,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total_orders: orders.length
        }
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}
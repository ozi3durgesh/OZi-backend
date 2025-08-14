import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Coupon from '../models/Coupon';
import CouponTranslation from '../models/CouponTranslation';
import { ResponseHandler } from '../middleware/responseHandler';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export class CouponController {
  static async applyCoupon(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { code, store_id } = req.body;

      // Validation
      if (!code) {
        return ResponseHandler.error(res, 'Coupon code is required', 400);
      }

      if (!store_id) {
        return ResponseHandler.error(res, 'Store ID is required', 400);
      }

      const storeIdInt = parseInt(store_id.toString());
      if (isNaN(storeIdInt)) {
        return ResponseHandler.error(res, 'Invalid store ID', 400);
      }

      // Find coupon with translations
      const coupon = await Coupon.findOne({
        where: {
          code: code.toString().trim(),
          status: 1, // Active coupons only
        },
        include: [{
          model: CouponTranslation,
          as: 'translations',
          required: false,
        }],
      });

      if (!coupon) {
        return ResponseHandler.error(res, 'Invalid coupon code', 404);
      }

      // Check if coupon is expired
      const currentDate = new Date().toISOString().split('T')[0];
      if (coupon.expire_date < currentDate) {
        return ResponseHandler.error(res, 'Coupon has expired', 400);
      }

      // Check if coupon is not yet active
      if (coupon.start_date > currentDate) {
        return ResponseHandler.error(res, 'Coupon is not yet active', 400);
      }

      // Check store eligibility
      if (coupon.coupon_type === 'store_wise') {
        let eligibleStores: number[] = [];
        try {
          eligibleStores = JSON.parse(coupon.data || '[]');
        } catch (e) {
          eligibleStores = [];
        }

        if (!eligibleStores.includes(storeIdInt)) {
          return ResponseHandler.error(res, 'Coupon not applicable for this store', 400);
        }
      }

      // Check usage limit
      if (coupon.limit > 0 && coupon.total_uses >= coupon.limit) {
        return ResponseHandler.error(res, 'Coupon usage limit exceeded', 400);
      }

      // Check customer eligibility
      if (coupon.customer_id !== '["all"]') {
        let eligibleCustomers: number[] = [];
        try {
          eligibleCustomers = JSON.parse(coupon.customer_id || '[]');
        } catch (e) {
          eligibleCustomers = [];
        }

        if (eligibleCustomers.length > 0 && !eligibleCustomers.includes(req.user!.id)) {
          return ResponseHandler.error(res, 'Coupon not applicable for this customer', 400);
        }
      }

      return ResponseHandler.success(res, coupon.toJSON());
    } catch (error) {
      console.error('Apply coupon error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async validateCoupon(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { code, store_id, order_amount } = req.body;

      if (!code || !store_id || !order_amount) {
        return ResponseHandler.error(res, 'Code, store_id, and order_amount are required', 400);
      }

      const storeIdInt = parseInt(store_id.toString());
      const orderAmountFloat = parseFloat(order_amount.toString());

      if (isNaN(storeIdInt) || isNaN(orderAmountFloat)) {
        return ResponseHandler.error(res, 'Invalid store_id or order_amount', 400);
      }

      // Find and validate coupon (reuse logic from applyCoupon)
      const coupon = await Coupon.findOne({
        where: {
          code: code.toString().trim(),
          status: 1,
        },
        include: [{
          model: CouponTranslation,
          as: 'translations',
          required: false,
        }],
      });

      if (!coupon) {
        return ResponseHandler.error(res, 'Invalid coupon code', 404);
      }

      const currentDate = new Date().toISOString().split('T')[0];
      if (coupon.expire_date < currentDate) {
        return ResponseHandler.error(res, 'Coupon has expired', 400);
      }

      if (coupon.start_date > currentDate) {
        return ResponseHandler.error(res, 'Coupon is not yet active', 400);
      }

      // Check minimum purchase requirement
      if (orderAmountFloat < coupon.min_purchase) {
        return ResponseHandler.error(res, `Minimum purchase amount of ${coupon.min_purchase} required`, 400);
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderAmountFloat * coupon.discount) / 100;
      } else {
        discountAmount = coupon.discount;
      }

      // Apply max discount limit
      if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }

      return ResponseHandler.success(res, {
        ...coupon.toJSON(),
        calculated_discount: discountAmount,
        applicable_amount: orderAmountFloat - discountAmount,
      });
    } catch (error) {
      console.error('Validate coupon error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async incrementCouponUsage(couponId: number): Promise<void> {
    try {
      await Coupon.increment('total_uses', {
        where: { id: couponId }
      });
    } catch (error) {
      console.error('Increment coupon usage error:', error);
    }
  }
}
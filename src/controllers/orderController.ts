import { Request, Response } from 'express';
import Order from '../models/Order';
import Coupon from '../models/Coupon';
import CouponTranslation from '../models/CouponTranslation';
import { ResponseHandler } from '../middleware/responseHandler';
import { CartItem } from '../types';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export class OrderController {
  // Helper method for cart operations
  private static validateCartItems(cart: any[]): { isValid: boolean; message?: string } {
    if (!Array.isArray(cart)) {
      return { isValid: false, message: 'Cart must be an array' };
    }

    if (cart.length === 0) {
      return { isValid: false, message: 'Cart cannot be empty. At least one item is required' };
    }

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      
      if (!item.sku || typeof item.sku !== 'number') {
        return { isValid: false, message: `Cart item ${i + 1}: SKU is required and must be a number` };
      }
      
      if (!item.amount || typeof item.amount !== 'number' || item.amount <= 0) {
        return { isValid: false, message: `Cart item ${i + 1}: Amount is required and must be a positive number` };
      }

      if (!Number.isInteger(item.sku)) {
        return { isValid: false, message: `Cart item ${i + 1}: SKU must be an integer` };
      }
    }

    return { isValid: true };
  }

  // Helper method to validate and apply coupon
  private static async validateAndApplyCoupon(
    couponCode: string,
    storeId: number,
    orderAmount: number,
    userId: number
  ): Promise<{ 
    isValid: boolean; 
    discount: number; 
    coupon?: any; 
    message?: string;
    couponData?: any;
  }> {
    try {
      if (!couponCode || !couponCode.trim()) {
        return { isValid: false, discount: 0, message: 'Coupon code is required' };
      }

      // Find coupon with translations using Sequelize
      const coupon = await Coupon.findOne({
        where: {
          code: couponCode.trim(),
          status: 1, // Active coupons only
        },
        include: [{
          model: CouponTranslation,
          as: 'translations',
          required: false,
        }],
      });

      if (!coupon) {
        return { isValid: false, discount: 0, message: 'Invalid coupon code' };
      }

      // Check if coupon is expired
      const currentDate = new Date().toISOString().split('T')[0];
      if (coupon.expire_date < currentDate) {
        return { isValid: false, discount: 0, message: 'Coupon has expired' };
      }

      // Check if coupon is not yet active
      if (coupon.start_date > currentDate) {
        return { isValid: false, discount: 0, message: 'Coupon is not yet active' };
      }

      // Check minimum purchase requirement
      if (orderAmount < coupon.min_purchase) {
        return { 
          isValid: false, 
          discount: 0, 
          message: `Minimum purchase amount of ${coupon.min_purchase} required` 
        };
      }

      // Check store eligibility
      if (coupon.coupon_type === 'store_wise') {
        let eligibleStores: number[] = [];
        try {
          eligibleStores = JSON.parse(coupon.data || '[]');
        } catch (e) {
          eligibleStores = [];
        }

        if (!eligibleStores.includes(storeId)) {
          return { isValid: false, discount: 0, message: 'Coupon not applicable for this store' };
        }
      }

      // Check usage limit
      if (coupon.limit > 0 && coupon.total_uses >= coupon.limit) {
        return { isValid: false, discount: 0, message: 'Coupon usage limit exceeded' };
      }

      // Check customer eligibility
      if (coupon.customer_id !== '["all"]') {
        let eligibleCustomers: number[] = [];
        try {
          eligibleCustomers = JSON.parse(coupon.customer_id || '[]');
        } catch (e) {
          eligibleCustomers = [];
        }

        if (eligibleCustomers.length > 0 && !eligibleCustomers.includes(userId)) {
          return { isValid: false, discount: 0, message: 'Coupon not applicable for this customer' };
        }
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderAmount * coupon.discount) / 100;
      } else {
        discountAmount = coupon.discount;
      }

      // Apply max discount limit
      if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }

      return { 
        isValid: true, 
        discount: discountAmount, 
        coupon, 
        couponData: coupon.toJSON() 
      };
    } catch (error) {
      console.error('Validate coupon error:', error);
      return { isValid: false, discount: 0, message: 'Error validating coupon' };
    }
  }

  // Helper method to increment coupon usage
  private static async incrementCouponUsage(couponId: number): Promise<void> {
    try {
      await Coupon.increment('total_uses', {
        where: { id: couponId }
      });
    } catch (error) {
      console.error('Increment coupon usage error:', error);
    }
  }

  // Helper method to calculate order amounts based on cart changes and coupon
  private static async calculateOrderAmounts(
    existingOrder: any,
    cart: CartItem[] | undefined,
    updateData: any,
    userId: number
  ): Promise<{
    order_amount: number;
    discount_amount: number;
    tax_amount: number;
    coupon_discount_amount: number;
    coupon_data?: any;
    coupon_message?: string;
  }> {
    // Use existing values as defaults
    const amounts = {
      order_amount: existingOrder.order_amount,
      discount_amount: existingOrder.discount_amount,
      tax_amount: existingOrder.tax_amount,
      coupon_discount_amount: existingOrder.coupon_discount_amount
    };

    let baseAmount = existingOrder.order_amount;

    // If cart is being updated, recalculate the base order amount
    if (cart) {
      baseAmount = cart.reduce((sum, item) => sum + item.amount, 0);
      amounts.order_amount = baseAmount;
      
      // Reset all calculations when cart changes
      amounts.discount_amount = 0;
      amounts.tax_amount = 0;
      amounts.coupon_discount_amount = 0;
    }

    // Apply manual overrides
    if (updateData.discount_amount !== undefined) {
      amounts.discount_amount = parseFloat(updateData.discount_amount.toString());
    }
    if (updateData.tax_amount !== undefined) {
      amounts.tax_amount = parseFloat(updateData.tax_amount.toString());
    }

    // Handle coupon revalidation if coupon code is provided
    if (updateData.coupon_code) {
      const couponResult = await OrderController.validateAndApplyCoupon(
        updateData.coupon_code,
        updateData.store_id || existingOrder.store_id,
        baseAmount,
        userId
      );

      if (couponResult.isValid) {
        amounts.coupon_discount_amount = couponResult.discount;
        return {
          ...amounts,
          order_amount: baseAmount - amounts.discount_amount + amounts.tax_amount - amounts.coupon_discount_amount,
          coupon_data: couponResult.couponData
        };
      } else {
        return {
          ...amounts,
          coupon_message: couponResult.message
        };
      }
    } else if (updateData.coupon_discount_amount !== undefined) {
      amounts.coupon_discount_amount = parseFloat(updateData.coupon_discount_amount.toString());
    }

    // Calculate final order amount
    amounts.order_amount = baseAmount - amounts.discount_amount + amounts.tax_amount - amounts.coupon_discount_amount;

    // Allow manual override of final order amount
    if (updateData.order_amount !== undefined) {
      amounts.order_amount = parseFloat(updateData.order_amount.toString());
    }

    return amounts;
  }

  // Enhanced data validation
  private static validateUpdateData(updateData: any): { isValid: boolean; message?: string; cleanData?: any } {
    const cleanData: any = {};
    const errors: string[] = [];

    // Validate order_amount
    if (updateData.order_amount !== undefined) {
      const amount = parseFloat(updateData.order_amount.toString());
      if (isNaN(amount) || amount <= 0) {
        errors.push('Order amount must be a positive number');
      } else {
        cleanData.order_amount = amount;
      }
    }

    // Validate store_id
    if (updateData.store_id !== undefined) {
      const storeId = parseInt(updateData.store_id.toString());
      if (isNaN(storeId) || storeId <= 0) {
        errors.push('Store ID must be a positive integer');
      } else {
        cleanData.store_id = storeId;
      }
    }

    // Validate coupon_code
    if (updateData.coupon_code !== undefined) {
      if (typeof updateData.coupon_code === 'string') {
        cleanData.coupon_code = updateData.coupon_code.trim();
      } else {
        errors.push('Coupon code must be a string');
      }
    }

    // Validate numeric fields
    const numericFields = [
      'coupon_discount_amount',
      'distance',
      'discount_amount',
      'tax_amount',
      'latitude',
      'longitude'
    ];

    for (const field of numericFields) {
      if (updateData[field] !== undefined) {
        const value = parseFloat(updateData[field].toString());
        if (isNaN(value) || value < 0) {
          errors.push(`${field} must be a non-negative number`);
        } else {
          cleanData[field] = value;
        }
      }
    }

    // Validate latitude and longitude ranges
    if (updateData.latitude !== undefined) {
      const lat = parseFloat(updateData.latitude.toString());
      if (lat < -90 || lat > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
    }

    if (updateData.longitude !== undefined) {
      const lng = parseFloat(updateData.longitude.toString());
      if (lng < -180 || lng > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    // Validate integer fields
    const integerFields = ['is_scheduled', 'scheduled_timestamp'];
    for (const field of integerFields) {
      if (updateData[field] !== undefined) {
        const value = parseInt(updateData[field].toString());
        if (isNaN(value)) {
          errors.push(`${field} must be a valid integer`);
        } else {
          cleanData[field] = value;
        }
      }
    }

    // Validate string fields
    const stringFields = [
      'order_type',
      'payment_method',
      'address',
      'contact_person_name',
      'contact_person_number',
      'address_type',
      'promised_delv_tat'
    ];

    for (const field of stringFields) {
      if (updateData[field] !== undefined) {
        if (typeof updateData[field] !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (updateData[field].trim() === '' && field !== 'contact_person_name') {
          errors.push(`${field} cannot be empty`);
        } else {
          cleanData[field] = updateData[field].trim();
        }
      }
    }

    // Validate contact person number format (basic validation)
    if (updateData.contact_person_number !== undefined) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(updateData.contact_person_number.replace(/\s+/g, ''))) {
        errors.push('Contact person number format is invalid');
      }
    }

    // Validate order_type enum
    if (updateData.order_type !== undefined) {
      const validOrderTypes = ['delivery', 'pickup', 'dine_in'];
      if (!validOrderTypes.includes(updateData.order_type)) {
        errors.push('Order type must be one of: delivery, pickup, dine_in');
      }
    }

    // Validate payment_method enum
    if (updateData.payment_method !== undefined) {
      const validPaymentMethods = ['cash_on_delivery', 'card', 'upi', 'wallet'];
      if (!validPaymentMethods.includes(updateData.payment_method)) {
        errors.push('Payment method must be one of: cash_on_delivery, card, upi, wallet');
      }
    }

    if (errors.length > 0) {
      return { isValid: false, message: errors.join('. ') };
    }

    return { isValid: true, cleanData };
  }

  static async updateOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(parseInt(id))) {
        return ResponseHandler.error(res, 'Valid order ID is required', 400);
      }

      // Find the existing order using Sequelize
      const existingOrder = await Order.findOne({
        where: {
          id: parseInt(id),
          user_id: req.user!.id,
        },
        raw: true
      });

      if (!existingOrder) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      // Validate and clean update data
      const validation = OrderController.validateUpdateData(updateData);
      if (!validation.isValid) {
        return ResponseHandler.error(res, validation.message!, 400);
      }

      const updateFields = validation.cleanData!;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      // Handle cart updates if provided
      let cart: CartItem[] | undefined;
      if (updateData.cart !== undefined) {
        const cartValidation = OrderController.validateCartItems(updateData.cart);
        if (!cartValidation.isValid) {
          return ResponseHandler.error(res, cartValidation.message!, 400);
        }
        cart = updateData.cart;
        updateFields.cart = cart;
      }

      // Calculate and update order amounts based on cart changes, manual updates, and coupon revalidation
      const amounts = await OrderController.calculateOrderAmounts(
        existingOrder,
        cart,
        updateData,
        req.user!.id
      );

      // Handle coupon validation errors
      if (amounts.coupon_message) {
        return ResponseHandler.error(res, amounts.coupon_message, 400);
      }

      // Update the amount fields
      updateFields.order_amount = amounts.order_amount;
      updateFields.discount_amount = amounts.discount_amount;
      updateFields.tax_amount = amounts.tax_amount;
      updateFields.coupon_discount_amount = amounts.coupon_discount_amount;

      // Validate critical fields after all calculations
      if (updateFields.order_amount <= 0) {
        return ResponseHandler.error(res, 'Final order amount must be greater than 0', 400);
      }

      // Always update the updated_at timestamp
      updateFields.updated_at = currentTimestamp;

      // Check if there are fields to update
      if (Object.keys(updateFields).length <= 1) { // Only updated_at
        return ResponseHandler.error(res, 'No valid fields provided for update', 400);
      }

      // Perform the update using Sequelize's update method
      const [affectedRows] = await Order.update(updateFields, {
        where: {
          id: parseInt(id),
          user_id: req.user!.id,
        },
      });

      if (affectedRows === 0) {
        return ResponseHandler.error(res, 'Order not found or no changes made', 404);
      }

      // Fetch and return updated order
      const updatedOrder = await Order.findOne({
        where: {
          id: parseInt(id),
          user_id: req.user!.id,
        },
        raw: true
      });

      const response: any = {
        order: updatedOrder,
        updated_fields: Object.keys(updateFields).filter(field => field !== 'updated_at')
      };

      // Add coupon data if coupon was applied
      if (amounts.coupon_data) {
        response.applied_coupon = {
          ...amounts.coupon_data,
          calculated_discount: amounts.coupon_discount_amount
        };
      }

      return ResponseHandler.success(res, response);
    } catch (error) {
      console.error('Update order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async placeOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const {
        cart,
        coupon_code,
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

      // Validation using the new validation method
      const cartValidation = OrderController.validateCartItems(cart);
      if (!cartValidation.isValid) {
        return ResponseHandler.error(res, cartValidation.message!, 400);
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

      let couponDiscountAmount = 0;
      let appliedCouponData = null;

      // Apply coupon if provided
      if (coupon_code) {
        const couponResult = await OrderController.validateAndApplyCoupon(
          coupon_code,
          parseInt(store_id.toString()),
          parseFloat(order_amount.toString()),
          req.user!.id
        );

        if (!couponResult.isValid) {
          return ResponseHandler.error(res, couponResult.message!, 400);
        }

        couponDiscountAmount = couponResult.discount;
        appliedCouponData = couponResult.couponData;
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const baseAmount = parseFloat(order_amount.toString());
      const finalOrderAmount = baseAmount + parseFloat(tax_amount.toString()) 
                              - parseFloat(discount_amount.toString()) - couponDiscountAmount;

      if (finalOrderAmount <= 0) {
        return ResponseHandler.error(res, 'Final order amount must be greater than 0', 400);
      }

      // Create order using Sequelize
      const order = await Order.create({
        user_id: req.user!.id,
        cart,
        coupon_discount_amount: couponDiscountAmount,
        order_amount: finalOrderAmount,
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

      // Increment coupon usage if applied
      if (appliedCouponData) {
        await OrderController.incrementCouponUsage(appliedCouponData.id);
      }

      const response: any = {
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
      };

      if (appliedCouponData) {
        response.applied_coupon = {
          ...appliedCouponData,
          calculated_discount: couponDiscountAmount
        };
      }

      return ResponseHandler.success(res, response, 201);
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
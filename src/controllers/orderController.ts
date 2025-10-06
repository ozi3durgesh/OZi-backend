import { Request, Response } from 'express';
import Order from '../models/Order';
import Coupon from '../models/Coupon';
import CouponTranslation from '../models/CouponTranslation';

import { ResponseHandler } from '../middleware/responseHandler';
import { FCQueryBuilder, FCValidator, FCContextHelper } from '../middleware/fcFilter';
import { CartItem } from '../types';
import sequelize from '../config/database';
import { generateSimpleOrderId } from '../utils/orderIdGenerator';


interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    wallet_balance?: number;
  };
}

interface OrderRequest {
  cart: CartItem[];
  coupon_discount_amount?: number;
  coupon_discount_title?: string;
  order_amount: number;
  order_type: 'delivery' | 'take_away' | 'parcel';
  payment_method: 'cash_on_delivery' | 'digital_payment' | 'wallet' | 'offline_payment';
  store_id: number;
  distance: number;
  discount_amount?: number;
  tax_amount?: number;
  address: string;
  longitude: number;
  latitude: number;
  contact_person_name?: string;
  contact_person_number: string;
  address_type?: string;
  dm_tips?: number;
  cutlery?: number;
  partial_payment?: number;
  is_buy_now?: number;
  extra_packaging_amount?: number;
  create_new_user?: number;
  order_note?: string;
  delivery_instruction?: string;
  unavailable_item_note?: string;
  floor?: string;
  road?: string;
  house?: string;
  is_scheduled?: boolean;
  scheduled_timestamp?: number;
  guest_id?: string;
  password?: string;
  order_attachment?: any;
  parcel_category_id?: number;
  receiver_details?: any;
  charge_payer?: 'sender' | 'receiver';
  
  // New fields for enhanced order structure
  transaction_reference?: string;
  delivery_address_id?: number;
  delivery_man_id?: number;
  coupon_code?: string;
  delivery_charge?: number;
  callback?: string;
  store_discount_amount?: number;
  original_delivery_charge?: number;
  delivery_time?: string;
  zone_id?: number;
  module_id?: number;
  free_delivery_by?: string;
  prescription_order?: number;
  tax_status?: string;
  dm_vehicle_id?: number;
  cancellation_reason?: string;
  canceled_by?: string;
  coupon_created_by?: string;
  discount_on_product_by?: string;
  processing_time?: number;
  tax_percentage?: number;
  additional_charge?: number;
  order_proof?: string;
  partially_paid_amount?: number;
  is_guest?: number;
  flash_admin_discount_amount?: number;
  flash_store_discount_amount?: number;
  cash_back_id?: number;
  ref_bonus_amount?: number;
  EcommInvoiceID?: string;
  EcommOrderID?: string;
  awb_number?: string;
  promised_duration?: string;
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

  // FC-based filtering methods
  private static async getOrdersByFC(fcId: number, whereClause: any = {}): Promise<any[]> {
    const fcFilteredWhere = FCQueryBuilder.addOrderFCFilter(whereClause, fcId);
    return await Order.findAll({
      where: fcFilteredWhere,
      order: [['createdAt', 'DESC']]
    });
  }

  private static async getOrderByIdAndFC(orderId: number, fcId: number): Promise<any> {
    const fcFilteredWhere = FCQueryBuilder.addOrderFCFilter({ id: orderId }, fcId);
    return await Order.findOne({
      where: fcFilteredWhere
    });
  }

  private static async validateOrderFC(orderId: number, fcId: number): Promise<boolean> {
    return await FCValidator.validateOrderFC(orderId, fcId);
  }

  // Helper method to validate and apply coupon
  private static async validateAndApplyCoupon(
    couponCode: string,
    storeId: number,
    orderAmount: number,
    userId: number,
    contactPhoneNumber?: string
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

      // Check customer eligibility by phone number
      if (coupon.customer_id !== '["all"]') {
        let eligibleCustomers: string[] = [];
        try {
          eligibleCustomers = JSON.parse(coupon.customer_id || '[]');
        } catch (e) {
          eligibleCustomers = [];
        }

        // If contact phone number is provided, check if it's in the eligible customers list
        if (contactPhoneNumber && eligibleCustomers.length > 0) {
          // Clean the phone number for comparison (remove spaces, dashes, etc.)
          const cleanContactPhone = contactPhoneNumber.replace(/\s+/g, '').replace(/[-()]/g, '');
          
          // Check if the phone number is in the eligible customers list
          const isPhoneEligible = eligibleCustomers.some(phone => {
            const cleanEligiblePhone = phone.replace(/\s+/g, '').replace(/[-()]/g, '');
            return cleanEligiblePhone === cleanContactPhone;
          });

          if (!isPhoneEligible) {
            return { isValid: false, discount: 0, message: 'Coupon not applicable for this phone number' };
          }
        } else if (eligibleCustomers.length > 0) {
          // If no phone number provided but there are eligible customers, check by user ID
          if (!eligibleCustomers.includes(userId.toString())) {
            return { isValid: false, discount: 0, message: 'Coupon not applicable for this customer' };
          }
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

  // Public method to validate coupon code
  static async validateCoupon(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { coupon_code, store_id, order_amount, contact_phone_number } = req.body;
      const userId = req.user?.id || 0;

      if (!coupon_code) {
        return ResponseHandler.error(res, 'Coupon code is required', 400);
      }

      if (!store_id) {
        return ResponseHandler.error(res, 'Store ID is required', 400);
      }

      if (!order_amount || order_amount <= 0) {
        return ResponseHandler.error(res, 'Valid order amount is required', 400);
      }

      const couponValidation = await OrderController.validateAndApplyCoupon(
        coupon_code,
        store_id,
        order_amount,
        userId,
        contact_phone_number
      );

      if (!couponValidation.isValid) {
        return ResponseHandler.error(res, couponValidation.message!, 400);
      }

      return ResponseHandler.success(res, {
        message: 'Coupon code is valid',
        coupon: {
          code: coupon_code,
          title: couponValidation.coupon?.title,
          discount: couponValidation.discount,
          discount_type: couponValidation.coupon?.discount_type,
          min_purchase: couponValidation.coupon?.min_purchase,
          max_discount: couponValidation.coupon?.max_discount,
          limit: couponValidation.coupon?.limit,
          total_uses: couponValidation.coupon?.total_uses,
          remaining_uses: Math.max(0, (couponValidation.coupon?.limit || 0) - (couponValidation.coupon?.total_uses || 0))
        }
      });

    } catch (error) {
      console.error('Validate coupon error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Public method to get coupon details
  static async getCouponDetails(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { coupon_code } = req.params;

      if (!coupon_code) {
        return ResponseHandler.error(res, 'Coupon code is required', 400);
      }

      const coupon = await Coupon.findOne({
        where: {
          code: coupon_code.trim(),
          status: 1, // Active coupons only
        },
        include: [{
          model: CouponTranslation,
          as: 'translations',
          required: false,
        }],
      });

      if (!coupon) {
        return ResponseHandler.error(res, 'Coupon not found', 404);
      }

      // Check if coupon is expired
      const currentDate = new Date().toISOString().split('T')[0];
      if (coupon.expire_date < currentDate) {
        return ResponseHandler.error(res, 'Coupon has expired', 404);
      }

      // Check if coupon is not yet active
      if (coupon.start_date > currentDate) {
        return ResponseHandler.error(res, 'Coupon is not yet active', 404);
      }

      return ResponseHandler.success(res, {
        message: 'Coupon details retrieved successfully',
        coupon: {
          id: coupon.id,
          code: coupon.code,
          title: coupon.title,
          start_date: coupon.start_date,
          expire_date: coupon.expire_date,
          min_purchase: coupon.min_purchase,
          max_discount: coupon.max_discount,
          discount: coupon.discount,
          discount_type: coupon.discount_type,
          coupon_type: coupon.coupon_type,
          limit: coupon.limit,
          total_uses: coupon.total_uses,
          remaining_uses: Math.max(0, coupon.limit - coupon.total_uses),
          status: coupon.status,
          data: coupon.data,
          customer_id: coupon.customer_id,
          store_id: coupon.store_id,
          translations: (coupon as any).translations
        }
      });

    } catch (error) {
      console.error('Get coupon details error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Helper method to calculate delivery charge
  private static calculateDeliveryCharge(
    distance: number,
    orderType: string,
    perKmCharge: number = 1.0,
    minCharge: number = 5.0,
    maxCharge: number = 50.0
  ): number {
    if (orderType === 'take_away') {
      return 0;
    }

    let deliveryCharge = Math.max(distance * perKmCharge, minCharge);
    
    if (maxCharge > minCharge && deliveryCharge > maxCharge) {
      deliveryCharge = maxCharge;
    }

    return deliveryCharge;
  }

  // Helper method to calculate tax
  private static calculateTax(amount: number, taxRate: number, taxIncluded: boolean = false): number {
    if (taxIncluded) {
      return 0; // Tax is already included in the amount
    }
    return (amount * taxRate) / 100;
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

      if (!id) {
        return ResponseHandler.error(res, 'Valid order ID is required', 400);
      }

      // Check if it's a custom order ID (starts with 'ozi') or internal ID
      let whereClause: any = {};
      
      if (id.startsWith('ozi')) {
        // Custom order ID format
        whereClause.order_id = id;
      } else if (!isNaN(parseInt(id))) {
        // Internal ID format
        whereClause.id = parseInt(id);
      } else {
        return ResponseHandler.error(res, 'Invalid order ID format', 400);
      }
      
      whereClause.user_id = req.user!.id;

      // Find the existing order using Sequelize
      const existingOrder = await Order.findOne({
        where: whereClause,
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

      // For now, we'll use the existing order amounts
      // TODO: Implement proper amount calculation logic
      updateFields.order_amount = (existingOrder as any).order_amount;
      updateFields.discount_amount = (existingOrder as any).discount_amount;
      updateFields.tax_amount = (existingOrder as any).tax_amount;
      updateFields.coupon_discount_amount = (existingOrder as any).coupon_discount_amount;

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
        where: whereClause,
      });

      if (affectedRows === 0) {
        return ResponseHandler.error(res, 'Order not found or no changes made', 404);
      }

      // Fetch and return updated order
      const updatedOrder = await Order.findOne({
        where: whereClause,
        raw: true
      });

      const response: any = {
        order: updatedOrder,
        updated_fields: Object.keys(updateFields).filter(field => field !== 'updated_at')
      };

      // Add coupon data if coupon was applied
      if (updateFields.coupon_discount_amount && updateFields.coupon_discount_amount > 0) {
        response.applied_coupon = {
          calculated_discount: updateFields.coupon_discount_amount
        };
      }

      return ResponseHandler.success(res, response);
    } catch (error) {
      console.error('Update order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Main order placement method
  static async placeOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const orderData: OrderRequest = req.body;
      const userId = req.user?.id;
      const fcId = FCContextHelper.getCurrentFCId(req);

      // Basic validation - For testing purposes, use a default user ID if none provided
      if (!userId) {
        // For testing without authentication, use a default user ID
        // In production, this should be removed and proper authentication enforced
        // Using default user ID for testing
        // For now, let's use 1 as default (the admin user that exists)
        req.user = { id: 1, email: 'admin@company.com' };
      }
      
      // Ensure userId is defined after the above logic
      const finalUserId = req.user?.id || 1;

      // Validate required fields
      const requiredFields = [
        'cart', 
        'order_amount', 
        'payment_method', 
        'order_type', 
        'store_id',
        'distance',
        'address',
        'latitude',
        'longitude',
        'contact_person_name',
        'contact_person_number'
      ];
      
      for (const field of requiredFields) {
        if (orderData[field as keyof OrderRequest] === undefined || 
            orderData[field as keyof OrderRequest] === null || 
            orderData[field as keyof OrderRequest] === '') {
          return ResponseHandler.error(res, `${field} is required and cannot be empty`, 400);
        }
      }

      // Validate cart
      const cartValidation = OrderController.validateCartItems(orderData.cart);
      if (!cartValidation.isValid) {
        return ResponseHandler.error(res, cartValidation.message!, 400);
      }
      
      // Additional cart validation - ensure cart is not empty
      if (!Array.isArray(orderData.cart) || orderData.cart.length === 0) {
        return ResponseHandler.error(res, 'Cart must contain at least one item', 400);
      }

      // CART VALIDATION
      // Basic cart validation without product lookup
      if (!orderData.cart || orderData.cart.length === 0) {
        return ResponseHandler.error(res, 'Cart cannot be empty', 400);
      }

      // Validate order type specific requirements
      if (orderData.order_type === 'delivery' || orderData.order_type === 'parcel') {
        if (!orderData.address) {
          return ResponseHandler.error(res, 'Address is required for delivery/parcel orders', 400);
        }
        if (!orderData.longitude || !orderData.latitude) {
          return ResponseHandler.error(res, 'Longitude and latitude are required for delivery/parcel orders', 400);
        }
      }

      // Validate parcel specific requirements
      if (orderData.order_type === 'parcel') {
        if (!orderData.parcel_category_id) {
          return ResponseHandler.error(res, 'Parcel category ID is required for parcel orders', 400);
        }
        if (!orderData.receiver_details) {
          return ResponseHandler.error(res, 'Receiver details are required for parcel orders', 400);
        }
        if (!orderData.charge_payer) {
          return ResponseHandler.error(res, 'Charge payer is required for parcel orders', 400);
        }
      }

      // Validate payment method
      const validPaymentMethods = ['cash_on_delivery', 'digital_payment', 'wallet', 'offline_payment'];
      if (!validPaymentMethods.includes(orderData.payment_method)) {
        return ResponseHandler.error(res, 'Invalid payment method', 400);
      }

      // Validate wallet balance for wallet payments
      if (orderData.payment_method === 'wallet') {
        const userWalletBalance = req.user?.wallet_balance || 0;
        if (userWalletBalance < orderData.order_amount) {
          return ResponseHandler.error(res, 'Insufficient wallet balance', 400);
        }
      }

      // Use provided amounts from request (PHP style)
      let finalOrderAmount = orderData.order_amount;
      let couponDiscountAmount = orderData.coupon_discount_amount || 0;
      let discountAmount = orderData.discount_amount || 0;
      let taxAmount = orderData.tax_amount || 0;

      // Validate final amount
      if (finalOrderAmount <= 0) {
        return ResponseHandler.error(res, 'Final order amount must be greater than 0', 400);
      }

      // Process coupon if provided
      if (orderData.coupon_code) {
        // Process coupon validation
        const couponValidation = await OrderController.validateAndApplyCoupon(
          orderData.coupon_code,
          orderData.store_id,
          finalOrderAmount,
          finalUserId,
          orderData.contact_person_number
        );

        if (!couponValidation.isValid) {
          return ResponseHandler.error(res, couponValidation.message!, 400);
        }

        // Update coupon discount amount and title
        couponDiscountAmount = couponValidation.discount;
        if (couponValidation.coupon) {
          orderData.coupon_discount_title = couponValidation.coupon.title;
          
          // Increment coupon usage
          await OrderController.incrementCouponUsage(couponValidation.coupon.id);
        }
      }

      // Create order directly
      const orderId = await generateSimpleOrderId();
      const order = await Order.create({
        order_id: orderId,
        user_id: finalUserId,
        store_id: orderData.store_id,
        fc_id: fcId, // Add FC context to order
        order_amount: finalOrderAmount,
        tax_amount: taxAmount,
        payment_method: orderData.payment_method,
        delivery_address: orderData.address,
        cart: orderData.cart,
        coupon_code: orderData.coupon_code,
        partial_payment: orderData.partial_payment ? 1 : 0,
        is_buy_now: orderData.is_buy_now ? 1 : 0,
        create_new_user: orderData.create_new_user ? 1 : 0,
        password: orderData.password,
        order_type: orderData.order_type,
        latitude: orderData.latitude,
        longitude: orderData.longitude,
        contact_person_name: orderData.contact_person_name,
        contact_person_number: orderData.contact_person_number,
        coupon_discount_amount: couponDiscountAmount,
        coupon_discount_title: orderData.coupon_discount_title,
        discount_amount: discountAmount,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      });

      const transactionResult = {
        success: true,
        orderId: order.getDataValue('order_id'),
        internalId: order.getDataValue('id'),
        order: order
      };

      // Prepare response to match production format exactly
      const response = {
        message: 'Order placed successfully',
        order_id: transactionResult.orderId,
        internal_id: transactionResult.internalId,
        total_ammount: (transactionResult.order as any)?.order_amount,
        status: 'pending',
        created_at: (() => {
          try {
            // Validate timestamp and convert to proper format
            if ((transactionResult.order as any)?.created_at && typeof (transactionResult.order as any).created_at === 'number' && (transactionResult.order as any).created_at > 0) {
              const date = new Date((transactionResult.order as any).created_at * 1000);
              if (isNaN(date.getTime())) {
                throw new Error('Invalid timestamp');
              }
              return date.toISOString().replace('T', ' ').substring(0, 19);
            }
            // Fallback to current time if timestamp is invalid
            return new Date().toISOString().replace('T', ' ').substring(0, 19);
          } catch (error) {
            console.error('Date conversion error:', error);
            // Fallback to current time
            return new Date().toISOString().replace('T', ' ').substring(0, 19);
          }
        })(),
        user_id: (transactionResult.order as any)?.user_id
      };

      return ResponseHandler.success(res, response, 201);

    } catch (error) {
      console.error('Place order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async getOrderById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseHandler.error(res, 'Valid order ID is required', 400);
      }

      // Check if it's a custom order ID (starts with 'ozi') or internal ID
      let whereClause: any = {};
      
      if (id.startsWith('ozi')) {
        // Custom order ID format
        whereClause.order_id = id;
      } else if (!isNaN(parseInt(id))) {
        // Internal ID format
        whereClause.id = parseInt(id);
      } else {
        return ResponseHandler.error(res, 'Invalid order ID format', 400);
      }
      
      // For authenticated requests, filter by user_id
      if (req.user && req.user.id) {
        whereClause.user_id = req.user.id;
      }

      const order = await Order.findOne({
        where: whereClause,
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

      // For unauthenticated requests, get all orders
      // For authenticated requests, filter by user_id
      const whereClause: any = {};
      
      if (req.user && req.user.id) {
        whereClause.user_id = req.user.id;
      }

      const orders = await Order.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit.toString()),
        offset,
        raw: true
      });

      // Get total count for pagination
      const totalOrders = await Order.count({ where: whereClause });

      return ResponseHandler.success(res, {
        orders,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total_orders: totalOrders,
          total_pages: Math.ceil(totalOrders / parseInt(limit.toString())),
          has_next: offset + parseInt(limit.toString()) < totalOrders,
          has_prev: parseInt(page.toString()) > 1
        }
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async getOrderItems(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      if (!id) {
        return ResponseHandler.error(res, 'Valid order ID is required', 400);
      }

      // Check if it's a custom order ID (starts with 'ozi') or internal ID
      let whereClause: any = {};
      
      if (id.startsWith('ozi')) {
        // Custom order ID format
        whereClause.order_id = id;
      } else if (!isNaN(parseInt(id))) {
        // Internal ID format
        whereClause.id = parseInt(id);
      } else {
        return ResponseHandler.error(res, 'Invalid order ID format', 400);
      }
      
      // For authenticated requests, filter by user_id
      if (req.user && req.user.id) {
        whereClause.user_id = req.user.id;
      }

      const order = await Order.findOne({
        where: whereClause,
        raw: true
      });

      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      // Extract cart items from the order
      const cartItems = (order as any).cart || [];
      
      // Apply pagination to cart items
      const totalItems = cartItems.length;
      const paginatedItems = cartItems.slice(offset, offset + parseInt(limit.toString()));

      return ResponseHandler.success(res, {
        order_id: (order as any).order_id || (order as any).id,
        internal_id: (order as any).id,
        order_status: (order as any).order_status,
        order_amount: (order as any).order_amount,
        items: paginatedItems,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / parseInt(limit.toString())),
          has_next: offset + parseInt(limit.toString()) < totalItems,
          has_prev: parseInt(page.toString()) > 1
        }
      });
    } catch (error) {
      console.error('Get order items error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get order by custom order ID (starts with 'ozi')
   */
  static async getOrderByCustomId(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { orderId } = req.params;

      if (!orderId || !orderId.startsWith('ozi')) {
        return ResponseHandler.error(res, 'Valid custom order ID is required (must start with "ozi")', 400);
      }

      // For authenticated requests, filter by user_id
      const whereClause: any = { order_id: orderId };
      if (req.user && req.user.id) {
        whereClause.user_id = req.user.id;
      }

      const order = await Order.findOne({
        where: whereClause,
        raw: true
      });

      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      return ResponseHandler.success(res, {
        order: {
          ...order,
          order_id: (order as any).order_id,
          internal_id: (order as any).id
        }
      });
    } catch (error) {
      console.error('Get order by custom ID error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { order_id, cancellation_reason } = req.body;

      if (!order_id) {
        return ResponseHandler.error(res, 'Order ID is required', 400);
      }

      // Find order
      let whereClause: any = {};
      if (order_id.startsWith('ozi')) {
        whereClause.order_id = order_id;
      } else if (!isNaN(parseInt(order_id))) {
        whereClause.id = parseInt(order_id);
      } else {
        return ResponseHandler.error(res, 'Invalid order ID format', 400);
      }

      const order = await Order.findOne({ where: whereClause });
      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      // Check if order can be cancelled
      if ((order as any).order_status === 'cancelled') {
        return ResponseHandler.error(res, 'Order is already cancelled', 400);
      }

      if ((order as any).order_status === 'delivered') {
        return ResponseHandler.error(res, 'Cannot cancel delivered order', 400);
      }

      // Update order status
      await order.update({
        order_status: 'cancelled',
        cancellation_reason: cancellation_reason || 'Cancelled by customer',
        canceled_by: 'customer'
      });

      return ResponseHandler.success(res, {
        message: 'Order cancelled successfully',
        order_id: (order as any).order_id,
        status: 'cancelled'
      });

    } catch (error) {
      console.error('Cancel order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Track order
   */
  static async trackOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { order_id } = req.query;


      if (!order_id) {
        return ResponseHandler.error(res, 'Order ID is required', 400);
      }

      // Find order
      let whereClause: any = {};
      if (order_id.toString().startsWith('ozi')) {
        whereClause.order_id = order_id;
      } else if (!isNaN(parseInt(order_id.toString()))) {
        whereClause.id = parseInt(order_id.toString());
      } else {
        return ResponseHandler.error(res, 'Invalid order ID format', 400);
      }


      const order = await Order.findOne({ where: whereClause });
      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }


      return ResponseHandler.success(res, {
        order_id: (order as any).order_id,
        status: (order as any).order_status,
        payment_status: (order as any).payment_status,
        delivery_address: (order as any).delivery_address || (order as any).address || 'N/A',
        order_amount: (order as any).order_amount,
        created_at: (order as any).created_at,
        delivery_man: null, // In production, this would fetch delivery man details
        estimated_delivery: null // In production, this would calculate estimated delivery time
      });

    } catch (error) {
      console.error('Track order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Request refund for order
   */
  static async refundRequest(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { order_id, refund_reason, refund_amount, contact_number } = req.body;

      if (!order_id || !refund_reason) {
        return ResponseHandler.error(res, 'Order ID and refund reason are required', 400);
      }

      // Find order
      let whereClause: any = {};
      if (order_id.startsWith('ozi')) {
        whereClause.order_id = order_id;
      } else if (!isNaN(parseInt(order_id))) {
        whereClause.id = parseInt(order_id);
      } else {
        return ResponseHandler.error(res, 'Invalid order ID format', 400);
      }

      const order = await Order.findOne({ where: whereClause });
      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      // Check if order is eligible for refund
      if ((order as any).order_status === 'pending') {
        return ResponseHandler.error(res, 'Cannot request refund for pending order', 400);
      }

      // In production, this would create a refund request record
      // For now, we'll just return success
      const refund_id = `REF${Date.now()}`;

      return ResponseHandler.success(res, {
        message: 'Refund request submitted successfully',
        refund_id: refund_id,
        order_id: (order as any).order_id,
        status: 'pending_review'
      });

    } catch (error) {
      console.error('Refund request error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Debug endpoint to test order tracking
   */
  static async debugOrderTracking(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { order_id } = req.query;


      if (!order_id) {
        return ResponseHandler.error(res, 'Order ID is required', 400);
      }

      // Find order
      let whereClause: any = {};
      if (order_id.toString().startsWith('ozi')) {
        whereClause.order_id = order_id;
      } else if (!isNaN(parseInt(order_id.toString()))) {
        whereClause.id = parseInt(order_id.toString());
      } else {
        return ResponseHandler.error(res, 'Invalid order ID format', 400);
      }


      const order = await Order.findOne({ where: whereClause });
      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }


      return ResponseHandler.success(res, {
        debug: true,
        order_id: (order as any).order_id,
        status: (order as any).order_status,
        payment_status: (order as any).payment_status,
        delivery_address: (order as any).delivery_address || (order as any).address || 'N/A',
        order_amount: (order as any).order_amount,
        created_at: (order as any).created_at,
        whereClause,
        orderData: order
      });

    } catch (error) {
      console.error('Debug track order error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // FC-based order retrieval methods
  static async getOrdersByFC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const fcId = FCContextHelper.getCurrentFCId(req);
      const { status, limit = 50, offset = 0 } = req.query;

      let whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }

      const orders = await OrderController.getOrdersByFC(fcId, whereClause);
      
      return ResponseHandler.success(res, {
        message: 'Orders retrieved successfully',
        data: orders,
        count: orders.length,
        fc_id: fcId
      });
    } catch (error) {
      console.error('Get orders by FC error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async getOrderByIdAndFC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const fcId = FCContextHelper.getCurrentFCId(req);

      if (!id) {
        return ResponseHandler.error(res, 'Order ID is required', 400);
      }

      const order = await OrderController.getOrderByIdAndFC(parseInt(id), fcId);
      
      if (!order) {
        return ResponseHandler.error(res, 'Order not found or access denied', 404);
      }

      return ResponseHandler.success(res, {
        message: 'Order retrieved successfully',
        data: order,
        fc_id: fcId
      });
    } catch (error) {
      console.error('Get order by ID and FC error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async updateOrderByFC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const fcId = FCContextHelper.getCurrentFCId(req);
      const updateData = req.body;

      if (!id) {
        return ResponseHandler.error(res, 'Order ID is required', 400);
      }

      // Validate that order belongs to FC
      const isValidFC = await OrderController.validateOrderFC(parseInt(id), fcId);
      if (!isValidFC) {
        return ResponseHandler.error(res, 'Order not found or access denied', 404);
      }

      // Update order with FC context
      const [updatedRowsCount] = await Order.update(
        { ...updateData, fc_id: fcId },
        { where: { id: parseInt(id), fc_id: fcId } }
      );

      if (updatedRowsCount === 0) {
        return ResponseHandler.error(res, 'Order not found or no changes made', 404);
      }

      const updatedOrder = await OrderController.getOrderByIdAndFC(parseInt(id), fcId);
      
      return ResponseHandler.success(res, {
        message: 'Order updated successfully',
        data: updatedOrder,
        fc_id: fcId
      });
    } catch (error) {
      console.error('Update order by FC error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}
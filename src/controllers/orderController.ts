import { Request, Response } from 'express';
import Order from '../models/Order';
import Coupon from '../models/Coupon';
import CouponTranslation from '../models/CouponTranslation';
import { ResponseHandler } from '../middleware/responseHandler';
import { CartItem } from '../types';
import sequelize from '../config/database';

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
    const transaction = await sequelize.transaction();
    
    try {
      const orderData: OrderRequest = req.body;
      const userId = req.user?.id;

      // Basic validation
      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      // Validate required fields
      const requiredFields = ['cart', 'order_amount', 'payment_method', 'order_type', 'store_id'];
      for (const field of requiredFields) {
        if (!orderData[field as keyof OrderRequest]) {
          return ResponseHandler.error(res, `${field} is required`, 400);
        }
      }

      // Validate cart
      const cartValidation = OrderController.validateCartItems(orderData.cart);
      if (!cartValidation.isValid) {
        return ResponseHandler.error(res, cartValidation.message!, 400);
      }

      // Validate order type specific requirements
      if (orderData.order_type === 'delivery' || orderData.order_type === 'parcel') {
        if (!orderData.distance || orderData.distance <= 0) {
          return ResponseHandler.error(res, 'Distance is required for delivery/parcel orders', 400);
        }
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

      // Create order
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const order = await Order.create({
        user_id: userId,
        cart: orderData.cart,
        coupon_discount_amount: couponDiscountAmount,
        order_amount: finalOrderAmount,
        order_type: orderData.order_type,
        payment_method: orderData.payment_method,
        store_id: orderData.store_id,
        distance: orderData.distance || 0,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        address: orderData.address,
        latitude: orderData.latitude || 0,
        longitude: orderData.longitude || 0,
        contact_person_name: orderData.contact_person_name || '',
        contact_person_number: orderData.contact_person_number,
        address_type: orderData.address_type || 'others',
        is_scheduled: orderData.is_scheduled ? 1 : 0,
        scheduled_timestamp: orderData.scheduled_timestamp || currentTimestamp,
        promised_delv_tat: '24', // Default TAT
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
        
        // Additional fields from PHP version
        order_note: orderData.order_note,
        delivery_instruction: orderData.delivery_instruction,
        unavailable_item_note: orderData.unavailable_item_note,
        dm_tips: orderData.dm_tips || 0,
        cutlery: orderData.cutlery || 0,
        partial_payment: orderData.partial_payment || 0,
        is_buy_now: orderData.is_buy_now || 0,
        extra_packaging_amount: orderData.extra_packaging_amount || 0,
        create_new_user: orderData.create_new_user || 0,
        is_guest: 0, // Default to registered user
        otp: Math.floor(1000 + Math.random() * 9000), // Generate 4-digit OTP
        zone_id: 1, // Default zone ID
        module_id: 1, // Default module ID
        parcel_category_id: orderData.parcel_category_id,
        receiver_details: orderData.receiver_details,
        charge_payer: orderData.charge_payer,
        order_attachment: orderData.order_attachment,
        payment_status: 'unpaid',
        order_status: 'pending',
        transaction_reference: undefined,
        pending: currentTimestamp,
        tax_percentage: 10, // Default tax percentage
        total_tax_amount: taxAmount,
        original_delivery_charge: 0, // Will be calculated if needed
        tax_status: 'excluded',
        scheduled: orderData.is_scheduled ? 1 : 0,
        schedule_at: orderData.scheduled_timestamp || currentTimestamp,
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Prepare response to match production format exactly
      const response = {
        message: 'Order placed successfully',
        order_id: (order as any).id,
        total_ammount: (order as any).order_amount,
        status: 'pending',
        created_at: (() => {
          try {
            // Validate timestamp and convert to proper format
            if ((order as any).created_at && typeof (order as any).created_at === 'number' && (order as any).created_at > 0) {
              const date = new Date((order as any).created_at * 1000);
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
        user_id: (order as any).user_id
      };

      return ResponseHandler.success(res, response, 201);

    } catch (error) {
      // Rollback transaction on error only if it's still active
      if (transaction && !(transaction as any).finished) {
        await transaction.rollback();
      }
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
import { Transaction } from 'sequelize';
import sequelize from '../config/database';
import Order from '../models/Order';
import OrderDetail from '../models/OrderDetail';
import Product from '../models/Product';
import ProductVariant from '../models/ProductVariant';
import User from '../models/User';
import Warehouse from '../models/Warehouse';
import UniversalLog from '../models/UniversalLog';
import { generateSimpleOrderId } from '../utils/orderIdGenerator';
import { CartItem as ExistingCartItem } from '../types';

export interface OrderTransactionData {
  user_id: number;
  order_amount: number;
  coupon_discount_amount?: number;
  coupon_discount_title?: string;
  payment_method: string;
  order_type: string;
  store_id: number;
  delivery_charge?: number;
  delivery_address: string;
  latitude?: number;
  longitude?: number;
  contact_person_name: string;
  contact_person_number: string;
  is_guest?: boolean;
  guest_id?: string;
  dm_tips?: number;
  cutlery?: number;
  order_note?: string;
  schedule_at?: number;
  zone_id?: number;
  module_id?: number;
  order_attachment?: string;
  parcel_category_id?: number;
  receiver_details?: string;
  charge_payer?: string;
  distance?: number;
  cart: ExistingCartItem[];
  coupon_code?: string;
  transaction_reference?: string;
  delivery_address_id?: number;
  delivery_man_id?: number;
  delivery_time?: string;
  tax_amount?: number;
  store_discount_amount?: number;
  original_delivery_charge?: number;
  is_scheduled?: boolean;
  scheduled_timestamp?: number;
  callback?: string;
  prescription_order?: boolean;
  tax_status?: string;
  dm_vehicle_id?: number;
  processing_time?: number;
  unavailable_item_note?: string;
  delivery_instruction?: string;
  tax_percentage?: number;
  additional_charge?: number;
  order_proof?: string;
  partially_paid_amount?: number;
  flash_admin_discount_amount?: number;
  flash_store_discount_amount?: number;
  cash_back_id?: number;
  extra_packaging_amount?: number;
  ref_bonus_amount?: number;
  EcommInvoiceID?: string;
  EcommOrderID?: string;
  awb_number?: string;
  promised_duration?: string;
  address_type?: string;
  partial_payment?: boolean;
  is_buy_now?: boolean;
  create_new_user?: boolean;
  password?: string;
}

export interface OrderTransactionResult {
  success: boolean;
  order?: Order;
  orderDetails?: OrderDetail[];
  message?: string;
  error?: string;
  orderId?: string;
  internalId?: number;
}

export class OrderTransactionService {
  
  /**
   * Execute complete order placement transaction
   */
  static async executeOrderTransaction(
    orderData: OrderTransactionData
  ): Promise<OrderTransactionResult> {
    const transaction = await sequelize.transaction();
    
    try {
      // Phase 1: Validate and prepare data
      const validationResult = await this.validateOrderData(orderData, transaction);
      if (!validationResult.isValid) {
        await transaction.rollback();
        return {
          success: false,
          error: validationResult.message
        };
      }

      // Phase 2: Create main order
      const order = await this.createOrder(orderData, transaction);
      if (!order) {
        await transaction.rollback();
        return {
          success: false,
          error: 'Failed to create order'
        };
      }

      // Phase 3: Create order details
      const orderDetails = await this.createOrderDetails((order as any).id, orderData.cart, transaction);
      if (!orderDetails || orderDetails.length === 0) {
        await transaction.rollback();
        return {
          success: false,
          error: 'Failed to create order details'
        };
      }

      // Phase 4: Update stock quantities
      const stockUpdateResult = await this.updateStockQuantities(orderData.cart, transaction);
      if (!stockUpdateResult.success) {
        await transaction.rollback();
        return {
          success: false,
          error: stockUpdateResult.message
        };
      }

      // Phase 5: Update store and user statistics
      await this.updateStatistics(orderData, transaction);

      // Phase 6: Commit transaction
      await transaction.commit();

      // Log successful transaction
      await UniversalLog.create({
        url: '/api/v1/orders/place',
        method: 'POST',
        req: { order_data: orderData },
        res: { success: true, order_id: (order as any).order_id },
        status_code: 201,
        user_id: (order as any).user_id,
        execution_time_ms: 0,
        created_at: Math.floor(Date.now() / 1000),
        endpoint_name: 'place_order',
        module: 'order'
      });

      return {
        success: true,
        order,
        orderDetails,
        orderId: (order as any).order_id,
        internalId: (order as any).id,
        message: 'Order placed successfully'
      };

    } catch (error) {
      // Rollback transaction on any error
      if (transaction && !(transaction as any).finished) {
        await transaction.rollback();
      }

      // Log error
      await UniversalLog.create({
        url: '/api/v1/orders/place',
        method: 'POST',
        req: { order_data: orderData },
        res: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        status_code: 500,
        execution_time_ms: 0,
        created_at: Math.floor(Date.now() / 1000),
        endpoint_name: 'place_order',
        module: 'order',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  /**
   * Validate order data before processing
   */
  private static async validateOrderData(
    orderData: OrderTransactionData,
    transaction: Transaction
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      // Validate required fields
      const requiredFields = [
        'user_id', 'order_amount', 'payment_method', 'order_type', 
        'store_id', 'delivery_address', 'contact_person_name', 'contact_person_number'
      ];

      for (const field of requiredFields) {
        if (!orderData[field as keyof OrderTransactionData]) {
          return { isValid: false, message: `${field} is required` };
        }
      }

      // Validate cart
      if (!Array.isArray(orderData.cart) || orderData.cart.length === 0) {
        return { isValid: false, message: 'Cart must contain at least one item' };
      }

      // Validate order amount
      if (orderData.order_amount <= 0) {
        return { isValid: false, message: 'Order amount must be greater than 0' };
      }

      // Validate user exists
      const user = await User.findByPk(orderData.user_id, { transaction });
      if (!user) {
        return { isValid: false, message: 'User not found' };
      }

      // Validate store exists
      const store = await Warehouse.findByPk(orderData.store_id, { transaction });
      if (!store) {
        return { isValid: false, message: 'Store not found' };
      }

      // Validate cart items and stock
      for (const item of orderData.cart) {
        const product = await Product.findOne({
          where: { sku: item.sku.toString(), store_id: orderData.store_id },
          transaction
        });

        if (!product) {
          return { isValid: false, message: `Product with SKU ${item.sku} not found` };
        }

        if (product.stock_quantity < (item.quantity || 1)) {
          return { isValid: false, message: `Insufficient stock for SKU ${item.sku}. Available: ${product.stock_quantity}, Requested: ${item.quantity || 1}` };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create main order record
   */
  private static async createOrder(
    orderData: OrderTransactionData,
    transaction: Transaction
  ): Promise<Order | null> {
    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const customOrderId = await generateSimpleOrderId();

      const order = await Order.create({
        order_id: customOrderId,
        user_id: orderData.user_id,
        order_amount: orderData.order_amount,
        coupon_discount_amount: orderData.coupon_discount_amount || 0,
        coupon_discount_title: orderData.coupon_discount_title,
        payment_status: 'unpaid',
        order_status: 'pending',
        total_tax_amount: orderData.tax_amount || 0,
        payment_method: orderData.payment_method,
        transaction_reference: orderData.transaction_reference,
        delivery_address_id: orderData.delivery_address_id,
        delivery_man_id: orderData.delivery_man_id,
        coupon_code: orderData.coupon_code,
        order_note: orderData.order_note,
        order_type: orderData.order_type,
        checked: 0,
        store_id: orderData.store_id,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
        delivery_charge: orderData.delivery_charge || 0,
        schedule_at: orderData.schedule_at || currentTimestamp,
        callback: orderData.callback,
        otp: Math.floor(1000 + Math.random() * 9000),
        pending: currentTimestamp,
        accepted: undefined,
        confirmed: undefined,
        processing: undefined,
        handover: undefined,
        picked_up: undefined,
        delivered: undefined,
        reached_delivery_timestamp: undefined,
        canceled: undefined,
        refund_requested: 0,
        refunded: 0,
        delivery_address: orderData.delivery_address,
        scheduled: orderData.is_scheduled ? 1 : 0,
        store_discount_amount: orderData.store_discount_amount || 0,
        original_delivery_charge: orderData.original_delivery_charge || 0,
        failed: 0,
        adjusment: 0,
        edited: 0,
        delivery_time: orderData.delivery_time,
        zone_id: orderData.zone_id || 1,
        module_id: orderData.module_id || 1,
        order_attachment: orderData.order_attachment,
        parcel_category_id: orderData.parcel_category_id,
        receiver_details: orderData.receiver_details,
        charge_payer: orderData.charge_payer || 'sender',
        distance: orderData.distance || 0,
        dm_tips: orderData.dm_tips || 0,
        free_delivery_by: undefined,
        refund_request_canceled: 0,
        prescription_order: orderData.prescription_order ? 1 : 0,
        tax_status: orderData.tax_status || 'excluded',
        dm_vehicle_id: orderData.dm_vehicle_id,
        cancellation_reason: undefined,
        canceled_by: undefined,
        coupon_created_by: undefined,
        discount_on_product_by: undefined,
        processing_time: orderData.processing_time,
        unavailable_item_note: orderData.unavailable_item_note,
        cutlery: orderData.cutlery || 0,
        delivery_instruction: orderData.delivery_instruction,
        tax_percentage: orderData.tax_percentage || 10,
        additional_charge: orderData.additional_charge || 0,
        order_proof: orderData.order_proof,
        partially_paid_amount: orderData.partially_paid_amount || 0,
        is_guest: orderData.is_guest ? 1 : 0,
        flash_admin_discount_amount: orderData.flash_admin_discount_amount || 0,
        flash_store_discount_amount: orderData.flash_store_discount_amount || 0,
        cash_back_id: orderData.cash_back_id,
        extra_packaging_amount: orderData.extra_packaging_amount || 0,
        ref_bonus_amount: orderData.ref_bonus_amount || 0,
        EcommInvoiceID: orderData.EcommInvoiceID,
        EcommOrderID: orderData.EcommOrderID,
        awb_number: orderData.awb_number,
        promised_duration: orderData.promised_duration,
        cart: JSON.stringify(orderData.cart) as any,
        discount_amount: 0,
        tax_amount: orderData.tax_amount || 0,
        latitude: (orderData.latitude || 0) as number,
        longitude: (orderData.longitude || 0) as number,
        contact_person_name: orderData.contact_person_name,
        contact_person_number: orderData.contact_person_number,
        address_type: orderData.address_type || 'others',
        is_scheduled: orderData.is_scheduled ? 1 : 0,
        scheduled_timestamp: orderData.scheduled_timestamp || currentTimestamp,
        promised_delv_tat: '24',
        partial_payment: orderData.partial_payment ? 1 : 0,
        is_buy_now: orderData.is_buy_now ? 1 : 0,
        create_new_user: orderData.create_new_user ? 1 : 0,
        guest_id: orderData.guest_id,
        password: orderData.password,
      }, { transaction });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  /**
   * Create order detail records for each cart item
   */
  private static async createOrderDetails(
    orderId: number,
    cartItems: ExistingCartItem[],
    transaction: Transaction
  ): Promise<OrderDetail[]> {
    try {
      const orderDetails: OrderDetail[] = [];
      const currentTimestamp = Math.floor(Date.now() / 1000);

      for (const item of cartItems) {
        // Get product details
        const product = await Product.findOne({
          where: { sku: item.sku.toString() },
          transaction
        });

        if (!product) {
          throw new Error(`Product with SKU ${item.sku} not found`);
        }

        const orderDetail = await OrderDetail.create({
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          sku: item.sku.toString(),
          price: item.amount,
          quantity: item.quantity || 1,
          total_price: item.amount,
          variant: null,
          variation: null,
          add_ons: null,
          discount_on_item: 0,
          discount_type: 'amount',
          tax_amount: 0,
          total_add_on_price: 0,
          food_details: JSON.stringify({ sku: item.sku, amount: item.amount, quantity: item.quantity || 1 }),
        }, { transaction });

        orderDetails.push(orderDetail);
      }

      return orderDetails;
    } catch (error) {
      console.error('Error creating order details:', error);
      throw error;
    }
  }

  /**
   * Update stock quantities after order placement
   */
  private static async updateStockQuantities(
    cartItems: ExistingCartItem[],
    transaction: Transaction
  ): Promise<{ success: boolean; message?: string }> {
    try {
      for (const item of cartItems) {
        // Update main product stock
        const product = await Product.findOne({
          where: { sku: item.sku.toString() },
          transaction
        });

        if (!product) {
          throw new Error(`Product with SKU ${item.sku} not found for stock update`);
        }

        const quantity = item.quantity || 1;

        // Check if sufficient stock exists
        if (product.stock_quantity < quantity) {
          throw new Error(`Insufficient stock for SKU ${item.sku}. Available: ${product.stock_quantity}, Requested: ${quantity}`);
        }

        // Update stock quantity
        await product.update({
          stock_quantity: product.stock_quantity - quantity
        }, { transaction });
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Stock update error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Update store and user statistics
   */
  private static async updateStatistics(
    orderData: OrderTransactionData,
    transaction: Transaction
  ): Promise<void> {
    try {
      // Update store statistics - only update fields that exist
      const store = await Warehouse.findByPk(orderData.store_id, { transaction });
      if (store) {
        // Note: total_order field doesn't exist in current Warehouse model
        // This would need to be added to the model or handled differently
        console.log('Store statistics update skipped - total_order field not available');
      }

      // Update user profile if not guest
      if (!orderData.is_guest) {
        const user = await User.findByPk(orderData.user_id, { transaction });
        if (user) {
          // Note: User model doesn't have f_name, l_name, or zone_id fields
          // These updates would need to be added to the User model or handled differently
          console.log('User profile update skipped - required fields not available in current User model');
        }
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
      // Don't throw error for statistics update failures
    }
  }
}

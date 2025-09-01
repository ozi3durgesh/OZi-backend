// services/OrderTransactionService.ts - Simplified version without deleted models
import sequelize from '../config/database';
import { Order, PaymentRequest } from '../models';

export interface OrderTransactionData {
  user_id: number;
  store_id: number;
  order_amount: number;
  tax_amount: number;
  payment_method: string;
  delivery_address: string;
  cart: any[];
  coupon_code?: string;
  partial_payment?: boolean;
  is_buy_now?: boolean;
  create_new_user?: boolean;
  password?: string;
  order_type?: string;
  latitude?: number;
  longitude?: number;
  contact_person_name?: string;
  contact_person_number?: string;
  coupon_discount_amount?: number;
  coupon_discount_title?: string;
  discount_amount?: number;
}

export interface OrderTransactionResult {
  success: boolean;
  order?: Order;
  message?: string;
  error?: string;
  orderId?: string;
  internalId?: number;
}

export class OrderTransactionService {
  
  /**
   * Execute simplified order placement transaction
   */
  static async executeOrderTransaction(
    orderData: OrderTransactionData
  ): Promise<OrderTransactionResult> {
    const transaction = await sequelize.transaction();
    
    try {
      // Phase 1: Validate basic data
      const validationResult = await this.validateBasicOrderData(orderData);
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

      // Phase 3: Create payment request for digital payments
      if (orderData.payment_method === 'digital_payment') {
        const paymentRequest = await this.createPaymentRequest(order, orderData, transaction);
        if (!paymentRequest) {
          await transaction.rollback();
          return {
            success: false,
            error: 'Failed to create payment request'
          };
        }
      }

      // Phase 4: Commit transaction
      await transaction.commit();

      return {
        success: true,
        order,
        orderId: (order as any).order_id,
        internalId: (order as any).id,
        message: 'Order placed successfully'
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Order transaction error:', error);
      return {
        success: false,
        error: 'Order placement failed due to system error'
      };
    }
  }

  /**
   * Validate basic order data
   */
  private static async validateBasicOrderData(orderData: OrderTransactionData): Promise<{ isValid: boolean; message?: string }> {
    if (!orderData.user_id || orderData.user_id <= 0) {
      return { isValid: false, message: 'Valid user ID is required' };
    }

    if (!orderData.store_id || orderData.store_id <= 0) {
      return { isValid: false, message: 'Valid store ID is required' };
    }

    if (!orderData.cart || orderData.cart.length === 0) {
      return { isValid: false, message: 'Cart cannot be empty' };
    }

    if (!orderData.delivery_address || orderData.delivery_address.trim() === '') {
      return { isValid: false, message: 'Delivery address is required' };
    }

    if (orderData.order_amount <= 0) {
      return { isValid: false, message: 'Order amount must be greater than 0' };
    }

    return { isValid: true };
  }

  /**
   * Create main order
   */
  private static async createOrder(orderData: OrderTransactionData, transaction: any): Promise<Order | null> {
    try {
              const order = await Order.create({
          user_id: orderData.user_id,
          store_id: orderData.store_id,
          order_amount: orderData.order_amount,
          total_tax_amount: orderData.tax_amount,
          payment_method: orderData.payment_method,
          order_type: orderData.order_type || 'delivery',
          order_status: 'pending',
          payment_status: 'unpaid',
          delivery_address: orderData.delivery_address,
          cart: orderData.cart,
          latitude: orderData.latitude,
          longitude: orderData.longitude,
          contact_person_name: orderData.contact_person_name,
          contact_person_number: orderData.contact_person_number,
          coupon_discount_amount: orderData.coupon_discount_amount || 0,
          coupon_discount_title: orderData.coupon_discount_title,
          discount_amount: orderData.discount_amount || 0,
          order_id: await this.generateOrderId(),
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000)
        }, { transaction });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  /**
   * Create payment request
   */
  private static async createPaymentRequest(order: Order, orderData: OrderTransactionData, transaction: any): Promise<PaymentRequest | null> {
    try {
              const paymentRequest = await PaymentRequest.create({
          id: this.generatePaymentRequestId(),
          order_id: (order as any).id,
          payment_amount: orderData.order_amount,
          currency_code: 'INR',
          payment_method: orderData.payment_method,
          is_paid: false
        }, { transaction });

      return paymentRequest;
    } catch (error) {
      console.error('Error creating payment request:', error);
      return null;
    }
  }

  /**
   * Generate unique order ID in format: ozi + milliseconds + sequence
   * Example: ozi17561230400390001
   */
  private static async generateOrderId(): Promise<string> {
    try {
      // Get current timestamp in milliseconds
      const timestamp = Date.now();
      
      // Get the next auto-increment ID from the orders table
      const [results] = await sequelize.query(`
        SELECT AUTO_INCREMENT 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'orders'
      `);
      
      const nextId = (results as any)[0]?.AUTO_INCREMENT || 1;
      
      // Combine: ozi + timestamp + sequence (padded to 4 digits)
      const sequence = nextId.toString().padStart(4, '0');
      const orderId = `ozi${timestamp}${sequence}`;
      
      return orderId;
    } catch (error) {
      console.error('Error generating order ID:', error);
      // Fallback: ozi + timestamp + random 4 digits
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `ozi${timestamp}${random}`;
    }
  }

  /**
   * Generate unique payment request ID
   */
  private static generatePaymentRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `pay${timestamp}${random}`.toUpperCase();
  }
}

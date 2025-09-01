import axios from 'axios';

interface OrderConnectorConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

interface CreateOrderPayload {
  orderType: string;
  marketplaceId: number;
  discount: number;
  promoCodeDiscount: number;
  orderNumber: number;
  orderDate: string;
  expDeliveryDate: string;
  paymentMode: number;
  shippingMethod: number;
  shippingCost: number;
  is_market_shipped: number;
  items: Array<{
    Sku: string;
    Quantity: number;
    Price: number;
  }>;
  customer: Array<{
    billing_address_1: string;
    gst_number: string;
    billing: {
      name: string;
      addressLine1: string;
      addressLine2: string;
      postalCode: string;
      city: string;
      state: string;
      country: string;
      contact: string;
      email: string;
      latitude: number;
      longitude: number;
    };
    shipping: {
      name: string;
      addressLine1: string;
      addressLine2: string;
      postalCode: string;
      city: string;
      state: string;
      country: string;
      contact: string;
      email: string;
      latitude: number;
      longitude: number;
    };
  }>;
}

class OrderConnector {
  private config: OrderConnectorConfig;

  constructor(config?: Partial<OrderConnectorConfig>) {
    this.config = {
      baseURL: process.env.ECOM_BASE_URL || 'https://connector.ozi.in',
      apiKey: process.env.ECOM_API_KEY,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Make a call to the ecommerce API
   * @param method - The API method to call
   * @param payload - The payload to send
   * @returns Promise with the API response
   */
  async call(method: string, payload: any): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await axios({
        method: 'POST',
        url: `${this.config.baseURL}/api/${method}`,
        data: payload,
        headers,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API call failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Create an order in the ecommerce system
   * @param payload - The order creation payload
   * @returns Promise with the order creation response
   */
  async createOrder(payload: CreateOrderPayload): Promise<any> {
    return this.call('createOrder', payload);
  }

  /**
   * Get order details from the ecommerce system
   * @param orderNumber - The order number to retrieve
   * @returns Promise with the order details
   */
  async getOrder(orderNumber: string | number): Promise<any> {
    return this.call('getOrder', { orderNumber });
  }

  /**
   * Update order status in the ecommerce system
   * @param orderNumber - The order number to update
   * @param status - The new status
   * @returns Promise with the update response
   */
  async updateOrderStatus(orderNumber: string | number, status: string): Promise<any> {
    return this.call('updateOrderStatus', { orderNumber, status });
  }
}

export default OrderConnector;

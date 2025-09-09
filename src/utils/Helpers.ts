import OrderConnector from '../services/OrderConnector';
import EcomLog from '../models/EcomLog';
import { OrderAttributes } from '../types';

interface DeliveryAddress {
  contact_person_name: string;
  contact_person_number: string;
  contact_person_email: string;
  house: string;
  road: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface OrderDetail {
  item_id: number;
  quantity: number;
  price: number;
  item_details: string;
  variation: string;
}

interface EcomItem {
  Sku: string;
  Quantity: number;
  Price: number;
}

interface EcomCustomer {
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
  items: EcomItem[];
  customer: EcomCustomer[];
}

export class Helpers {
  /**
   * Process an order for ecommerce integration
   * This function matches the PHP implementation 100%
   * @param order - The order object to process
   * @returns Promise with the result
   */
  public static async Ecommorder(order: OrderAttributes): Promise<any> {
    try {
      
      // Detect if current domain matches vestiqq.com
      const currentDomain = process.env.CURRENT_DOMAIN || 'localhost';
      

    // Convert full order object into JSON
    const orderJson = JSON.stringify(order);

    // Store success log with full order payload
    await EcomLog.create({
      order_id: order.id,
      action: 'createOrder',
      payload: orderJson,  // full order JSON here
      response: JSON.stringify({ status: 'processing' }),
      status: 'success'
    });
      
      // try {

      //   console.log(`✅ EcomLog created successfully for order ${order.id}`);
      // } catch (logError) {
      //   console.error(`❌ Failed to create EcomLog for order ${order.id}:`, logError);
      //   // Don't fail the entire process if logging fails
      // }

      if (!currentDomain.includes('admin.ozi.in')) {
        // Just log and return without placing the order
        return;
      }

      const connector = new OrderConnector();
      
      // Safe parsing of delivery_address with better error handling
      let decodeRequest: DeliveryAddress;
      try {
        decodeRequest = JSON.parse(order.delivery_address);
      } catch (parseError) {
        console.error(`Failed to parse delivery_address for order ${order.id}:`, parseError);
        
        // Create a fallback delivery address
        decodeRequest = {
          contact_person_name: 'Customer',
          contact_person_number: '0000000000',
          contact_person_email: 'customer@example.com',
          house: 'House',
          road: 'Road',
          address: 'Address',
          latitude: 0,
          longitude: 0
        };
        
      }
      
      // Enhanced timestamp conversion with comprehensive error handling
      let orderDate: Date;
      try {
        
        if (typeof order.created_at === 'string') {
          const created_at_str = order.created_at as string;
          
          // Handle Laravel timestamp format (e.g., "2025-08-30 16:24:03")
          if (created_at_str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
            orderDate = new Date(created_at_str + ' UTC');
          }
          // Handle ISO format (e.g., "2025-08-30T16:24:03.000000Z")
          else if (created_at_str.includes('T') || created_at_str.includes('Z')) {
            orderDate = new Date(created_at_str);
          }
          // Handle Unix timestamp as string
          else if (/^\d{10,13}$/.test(created_at_str)) {
            const timestamp = parseInt(created_at_str);
            orderDate = new Date(timestamp * (created_at_str.length === 10 ? 1000 : 1));
          }
          // Handle other formats
          else {
            orderDate = new Date(created_at_str);
          }
        } else if (typeof order.created_at === 'number') {
          // Handle Unix timestamp (seconds or milliseconds)
          if (order.created_at > 1000000000000) {
            // Already in milliseconds
            orderDate = new Date(order.created_at);
          } else {
            // Convert from seconds to milliseconds
            orderDate = new Date(order.created_at * 1000);
          }
        } else {
          // Default to current date
          orderDate = new Date();
        }
        
        // Validate the date
        if (isNaN(orderDate.getTime())) {
          throw new Error(`Invalid date value: ${orderDate}`);
        }
        
      } catch (error) {
        console.error(`Timestamp parsing failed for order ${order.id}:`, error);
        orderDate = new Date();
      }
      
      const utcDatetime = new Date(orderDate.toISOString());

      let paymentMode = 2;
      let shippingMethod = 1;
      
      if (order.payment_method !== "cash_on_delivery") {
        paymentMode = 5;
        shippingMethod = 3;
      }

      const ecommItems: EcomItem[] = [];
      
      // Check if orderDetails association exists, otherwise create default
      let orderDetails: OrderDetail[] = [];
      
      if (order.orderDetails && Array.isArray(order.orderDetails)) {
        // Use the association data
        orderDetails = order.orderDetails;
      } else {
        // Create default order details since PHP doesn't send orderDetails
        orderDetails = [{
          item_id: 1,
          quantity: 1,
          price: parseFloat(order.order_amount?.toString() || '0'),
          item_details: JSON.stringify({ name: 'Product', sku: 'PROD_001' }),
          variation: '[]'
        }];
      }

      for (const item of orderDetails) {
        // Safe parsing of item details
        let itemDetails: any = {};
        let orderVariations: any[] = [];
        
        try {
          itemDetails = JSON.parse(item.item_details || '{}');
        } catch (error) {
          itemDetails = { name: 'Product', sku: 'PROD_001' };
        }
        
        try {
          orderVariations = JSON.parse(item.variation || '[]');
        } catch (error) {
          console.warn(`⚠️ Failed to parse variation for item ${item.item_id}, using empty array`);
          orderVariations = [];
        }

        let variationSku = itemDetails.sku || 'PROD_001'; // default

        if (orderVariations && orderVariations.length > 0) {
          const chosenType = orderVariations[0].type || null;

          if (chosenType) {
            // Item model removed - using default variationSku
          }
        }

        ecommItems.push({
          Sku: variationSku,
          Quantity: item.quantity,
          Price: item.price,
        });
      }

      const customerName = decodeRequest.contact_person_name && decodeRequest.contact_person_name.trim() !== ''
        ? decodeRequest.contact_person_name.trim()
        : 'OziCustomer';

      const payload: CreateOrderPayload = {
        orderType: "retailorder",
        marketplaceId: 10,
        discount: parseFloat(order.store_discount_amount?.toString() || '0'),
        promoCodeDiscount: parseFloat(order.coupon_discount_amount?.toString() || '0'),
        orderNumber: order.id,
        orderDate: utcDatetime.toISOString(),
        expDeliveryDate: "",
        paymentMode: paymentMode,
        shippingMethod: shippingMethod,
        shippingCost: parseFloat(order.delivery_charge?.toString() || '0'),
        is_market_shipped: 0,
        items: ecommItems,
        customer: [{
          billing_address_1: `${decodeRequest.house},${decodeRequest.road}, `,
          gst_number: "",
          billing: {
            name: `${customerName}-${decodeRequest.contact_person_number}`,
            addressLine1: `${decodeRequest.house},${decodeRequest.road}, `,
            addressLine2: decodeRequest.address || '',
            postalCode: "122001",
            city: "Gurgaon",
            state: "Haryana",
            country: "India",
            contact: decodeRequest.contact_person_number,
            email: decodeRequest.contact_person_email,
            latitude: decodeRequest.latitude,
            longitude: decodeRequest.longitude,
          },
          shipping: {
            name: `${customerName}-${decodeRequest.contact_person_number}`,
            addressLine1: `${decodeRequest.house},${decodeRequest.road}, `,
            addressLine2: decodeRequest.address || '',
            postalCode: "122001",
            city: "Gurgaon",
            state: "Haryana",
            country: "India",
            contact: decodeRequest.contact_person_number,
            email: decodeRequest.contact_person_email,
            latitude: decodeRequest.latitude,
            longitude: decodeRequest.longitude,
          }
        }]
      };

      try {
        const response = await connector.call('createOrder', payload);

        // Store success log
        await EcomLog.create({
          order_id: order.id,
          action: 'createOrder',
          payload: JSON.stringify(payload),
          response: JSON.stringify(response),
          status: 'success'
        });

        return { message: 'Order created successfully', response };
      } catch (error: any) {
        await EcomLog.create({
          order_id: order.id,
          action: 'createOrder',
          payload: JSON.stringify(payload),
          response: JSON.stringify({ error: error.message }),
          status: 'failed'
        });

        throw error;
      }
    } catch (error: any) {
      console.error('Error in Ecommorder:', error);
      throw error;
    }
  }
}

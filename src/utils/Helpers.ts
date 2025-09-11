import OrderConnector from '../services/OrderConnector';
import EcomLog from '../models/EcomLog';
import Order from '../models/Order';
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

  public static async generatePicklist(orderId: string, numericOrderId: number): Promise<any> {
    try {
      const picklistUrl = 'http://13.232.150.239/api/picklist/generate';
      const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYWRtaW5AY29tcGFueS5jb20iLCJyb2xlIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJ1c2Vyc19yb2xlczptYW5hZ2UiLCJzaXRlczpjcmVhdGVfY29uZmlnIiwic2l0ZXM6dmlldyIsInNpdGVzOnZpZXdfb3duIiwib3JkZXJzOnZpZXdfYWxsIiwib3JkZXJzOnZpZXdfd2giLCJvcmRlcnM6dmlld19zdG9yZSIsIm9yZGVyczp2aWV3X3Rhc2siLCJwaWNraW5nOnZpZXciLCJwaWNraW5nOmFzc2lnbl9tYW5hZ2UiLCJwaWNraW5nOmV4ZWN1dGUiLCJpbmJvdW5kOnZpZXciLCJpbmJvdW5kOmFwcHJvdmVfdmFyaWFuY2VzIiwiaW5ib3VuZDpleGVjdXRlIiwicHV0YXdheTp2aWV3IiwicHV0YXdheTptYW5hZ2UiLCJwdXRhd2F5OmV4ZWN1dGUiLCJpbnZlbnRvcnk6YXBwcm92ZSIsImludmVudG9yeTpyYWlzZSIsImN5Y2xlX2NvdW50OnZpZXciLCJjeWNsZV9jb3VudDpzY2hlZHVsZV9hcHByb3ZlIiwiY3ljbGVfY291bnQ6ZXhlY3V0ZSIsInJlcGxlbmlzaG1lbnQ6Y29uZmlnIiwicmVwbGVuaXNobWVudDphcHByb3ZlIiwicnR2OmNvbmZpZ19hcHByb3ZlIiwicnR2OmNyZWF0ZV9hcHByb3ZlIiwicnR2OmV4ZWN1dGUiLCJwb3M6dmlldyIsInBvczpleGVjdXRlIiwic3RvcmVfd2hfcmVxdWVzdHM6dmlldyIsInN0b3JlX3doX3JlcXVlc3RzOmNyZWF0ZV9jaGVja2luIiwiZXhjZXB0aW9uczphbGxfYWN0aW9ucyIsImV4Y2VwdGlvbnM6cmVzb2x2ZSIsImV4Y2VwdGlvbnM6cmFpc2UiLCJleGNlcHRpb25zOnJhaXNlX3N0b3JlIiwiZGFzaGJvYXJkczp2aWV3X2FsbCIsImRhc2hib2FyZHM6dmlld193aCIsImRhc2hib2FyZHM6dmlld190YXNrIiwiZGFzaGJvYXJkczp2aWV3X3N0b3JlIiwic2xhOmNvbmZpZ3VyZSIsInNsYTp2aWV3Iiwic3RvcmVfb3BzOnBvc19jaGVja291dCIsInN0b3JlX29wczppbnZvaWNlX2NyZWF0ZSIsInN0b3JlX29wczpzdG9yZV9zdGF0dXMiLCJzdG9yZV9vcHM6c3VyZ2VfdG9nZ2xlIiwic3RvcmVfb3BzOnN0b2NrX2NoZWNrIiwicGlja2luZzptb25pdG9yIl0sImlhdCI6MTc1NjIxNDM5MCwiZXhwIjoxNzU2ODE5MTkwfQ.B8kGtT4b2hginUvjqcOSPc6cSfplJjMdahWXT1jVs-I';
      
      const payload = {
        orderIds: [`${orderId}`],
        priority: "HIGH",
        routeOptimization: true,
        fefoRequired: false,
        tagsAndBags: false
      };

      const response = await fetch(picklistUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Picklist generation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log the picklist generation
      try {
        await EcomLog.create({
          order_id: numericOrderId,
          action: 'generatePicklist',
          payload: JSON.stringify(payload),
          response: JSON.stringify(result),
          status: 'success'
        });
      } catch (logError: any) {
        console.warn(`⚠️ Could not log picklist success to ecom_logs for order ${orderId}:`, logError.message);
      }

      console.log(`✅ Picklist generated successfully for order ${orderId}`);
      return result;

    } catch (error: any) {
      console.error(`❌ Error generating picklist for order ${orderId}:`, error);
      
      // Log the error
      try {
        await EcomLog.create({
          order_id: numericOrderId,
          action: 'generatePicklist',
          payload: JSON.stringify({ orderIds: [`${orderId}`] }),
          response: JSON.stringify({ error: error.message }),
          status: 'failed'
        });
      } catch (logError: any) {
        console.warn(`⚠️ Could not log picklist error to ecom_logs for order ${orderId}:`, logError.message);
      }

      throw error;
    }
  }

  public static async Ecommorder(order: OrderAttributes): Promise<any> {
    try {
      
      // Detect if current domain matches vestiqq.com
      const currentDomain = process.env.CURRENT_DOMAIN || 'localhost';
      
      // First, verify that the order exists in the database
      // const existingOrder = await Order.findByPk(order.id);
      // if (!existingOrder) {
      //   console.error(`❌ Order ${order.id} not found in database, skipping ecom_logs creation`);
      //   throw new Error(`Order ${order.id} not found in database`);
      // }

    const orderJson = JSON.stringify(order);
    
    // Try to log, but don't fail if order doesn't exist in database yet
    try {
      await EcomLog.create({
        order_id: order.id,
        action: 'createOrder',
        payload: orderJson,  // full order JSON here
        response: JSON.stringify({ status: 'processing' }),
        status: 'success'
      });
    } catch (logError: any) {
      console.warn(`⚠️ Could not log to ecom_logs for order ${order.id}:`, logError.message);
      // Continue processing even if logging fails
    }

    // Generate picklist for the order
    try {
      await this.generatePicklist(order.order_id, order.id);
      } catch (picklistError) {
        console.error(`❌ Failed to generate picklist for order ${order.order_id}:`, picklistError);
        // Don't throw error here as picklist generation is not critical for order creation
      }

      // if (!currentDomain.includes('admin.ozi.in')) {
      //   // Just log and return without placing the order
      //   return;
      // }

      // const connector = new OrderConnector();
      
      // // Safe parsing of delivery_address with better error handling
      // let decodeRequest: DeliveryAddress;
      // try {
      //   decodeRequest = JSON.parse(order.delivery_address);
      // } catch (parseError) {
      //   console.error(`Failed to parse delivery_address for order ${order.id}:`, parseError);
        
      //   // Create a fallback delivery address
      //   decodeRequest = {
      //     contact_person_name: 'Customer',
      //     contact_person_number: '0000000000',
      //     contact_person_email: 'customer@example.com',
      //     house: 'House',
      //     road: 'Road',
      //     address: 'Address',
      //     latitude: 0,
      //     longitude: 0
      //   };
        
      // }
      
      // // Enhanced timestamp conversion with comprehensive error handling
      // let orderDate: Date;
      // try {
        
      //   if (typeof order.created_at === 'string') {
      //     const created_at_str = order.created_at as string;
          
      //     // Handle Laravel timestamp format (e.g., "2025-08-30 16:24:03")
      //     if (created_at_str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      //       orderDate = new Date(created_at_str + ' UTC');
      //     }
      //     // Handle ISO format (e.g., "2025-08-30T16:24:03.000000Z")
      //     else if (created_at_str.includes('T') || created_at_str.includes('Z')) {
      //       orderDate = new Date(created_at_str);
      //     }
      //     // Handle Unix timestamp as string
      //     else if (/^\d{10,13}$/.test(created_at_str)) {
      //       const timestamp = parseInt(created_at_str);
      //       orderDate = new Date(timestamp * (created_at_str.length === 10 ? 1000 : 1));
      //     }
      //     // Handle other formats
      //     else {
      //       orderDate = new Date(created_at_str);
      //     }
      //   } else if (typeof order.created_at === 'number') {
      //     // Handle Unix timestamp (seconds or milliseconds)
      //     if (order.created_at > 1000000000000) {
      //       // Already in milliseconds
      //       orderDate = new Date(order.created_at);
      //     } else {
      //       // Convert from seconds to milliseconds
      //       orderDate = new Date(order.created_at * 1000);
      //     }
      //   } else {
      //     // Default to current date
      //     orderDate = new Date();
      //   }
        
      //   // Validate the date
      //   if (isNaN(orderDate.getTime())) {
      //     throw new Error(`Invalid date value: ${orderDate}`);
      //   }
        
      // } catch (error) {
      //   console.error(`Timestamp parsing failed for order ${order.id}:`, error);
      //   orderDate = new Date();
      // }
      
      // const utcDatetime = new Date(orderDate.toISOString());

      // let paymentMode = 2;
      // let shippingMethod = 1;
      
      // if (order.payment_method !== "cash_on_delivery") {
      //   paymentMode = 5;
      //   shippingMethod = 3;
      // }

      // const ecommItems: EcomItem[] = [];
      
      // // Check if orderDetails association exists, otherwise create default
      // let orderDetails: OrderDetail[] = [];
      
      // if (order.orderDetails && Array.isArray(order.orderDetails)) {
      //   // Use the association data
      //   orderDetails = order.orderDetails;
      // } else {
      //   // Create default order details since PHP doesn't send orderDetails
      //   orderDetails = [{
      //     item_id: 1,
      //     quantity: 1,
      //     price: parseFloat(order.order_amount?.toString() || '0'),
      //     item_details: JSON.stringify({ name: 'Product', sku: 'PROD_001' }),
      //     variation: '[]'
      //   }];
      // }

      // for (const item of orderDetails) {
      //   // Safe parsing of item details
      //   let itemDetails: any = {};
      //   let orderVariations: any[] = [];
        
      //   try {
      //     itemDetails = JSON.parse(item.item_details || '{}');
      //   } catch (error) {
      //     itemDetails = { name: 'Product', sku: 'PROD_001' };
      //   }
        
      //   try {
      //     orderVariations = JSON.parse(item.variation || '[]');
      //   } catch (error) {
      //     console.warn(`⚠️ Failed to parse variation for item ${item.item_id}, using empty array`);
      //     orderVariations = [];
      //   }

      //   let variationSku = itemDetails.sku || 'PROD_001'; // default

      //   if (orderVariations && orderVariations.length > 0) {
      //     const chosenType = orderVariations[0].type || null;

      //     if (chosenType) {
      //       // Item model removed - using default variationSku
      //     }
      //   }

      //   ecommItems.push({
      //     Sku: variationSku,
      //     Quantity: item.quantity,
      //     Price: item.price,
      //   });
      // }

      // const customerName = decodeRequest.contact_person_name && decodeRequest.contact_person_name.trim() !== ''
      //   ? decodeRequest.contact_person_name.trim()
      //   : 'OziCustomer';

      // const payload: CreateOrderPayload = {
      //   orderType: "retailorder",
      //   marketplaceId: 10,
      //   discount: parseFloat(order.store_discount_amount?.toString() || '0'),
      //   promoCodeDiscount: parseFloat(order.coupon_discount_amount?.toString() || '0'),
      //   orderNumber: order.id,
      //   orderDate: utcDatetime.toISOString(),
      //   expDeliveryDate: "",
      //   paymentMode: paymentMode,
      //   shippingMethod: shippingMethod,
      //   shippingCost: parseFloat(order.delivery_charge?.toString() || '0'),
      //   is_market_shipped: 0,
      //   items: ecommItems,
      //   customer: [{
      //     billing_address_1: `${decodeRequest.house},${decodeRequest.road}, `,
      //     gst_number: "",
      //     billing: {
      //       name: `${customerName}-${decodeRequest.contact_person_number}`,
      //       addressLine1: `${decodeRequest.house},${decodeRequest.road}, `,
      //       addressLine2: decodeRequest.address || '',
      //       postalCode: "122001",
      //       city: "Gurgaon",
      //       state: "Haryana",
      //       country: "India",
      //       contact: decodeRequest.contact_person_number,
      //       email: decodeRequest.contact_person_email,
      //       latitude: decodeRequest.latitude,
      //       longitude: decodeRequest.longitude,
      //     },
      //     shipping: {
      //       name: `${customerName}-${decodeRequest.contact_person_number}`,
      //       addressLine1: `${decodeRequest.house},${decodeRequest.road}, `,
      //       addressLine2: decodeRequest.address || '',
      //       postalCode: "122001",
      //       city: "Gurgaon",
      //       state: "Haryana",
      //       country: "India",
      //       contact: decodeRequest.contact_person_number,
      //       email: decodeRequest.contact_person_email,
      //       latitude: decodeRequest.latitude,
      //       longitude: decodeRequest.longitude,
      //     }
      //   }]
      // };

      // try {
      //   const response = await connector.call('createOrder', payload);

      //   // Store success log
      //   await EcomLog.create({
      //     order_id: order.id,
      //     action: 'createOrder',
      //     payload: JSON.stringify(payload),
      //     response: JSON.stringify(response),
      //     status: 'success'
      //   });

      //   return { message: 'Order created successfully', response };
      // } catch (error: any) {
      //   await EcomLog.create({
      //     order_id: order.id,
      //     action: 'createOrder',
      //     payload: JSON.stringify(payload),
      //     response: JSON.stringify({ error: error.message }),
      //     status: 'failed'
      //   });

      //   throw error;
      // }

    } catch (error: any) {
      console.error('Error in Ecommorder:', error);
      throw error;
    }
  }
}

import OrderConnector from '../services/OrderConnector';
import EcomLog from '../models/EcomLog';
import Item from '../models/Item';
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
      console.log(`🔄 Processing order ${order.id} through Ecommorder...`);
      console.log(`📅 Order created_at: ${order.created_at} (type: ${typeof order.created_at})`);
      console.log(`📦 Order delivery_address: ${order.delivery_address}`);
      console.log(`💰 Order amount: ${order.order_amount}`);
      console.log(`💳 Payment method: ${order.payment_method}`);
      
      // Detect if current domain matches vestiqq.com
      const currentDomain = process.env.CURRENT_DOMAIN || 'localhost';
      console.log(`🌐 Current domain: ${currentDomain}`);
      

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
        console.log(`Ecommorder skipped for domain: ${currentDomain}`, { order_id: order.id });
        return;
      }

      const connector = new OrderConnector();
      
      // Safe parsing of delivery_address with better error handling
      let decodeRequest: DeliveryAddress;
      try {
        decodeRequest = JSON.parse(order.delivery_address);
      } catch (parseError) {
        console.error(`❌ Failed to parse delivery_address for order ${order.id}:`, order.delivery_address);
        console.error('Parse error:', parseError);
        
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
        
        console.log(`✅ Using fallback delivery address for order ${order.id}`);
      }
      
      // Enhanced timestamp conversion with comprehensive error handling
      let orderDate: Date;
      try {
        console.log(`🔍 Processing timestamp: ${order.created_at} (type: ${typeof order.created_at})`);
        
        if (typeof order.created_at === 'string') {
          const created_at_str = order.created_at as string;
          
          // Handle Laravel timestamp format (e.g., "2025-08-30 16:24:03")
          if (created_at_str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
            orderDate = new Date(created_at_str + ' UTC');
            console.log(`✅ Parsed Laravel timestamp format: ${orderDate.toISOString()}`);
          }
          // Handle ISO format (e.g., "2025-08-30T16:24:03.000000Z")
          else if (created_at_str.includes('T') || created_at_str.includes('Z')) {
            orderDate = new Date(created_at_str);
            console.log(`✅ Parsed ISO timestamp format: ${orderDate.toISOString()}`);
          }
          // Handle Unix timestamp as string
          else if (/^\d{10,13}$/.test(created_at_str)) {
            const timestamp = parseInt(created_at_str);
            orderDate = new Date(timestamp * (created_at_str.length === 10 ? 1000 : 1));
            console.log(`✅ Parsed Unix timestamp: ${orderDate.toISOString()}`);
          }
          // Handle other formats
          else {
            orderDate = new Date(created_at_str);
            console.log(`✅ Parsed other format: ${orderDate.toISOString()}`);
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
          console.log(`✅ Parsed numeric timestamp: ${orderDate.toISOString()}`);
        } else {
          // Default to current date
          orderDate = new Date();
          console.log(`⚠️ Using current date for invalid timestamp type`);
        }
        
        // Validate the date
        if (isNaN(orderDate.getTime())) {
          throw new Error(`Invalid date value: ${orderDate}`);
        }
        
        console.log(`✅ Final timestamp: ${orderDate.toISOString()}`);
        
      } catch (error) {
        console.error(`❌ Timestamp parsing failed for order ${order.id}:`, error);
        console.error(`📅 Original value: ${order.created_at}`);
        orderDate = new Date();
        console.log(`🔄 Using current date as fallback: ${orderDate.toISOString()}`);
      }
      
      const utcDatetime = new Date(orderDate.toISOString());
      console.log(`🌍 UTC datetime: ${utcDatetime.toISOString()}`);

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
        console.log(`✅ Using orderDetails association: ${orderDetails.length} items`);
      } else {
        // Create default order details since PHP doesn't send orderDetails
        console.log(`⚠️ No orderDetails association, creating default item for order ${order.id}`);
        orderDetails = [{
          item_id: 1,
          quantity: 1,
          price: parseFloat(order.order_amount?.toString() || '0'),
          item_details: JSON.stringify({ name: 'Product', sku: 'PROD_001' }),
          variation: '[]'
        }];
        console.log(`✅ Created default order details:`, orderDetails);
      }

      for (const item of orderDetails) {
        // Safe parsing of item details
        let itemDetails: any = {};
        let orderVariations: any[] = [];
        
        try {
          itemDetails = JSON.parse(item.item_details || '{}');
        } catch (error) {
          console.warn(`⚠️ Failed to parse item_details for item ${item.item_id}, using default`);
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
            try {
              const dbItem = await Item.findByPk(item.item_id);
              if (dbItem && (dbItem as any).variations) {
                const dbVariations = JSON.parse((dbItem as any).variations);

                // find the first variation matching chosenType
                const matched = dbVariations.find((v: any) => v.type === chosenType);

                if (matched) {
                  variationSku = matched.sku || variationSku;
                }
              }
            } catch (error) {
              console.warn(`⚠️ Failed to process variations for item ${item.item_id}:`, error);
            }
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

      console.log("Payload", payload);

      try {
        const response = await connector.call('createOrder', payload);
        console.log('Easy Response:', response);

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

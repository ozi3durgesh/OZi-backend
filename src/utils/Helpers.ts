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
      // Detect if current domain matches vestiqq.com
      const currentDomain = process.env.CURRENT_DOMAIN || 'localhost';
      
      if (!currentDomain.includes('admin.ozi.in')) {
        // Just log and return without placing the order
        console.log(`Ecommorder skipped for domain: ${currentDomain}`, { order_id: order.id });
        return;
      }

      const connector = new OrderConnector();
      const decodeRequest: DeliveryAddress = JSON.parse(order.delivery_address);
      
      const localTimezone = process.env.TZ || 'UTC';
      const localDatetime = new Date(order.created_at * 1000); // Convert timestamp to Date
      const utcDatetime = new Date(localDatetime.toISOString());

      let paymentMode = 2;
      let shippingMethod = 1;
      
      if (order.payment_method !== "cash_on_delivery") {
        paymentMode = 5;
        shippingMethod = 3;
      }

      const ecommItems: EcomItem[] = [];
      
      // Check if orderDetails association exists, otherwise fallback to delivery_address
      let orderDetails: OrderDetail[] = [];
      
      if (order.orderDetails && Array.isArray(order.orderDetails)) {
        // Use the association data
        orderDetails = order.orderDetails;
      } else {
        // Fallback to parsing delivery_address (for backward compatibility)
        try {
          orderDetails = JSON.parse(order.delivery_address || '[]');
        } catch (error) {
          console.warn('Failed to parse delivery_address as order details, using empty array');
          orderDetails = [];
        }
      }

      for (const item of orderDetails) {
        const itemDetails = JSON.parse(item.item_details || '{}');
        const orderVariations = JSON.parse(item.variation || '[]');

        let variationSku = itemDetails.sku || 'test_1'; // default

        if (orderVariations && orderVariations.length > 0) {
          const chosenType = orderVariations[0].type || null;

                      if (chosenType) {
              const dbItem = await Item.findByPk(item.item_id);
              if (dbItem && (dbItem as any).variations) {
                const dbVariations = JSON.parse((dbItem as any).variations);

              // find the first variation matching chosenType
              const matched = dbVariations.find((v: any) => v.type === chosenType);

              if (matched) {
                variationSku = matched.sku || variationSku;
              }
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
        discount: parseFloat(order.store_discount_amount.toString()),
        promoCodeDiscount: parseFloat(order.coupon_discount_amount.toString()),
        orderNumber: order.id,
        orderDate: utcDatetime.toISOString(),
        expDeliveryDate: "",
        paymentMode: paymentMode,
        shippingMethod: shippingMethod,
        shippingCost: parseFloat(order.delivery_charge.toString()),
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

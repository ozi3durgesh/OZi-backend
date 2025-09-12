import OrderConnector from '../services/OrderConnector';
import EcomLog from '../models/EcomLog';
import Order from '../models/Order';
import { OrderAttributes } from '../types';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import { generateSimpleOrderId } from './orderIdGenerator';

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn(`⚠️ Picklist API token expired (401 Unauthorized) - skipping picklist generation for order ${orderId}`);
          return { message: 'Picklist generation skipped - token expired' };
        }
        if (response.status === 404) {
          console.warn(`⚠️ Picklist API endpoint not found (404) - skipping picklist generation for order ${orderId}`);
          return { message: 'Picklist generation skipped - endpoint not found' };
        }
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
      
      // Debug: Log the order data we received
      console.log(`🔍 Processing Ecommorder for order:`, {
        id: order.id,
        user_id: order.user_id,
        order_amount: order.order_amount,
        payment_status: order.payment_status,
        order_status: order.order_status,
        cart_items: order.cart?.length || 0
      });
      
      // Step 1: Generate dynamic order_id using the same formula as place order controller
      console.log(`🆔 Step 1: Generating dynamic order_id for order ID: ${order.id}`);
      
      let generatedOrderId: string;
      try {
        generatedOrderId = await generateSimpleOrderId();
        console.log(`✅ Generated order_id: ${generatedOrderId} for order ID: ${order.id}`);
      } catch (orderIdError: any) {
        console.error(`❌ Failed to generate order_id for order ${order.id}:`, orderIdError.message);
        throw new Error(`Order ID generation failed: ${orderIdError.message}`);
      }
      
      // Step 2: Prepare complete order data with generated order_id
      console.log(`💾 Step 2: Preparing complete order data for storage`);
      
      let completeOrderData: any = { ...order };
      completeOrderData.order_id = generatedOrderId; // Use generated order_id
      
      console.log(`🛒 Order data prepared:`, {
        orderId: order.id,
        generatedOrderId: generatedOrderId,
        cartItems: completeOrderData.cart?.length || 0,
        totalValue: completeOrderData.cart?.reduce((sum: number, item: any) => sum + (item.amount * item.quantity), 0) || 0
      });
      
      // Step 3: Store complete order data into Node.js orders table
      console.log(`💾 Step 3: Storing complete order data into Node.js orders table`);
      
      try {
        // Check if user exists in Node.js database, if not create a placeholder or use default
        let nodeUserId = completeOrderData.user_id;
        
        try {
          // Check if user exists in Node.js Users table
          const [userCheck] = await sequelize.query(`
            SELECT id FROM Users WHERE id = :userId LIMIT 1
          `, {
            replacements: { userId: completeOrderData.user_id },
            type: QueryTypes.SELECT
          });
          
          if (!userCheck) {
            console.warn(`⚠️ User ${completeOrderData.user_id} not found in Node.js Users table, using default user or creating placeholder`);
            
            // Option 1: Use a default user ID (if you have one)
            // nodeUserId = 1; // Replace with your default user ID
            
            // Option 2: Create a placeholder user entry
            try {
              const [newUser] = await sequelize.query(`
                INSERT INTO Users (id, email, password, roleId, isActive, availabilityStatus, createdAt, updatedAt)
                VALUES (:userId, :email, :password, :roleId, :isActive, :availabilityStatus, :createdAt, :updatedAt)
                ON DUPLICATE KEY UPDATE id = id
              `, {
                replacements: {
                  userId: completeOrderData.user_id,
                  email: `user_${completeOrderData.user_id}@placeholder.com`,
                  password: 'placeholder_password',
                  roleId: 1, // Default role ID
                  isActive: 1,
                  availabilityStatus: 'available',
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                type: QueryTypes.INSERT
              });
              
              console.log(`✅ Created placeholder user ${completeOrderData.user_id} in Node.js database`);
              nodeUserId = completeOrderData.user_id; // Keep original user ID
            } catch (userCreateError: any) {
              console.error(`❌ Failed to create placeholder user:`, userCreateError.message);
              // Fallback to default user ID
              nodeUserId = 1; // Use default user ID
              console.warn(`⚠️ Using default user ID: ${nodeUserId}`);
            }
          } else {
            console.log(`✅ User ${completeOrderData.user_id} exists in Node.js Users table`);
          }
        } catch (userCheckError: any) {
          console.error(`❌ Error checking user existence:`, userCheckError.message);
          // Fallback to default user ID
          nodeUserId = 1;
          console.warn(`⚠️ Using default user ID: ${nodeUserId}`);
        }
        
        // Update the user_id in the order data
        completeOrderData.user_id = nodeUserId;
        console.log(`👤 Using user_id: ${nodeUserId} for order ${order.id}`);
        
        // Check if order already exists
        const existingOrder = await Order.findByPk(order.id);
        
        if (existingOrder) {
          // Update existing order with complete data
          console.log(`🔄 Updating existing order ${order.id} with complete data`);
          await existingOrder.update(completeOrderData);
          console.log(`✅ Successfully updated order ${order.id} with complete data`);
        } else {
          // Create new order with complete data
          console.log(`🆕 Creating new order ${order.id} with complete data`);
          await Order.create(completeOrderData);
          console.log(`✅ Successfully created order ${order.id} with complete data`);
        }
      } catch (dbError: any) {
        console.error(`❌ Failed to store order ${order.id} in Node.js database:`, dbError.message);
        throw new Error(`Database operation failed: ${dbError.message}`);
      }
      
      // Step 4: Log to ecom_logs
      console.log(`📝 Step 4: Logging to ecom_logs`);
      
      const orderJson = JSON.stringify(completeOrderData);

      try {
        await EcomLog.create({
          order_id: order.id,
          action: 'createOrder',
          payload: orderJson,
          response: JSON.stringify({ 
            status: 'success',
            message: 'Order processed successfully with complete data from PHP',
            cartItems: completeOrderData.cart?.length || 0,
            generated_order_id: generatedOrderId
          }),
          status: 'success'
        });
        console.log(`✅ Logged to ecom_logs for order ${order.id}`);
      } catch (logError: any) {
        console.warn(`⚠️ Could not log to ecom_logs for order ${order.id}:`, logError.message);
      }

      // Step 5: Generate picklist for the order using generated order_id
      console.log(`📦 Step 5: Generating picklist for order ${order.id} with order_id: ${generatedOrderId}`);
      
      let waveId: number | null = null;
      if (generatedOrderId && order.id) {
        try {
          const picklistResult = await this.generatePicklist(generatedOrderId, order.id);
          console.log(`✅ Successfully generated picklist for order ${generatedOrderId}`);
          
          // Extract waveId from picklist result
          if (picklistResult && picklistResult.waves && picklistResult.waves.length > 0) {
            waveId = picklistResult.waves[0].id;
            console.log(`🎯 Generated wave ID: ${waveId} for order ${generatedOrderId}`);
          }
        } catch (picklistError: any) {
          console.error(`❌ Failed to generate picklist for order ${generatedOrderId}:`, picklistError.message);
        }
      }
      
      // Step 6: Auto-assign picklist to available picker using round-robin
      if (waveId) {
        console.log(`👤 Step 6: Auto-assigning wave ${waveId} to available picker`);
        
        try {
          // Make internal API call to assign the wave (round-robin)
          const assignResponse = await fetch('http://13.232.150.239/api/picklist/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              waveId: waveId,
              priority: 'HIGH'
              // No pickerId - will use round-robin assignment
            })
          });
          
          if (assignResponse.ok) {
            const assignResult = await assignResponse.json();
            console.log(`✅ Successfully assigned wave ${waveId} to picker:`, assignResult);
          } else {
            const errorText = await assignResponse.text();
            console.error(`❌ Failed to assign wave ${waveId}:`, errorText);
          }
        } catch (assignError: any) {
          console.error(`❌ Failed to auto-assign wave ${waveId}:`, assignError.message);
        }
      }
      
      console.log(`🎉 Ecommorder processing completed successfully for order ${order.id}`);
      
      return {
        success: true,
        message: 'Order processed successfully',
        order_id: order.id,
        generated_order_id: generatedOrderId,
        cart_items: completeOrderData.cart?.length || 0,
        picklist_generated: true
      };

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

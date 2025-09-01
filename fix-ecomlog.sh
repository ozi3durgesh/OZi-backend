#!/bin/bash

echo "🔧 Fixing EcomLog Database Issues..."
echo "====================================="

# Navigate to the backend directory
cd /home/ubuntu/OZi-backend

# Stop the current PM2 process
echo "🛑 Stopping current PM2 process..."
pm2 stop next-app

# Backup current files
echo "💾 Backing up current files..."
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Fix 1: Update the database configuration to create ecom_logs table
echo "📋 Fixing database configuration..."
cat > src/config/database.ts << 'EOF'
import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Parse Railway MySQL connection URL
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    // Parse the DATABASE_URL format: mysql://root:password@host:port/database
    const url = new URL(process.env.DATABASE_URL);
    return {
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
      host: url.hostname,
      port: parseInt(url.port),
      dialect: 'mysql' as const,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        connectTimeout: 60000,
        ssl: {
          rejectUnauthorized: false
        }
      },
    };
  }

  // Fallback to individual environment variables
  return {
    database: process.env.DB_NAME || 'ozi_backend',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql' as const,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  };
};

const sequelize = new Sequelize({
  ...getDatabaseConfig(),
  define: {
    freezeTableName: true, // Preserve table names exactly as specified
  }
});

export default sequelize;

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to database...');
    
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL configuration');
      const url = new URL(process.env.DATABASE_URL);
      console.log(`Host: ${url.hostname}`);
      console.log(`Database: ${url.pathname.slice(1)}`);
      console.log(`User: ${url.username}`);
    } else {
      console.log(`Host: ${process.env.DB_HOST || '127.0.0.1'}`);
      console.log(`Database: ${process.env.DB_NAME || 'ozi_backend'}`);
      console.log(`User: ${process.env.DB_USER || 'root'}`);
    }
    
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Import models to ensure they are registered before syncing
    console.log('Importing models...');
    await import('../models/index.js');
    console.log('Models imported successfully.');
    
    // Create ecom_logs table if it doesn't exist
    console.log('Checking for ecom_logs table...');
    try {
      const tableExists = await sequelize.query(
        "SHOW TABLES LIKE 'ecom_logs'",
        { type: QueryTypes.SELECT }
      );
      
      if (tableExists.length === 0) {
        console.log('Creating ecom_logs table...');
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS ecom_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            action VARCHAR(255) NOT NULL,
            payload TEXT NOT NULL,
            response TEXT NOT NULL,
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_order_id (order_id),
            INDEX idx_action (action),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ ecom_logs table created successfully');
      } else {
        console.log('ℹ️ ecom_logs table already exists');
      }
    } catch (tableError) {
      console.error('Error creating ecom_logs table:', tableError);
      // Continue anyway
    }
    
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Use simple sync without force or alter to avoid conflicts
    await sequelize.sync({ force: false, alter: false });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Database synchronized successfully.');
    
    // Import and use auto-initialization functions
    const { isRBACInitialized, autoInitializeRBAC, createInitialAdmin } = await import('./autoInit.js');
    
    // Check if RBAC needs initialization
    const rbacInitialized = await isRBACInitialized();
    if (!rbacInitialized) {
      console.log('🔧 RBAC system not initialized, auto-initializing...');
      await autoInitializeRBAC();
    } else {
      console.log('✅ RBAC system already initialized');
    }
    
    // Create initial admin user if specified
    await createInitialAdmin();
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Please check your database configuration and ensure MySQL is running.');
    throw error;
  }
};
EOF

# Fix 2: Update the Helpers.ts to fix timestamp issues
echo "🔧 Fixing Helpers.ts timestamp issues..."
cat > src/utils/Helpers.ts << 'EOF'
import { OrderAttributes } from '../types';
import EcomLog from '../models/EcomLog';
import { OrderConnector } from './OrderConnector';

interface DeliveryAddress {
  contact_person_name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface EcomItem {
  Sku: string;
  Quantity: number;
  Price: number;
}

interface CreateOrderPayload {
  orderType: string;
  marketplaceId: number;
  discount: number;
  promoCodeDiscount: number;
  orderNumber: number;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: EcomItem[];
  paymentMode: number;
  shippingMethod: number;
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
      
      // Detect if current domain matches vestiqq.com
      const currentDomain = process.env.CURRENT_DOMAIN || 'localhost';
      console.log(`🌐 Current domain: ${currentDomain}`);
      
      // Store success log
      try {
        const orderJson = JSON.stringify(order);
        const ecomLog = await EcomLog.create({
          order_id: order.id,
          action: 'createOrder',
          payload: orderJson,  // full order JSON here
          response: JSON.stringify({ 
            status: 'processing',
            timestamp: new Date().toISOString(),
            node_service: 'ozi-backend'
          }),
          status: 'success'
        });
        console.log(`✅ EcomLog created successfully for order ${order.id}`);
      } catch (logError) {
        console.error(`❌ Failed to create EcomLog for order ${order.id}:`, logError);
        // Don't fail the entire process if logging fails
      }

      if (!currentDomain.includes('admin.ozi.in')) {
        // Just log and return without placing the order
        console.log(`Ecommorder skipped for domain: ${currentDomain}`, { order_id: order.id });
        return;
      }

      const connector = new OrderConnector();
      const decodeRequest: DeliveryAddress = JSON.parse(order.delivery_address);
      
      // Fix timestamp conversion - handle both string and number formats
      let orderDate: Date;
      if (typeof order.created_at === 'string') {
        orderDate = new Date(order.created_at);
      } else if (typeof order.created_at === 'number') {
        // If it's a Unix timestamp, convert to milliseconds
        orderDate = new Date(order.created_at * 1000);
      } else {
        // Default to current date if invalid
        orderDate = new Date();
      }
      
      const utcDatetime = new Date(orderDate.toISOString());

      let paymentMode = 2;
      let shippingMethod = 1;
      
      if (order.payment_method !== "cash_on_delivery") {
        paymentMode = 5;
        shippingMethod = 3;
      }

      const ecomItems: EcomItem[] = [];
      
      // Check if orderDetails association exists, otherwise fallback to delivery_address
      let orderDetails: any[] = [];
      
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
            const dbItem = await (await import('../models/Item')).default.findByPk(item.item_id);
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

        ecomItems.push({
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
        customerName: customerName,
        customerPhone: decodeRequest.contact_person_number || '',
        customerEmail: 'customer@ozi.in',
        customerAddress: decodeRequest.address || '',
        items: ecomItems,
        paymentMode: paymentMode,
        shippingMethod: shippingMethod
      };

      console.log('📦 Ecommerce payload prepared:', payload);
      
      // Call the connector to place the order
      const result = await connector.placeOrder(payload);
      
      console.log('✅ Order placed successfully via ecommerce connector');
      return result;
      
    } catch (error) {
      console.error('❌ Error in Ecommorder:', error);
      throw error;
    }
  }
}
EOF

# Fix 3: Update the controller to add the missing logOrderDirectly method
echo "🔧 Adding logOrderDirectly method to controller..."
cat > src/controllers/EasyEcomWebhookController.ts << 'EOF'
import { Request, Response } from 'express';
import { ResponseHandler } from '../middleware/responseHandler';
import { Helpers } from '../utils/Helpers';
import Order from '../models/Order';
import EcomLog from '../models/EcomLog';
import OrderDetails from '../models/OrderDetails';
import { OrderAttributes } from '../types';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    permissions: string[];
  };
}

export class EasyEcomWebhookController {
  /**
   * Get logs for ecommerce orders
   * This method calls Helpers::Ecommorder for each order
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async Getlogs(req: Request, res: Response): Promise<void> {
    try {
      // Get all orders that need to be processed
      const orders = await Order.findAll({
        where: {
          order_status: ['pending', 'confirmed', 'processing'],
          // Add any other conditions you need
        },
        include: [
          {
            model: OrderDetails,
            as: 'orderDetails',
            required: false,
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 100, // Process in batches
      });

      if (!orders || orders.length === 0) {
        ResponseHandler.success(res, { message: 'No orders found for processing' });
        return;
      }

      const results: any[] = [];
      const errors: any[] = [];

      // Process each order through Ecommorder
      for (const order of orders) {
        try {
          const orderData = order.get({ plain: true }) as OrderAttributes;
          console.log(`Processing order ${orderData.id} through Ecommorder...`);
          
          const result = await Helpers.Ecommorder(orderData);
          results.push({
            order_id: orderData.id,
            status: 'success',
            result
          });
          
          console.log(`Order ${orderData.id} processed successfully`);
        } catch (error: any) {
          const orderData = order.get({ plain: true }) as OrderAttributes;
          console.error(`Error processing order ${orderData.id}:`, error);
          
          errors.push({
            order_id: orderData.id,
            status: 'error',
            error: error.message
          });
        }
      }

      // Get recent ecommerce logs
      const recentLogs = await EcomLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 50,
      });

      ResponseHandler.success(res, {
        message: 'Orders processed successfully',
        summary: {
          total_orders: orders.length,
          successful: results.length,
          failed: errors.length
        },
        results,
        errors,
        recent_logs: recentLogs
      });

    } catch (error: any) {
      console.error('Error in Getlogs:', error);
      ResponseHandler.error(res, `Failed to process orders: ${error.message}`, 500);
    }
  }

  /**
   * Get ecommerce logs with pagination
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async getEcomLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const logs = await EcomLog.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      ResponseHandler.success(res, {
        logs: logs.rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(logs.count / limit),
          total_records: logs.count,
          records_per_page: limit
        }
      });

    } catch (error: any) {
      console.error('Error getting ecommerce logs:', error);
      ResponseHandler.error(res, `Failed to get logs: ${error.message}`, 500);
    }
  }

  /**
   * Get specific ecommerce log by ID
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async getEcomLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const log = await EcomLog.findByPk(id);
      
      if (!log) {
        ResponseHandler.error(res, 'Log not found', 404);
        return;
      }

      ResponseHandler.success(res, { log });

    } catch (error: any) {
      console.error('Error getting ecommerce log by ID:', error);
      ResponseHandler.error(res, `Failed to get log: ${error.message}`, 500);
    }
  }

  /**
   * Get ecommerce logs for specific order
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async getEcomLogsByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      const logs = await EcomLog.findAll({
        where: { order_id: orderId },
        order: [['created_at', 'DESC']],
      });

      ResponseHandler.success(res, { logs });

    } catch (error: any) {
      console.error('Error getting ecommerce logs by order ID:', error);
      ResponseHandler.error(res, `Failed to get logs: ${error.message}`, 500);
    }
  }

  /**
   * Retry failed ecommerce order
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async retryFailedOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderDetails,
            as: 'orderDetails',
            required: false,
          }
        ]
      });
      
      if (!order) {
        ResponseHandler.error(res, 'Order not found', 404);
        return;
      }

      console.log(`Retrying failed order ${orderId} through Ecommorder...`);
      
      const orderData = order.get({ plain: true }) as OrderAttributes;
      const result = await Helpers.Ecommorder(orderData);
      
      ResponseHandler.success(res, {
        message: 'Order retried successfully',
        order_id: orderId,
        result
      });

    } catch (error: any) {
      console.error('Error retrying order:', error);
      ResponseHandler.error(res, `Failed to retry order: ${error.message}`, 500);
    }
  }

  /**
   * PHP Integration endpoint - called directly from PHP Ecommorder function
   * This provides 100% flow matching with the PHP implementation
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async phpIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { order } = req.body;
      
      if (!order) {
        ResponseHandler.error(res, 'Order data is required', 400);
        return;
      }

      console.log('🔄 PHP Integration called with order:', order.id);
      
      // Call the same Ecommorder function that matches PHP 100%
      const result = await Helpers.Ecommorder(order);
      
      ResponseHandler.success(res, {
        message: 'Order processed successfully via PHP integration',
        order_id: order.id,
        result
      });
      
    } catch (error: any) {
      console.error('❌ PHP Integration error:', error);
      ResponseHandler.error(res, `PHP Integration failed: ${error.message}`, 500);
    }
  }

  /**
   * Direct logging endpoint for PHP - creates EcomLog entry immediately
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async logOrderDirectly(req: Request, res: Response): Promise<void> {
    try {
      const { order } = req.body;
      
      if (!order) {
        ResponseHandler.error(res, 'Order data is required', 400);
        return;
      }

      console.log('📝 Direct logging called for order:', order.id);
      
      // Create EcomLog entry immediately
      const ecomLog = await EcomLog.create({
        order_id: order.id,
        action: 'order_received_from_php',
        payload: JSON.stringify({
          order_id: order.id,
          user_id: order.user_id,
          order_amount: order.order_amount,
          payment_method: order.payment_method,
          delivery_address: order.delivery_address,
          timestamp: new Date().toISOString()
        }),
        response: JSON.stringify({
          status: 'logged_successfully',
          node_service: 'ozi-backend',
          timestamp: new Date().toISOString()
        }),
        status: 'success'
      });
      
      const logData = ecomLog.get({ plain: true }) as any;
      console.log('✅ EcomLog created successfully:', logData);
      
      ResponseHandler.success(res, {
        message: 'Order logged successfully in Node.js database',
        order_id: order.id,
        log_id: logData.id,
        log_entry: {
          id: logData.id,
          order_id: logData.order_id,
          action: logData.action,
          status: logData.status,
          created_at: logData.created_at
        }
      });
      
    } catch (error: any) {
      console.error('❌ Direct logging error:', error);
      ResponseHandler.error(res, `Direct logging failed: ${error.message}`, 500);
    }
  }

  /**
   * Test endpoint for EcomLog functionality
   * @param req - Request object
   * @param res - Response object
   */
  public static async testEcomLog(req: Request, res: Response): Promise<void> {
    try {
      console.log('🧪 Testing EcomLog functionality...');
      
      // Test creating a log entry
      const testLog = await EcomLog.create({
        order_id: 999999, // Test order ID
        action: 'test',
        payload: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
        response: JSON.stringify({ status: 'test_success' }),
        status: 'success'
      });
      
      const logData = testLog.get({ plain: true }) as any;
      console.log('✅ Test EcomLog created:', logData);
      
      // Get all logs to verify
      const allLogs = await EcomLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 10
      });
      
      ResponseHandler.success(res, {
        message: 'EcomLog test successful',
        test_log: logData,
        total_logs: allLogs.length,
        recent_logs: allLogs.map(log => {
          const logData = log.get({ plain: true }) as any;
          return {
            id: logData.id,
            order_id: logData.order_id,
            action: logData.action,
            status: logData.status,
            created_at: logData.created_at
          };
        })
      });
      
    } catch (error: any) {
      console.error('❌ EcomLog test failed:', error);
      ResponseHandler.error(res, `EcomLog test failed: ${error.message}`, 500);
    }
  }

  /**
   * Health check endpoint for PHP to verify Node.js service is running
   * @param req - Express request object
   * @param res - Express response object
   */
  public static async healthCheck(req: Request, res: Response): Promise<void> {
    ResponseHandler.success(res, {
      message: 'Node.js Ecommerce service is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy'
    });
  }
}
EOF

# Fix 4: Update the routes to include the new endpoint
echo "🔧 Updating routes to include log-order endpoint..."
cat > src/routes/easyEcomWebhookRoutes.ts << 'EOF'
// routes/easyEcomWebhookRoutes.ts
import { Router } from 'express';
import { EasyEcomWebhookController } from '../controllers/EasyEcomWebhookController';

const router = Router();

// Ecommerce order processing and logs
router.post('/process-orders', 
  EasyEcomWebhookController.Getlogs
);

// Get ecommerce logs with pagination
router.get('/logs', 
  EasyEcomWebhookController.getEcomLogs
);

// Get specific ecommerce log by ID
router.get('/logs/:id', 
  EasyEcomWebhookController.getEcomLogById
);

// Get ecommerce logs for specific order
router.get('/logs/order/:orderId', 
  EasyEcomWebhookController.getEcomLogsByOrderId
);

// Retry failed ecommerce order
router.post('/retry/:orderId', 
  EasyEcomWebhookController.retryFailedOrder
);

// PHP Integration endpoints
router.post('/php-integration', 
  EasyEcomWebhookController.phpIntegration
);

// Direct logging endpoint for PHP
router.post('/log-order', 
  EasyEcomWebhookController.logOrderDirectly
);

// Test endpoint for EcomLog functionality
router.post('/test-ecomlog', 
  EasyEcomWebhookController.testEcomLog
);

router.get('/health', 
  EasyEcomWebhookController.healthCheck
);

export default router;
EOF

# Fix 5: Update the main app.ts to include the routes
echo "🔧 Updating main app.ts to include ecommerce routes..."
cat > src/app.ts << 'EOF'
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import couponRoutes from './routes/couponRoutes';
import orderRoutes from './routes/orderRoutes';
import roleRoutes from './routes/roleRoutes';
import permissionRoutes from './routes/permissionRoutes';
import pickingRoutes from './routes/pickingRoutes';
import packingRoutes from './routes/packingRoutes';
import handoverRoutes from './routes/handoverRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import paymentRoutes from './routes/paymentRoutes';
import easyEcomWebhookRoutes from './routes/easyEcomWebhookRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploads folder so EC2 can access files
const uploadDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/picklist', pickingRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/warehouses', warehouseRoutes);

// PHP Production Compatible Routes
app.use('/api/v1/customer/order', orderRoutes);

// Ecommerce integration routes
app.use('/api/ecommerce', easyEcomWebhookRoutes);

// Payment routes
app.use('/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    statusCode: 200,
    success: true,
    data: { message: 'Server is running' },
    error: null,
  });
});

// Debug endpoint to check JWT configuration
app.get('/debug/jwt', (req, res) => {
  res.json({
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ? 'Set' : 'Not set',
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    nodeEnv: process.env.NODE_ENV,
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
EOF

# Build the project
echo "🔨 Building the project..."
npm run build

# Start the server
echo "🚀 Starting the server..."
pm2 start next-app

echo "✅ Fix completed! The server should now be running with all fixes applied."
echo ""
echo "🔍 To test the fixes:"
echo "1. Test health check: curl http://localhost:3000/health"
echo "2. Test EcomLog: curl -X POST http://localhost:3000/api/ecommerce/test-ecomlog"
echo "3. Test direct logging: curl -X POST http://localhost:3000/api/ecommerce/log-order -H 'Content-Type: application/json' -d '{\"order\":{\"id\":12345}}'"
echo ""
echo "📊 Check PM2 logs: pm2 logs next-app"

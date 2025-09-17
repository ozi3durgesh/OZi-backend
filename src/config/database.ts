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

const createReturnTables = async (): Promise<void> => {
  try {
    console.log('Creating return tables...');
    
    // Create return_request_items table (matches Sequelize model)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS return_request_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_order_id VARCHAR(50) NOT NULL,
        original_order_id VARCHAR(50) NOT NULL,
        customer_id INT NOT NULL,
        return_reason ENUM('defective_product','wrong_item','damaged_in_transit','not_as_described','size_issue','quality_issue','customer_changed_mind','duplicate_order','late_delivery','try_and_buy_not_satisfied','try_and_buy_expired','other') NOT NULL,
        status ENUM('pending','approved','pickup_scheduled','in_transit','received','qc_pending','qc_completed','refund_initiated','refunded','rejected','cancelled') NOT NULL DEFAULT 'pending',
        return_type ENUM('full_return','partial_return','exchange','try_and_buy_return') NOT NULL DEFAULT 'full_return',
        total_items_count INT NOT NULL DEFAULT '0',
        total_return_amount DECIMAL(10,2) NOT NULL DEFAULT '0.00',
        pidge_tracking_id VARCHAR(100) DEFAULT NULL,
        pickup_address JSON DEFAULT NULL,
        return_notes TEXT,
        images JSON DEFAULT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        item_details TEXT,
        variation VARCHAR(255) DEFAULT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT '0.00',
        item_images JSON DEFAULT NULL,
        item_notes TEXT,
        qc_status ENUM('pending','passed','failed','needs_repair','disposal') NOT NULL DEFAULT 'pending',
        qc_notes TEXT,
        qc_by INT DEFAULT NULL,
        qc_at BIGINT DEFAULT NULL,
        timeline_events JSON DEFAULT NULL,
        last_event_type ENUM('created','approved','pickup_scheduled','picked_up','in_transit','received','qc_started','qc_completed','grn_created','putaway_started','putaway_completed','refund_initiated','refunded','rejected','cancelled','status_updated') NOT NULL DEFAULT 'created',
        last_event_notes TEXT,
        last_event_metadata JSON DEFAULT NULL,
        is_try_and_buy TINYINT NOT NULL DEFAULT '0',
        customer_feedback TEXT,
        overall_rating INT DEFAULT NULL,
        item_feedback TEXT,
        item_rating INT DEFAULT NULL,
        try_and_buy_reason VARCHAR(50) DEFAULT NULL,
        grn_id VARCHAR(50) DEFAULT NULL,
        grn_status VARCHAR(50) DEFAULT NULL,
        received_quantity INT DEFAULT NULL,
        expected_quantity INT DEFAULT NULL,
        qc_pass_qty INT DEFAULT NULL,
        qc_fail_qty INT DEFAULT NULL,
        putaway_status VARCHAR(50) DEFAULT NULL,
        bin_location_id VARCHAR(50) DEFAULT NULL,
        putaway_by INT DEFAULT NULL,
        putaway_at BIGINT DEFAULT NULL,
        putaway_notes TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        created_by INT NOT NULL,
        is_active TINYINT NOT NULL DEFAULT '1',
        PRIMARY KEY (id),
        UNIQUE KEY return_order_id (return_order_id),
        KEY original_order_id (original_order_id),
        KEY customer_id (customer_id),
        KEY status (status),
        KEY item_id (item_id),
        KEY qc_status (qc_status),
        KEY is_try_and_buy (is_try_and_buy),
        KEY grn_id (grn_id),
        KEY putaway_status (putaway_status),
        KEY created_at (created_at),
        CONSTRAINT return_request_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES Users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT return_request_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES Users (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    
    // Create return_reject_grn table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS return_reject_grn (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Return Request References
        return_order_id VARCHAR(100) NOT NULL,
        return_request_item_id INT NOT NULL,
        original_order_id VARCHAR(100) NOT NULL,
        customer_id INT NOT NULL,
        
        -- Product Details
        item_id INT NOT NULL,
        sku_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255),
        product_category VARCHAR(100),
        product_brand VARCHAR(100),
        product_mrp DECIMAL(10,2),
        product_cost DECIMAL(10,2),
        
        -- Return Details
        return_type ENUM('full_return', 'partial_return', 'exchange', 'try_and_buy_return') NOT NULL,
        return_reason VARCHAR(100) NOT NULL,
        original_quantity INT NOT NULL,
        rejected_quantity INT NOT NULL,
        original_price DECIMAL(10,2) NOT NULL,
        
        -- Rejection Details
        rejection_reason VARCHAR(255) NOT NULL,
        rejection_notes TEXT,
        rejection_category ENUM('damaged', 'defective', 'wrong_item', 'quality_issue', 'expired', 'other') NOT NULL,
        rejection_severity ENUM('minor', 'major', 'critical') DEFAULT 'minor',
        
        -- Photo References
        photo_urls JSON,
        photo_count INT DEFAULT 0,
        
        -- GRN Details
        grn_id VARCHAR(100) NOT NULL,
        grn_notes TEXT,
        grn_status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
        
        -- Processing Details
        processed_by INT NOT NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Try and Buy Specific
        is_try_and_buy BOOLEAN DEFAULT FALSE,
        try_and_buy_feedback TEXT,
        try_and_buy_rating INT,
        
        -- Additional Metadata
        item_details TEXT,
        variation VARCHAR(255),
        customer_feedback TEXT,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        INDEX idx_return_order_id (return_order_id),
        INDEX idx_return_request_item_id (return_request_item_id),
        INDEX idx_original_order_id (original_order_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_item_id (item_id),
        INDEX idx_sku_id (sku_id),
        INDEX idx_grn_id (grn_id),
        INDEX idx_rejection_category (rejection_category),
        INDEX idx_grn_status (grn_status),
        INDEX idx_processed_by (processed_by),
        INDEX idx_created_at (created_at),
        INDEX idx_is_try_and_buy (is_try_and_buy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    
    console.log('✅ Return tables created successfully');
  } catch (error) {
    console.error('Error creating return tables:', error);
    // Continue anyway
  }
};

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
                 
                 // Remove any existing foreign key constraints
                 try {
                   const constraints = await sequelize.query(
                     "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'ozi_backend' AND TABLE_NAME = 'ecom_logs' AND REFERENCED_TABLE_NAME IS NOT NULL",
                     { type: QueryTypes.SELECT }
                   );
                   
                   for (const constraint of constraints) {
                     const constraintName = (constraint as any).CONSTRAINT_NAME;
                     await sequelize.query(`ALTER TABLE ecom_logs DROP FOREIGN KEY ${constraintName}`);
                     console.log(`✅ Removed foreign key constraint: ${constraintName}`);
                   }
                 } catch (error) {
                   console.log('ℹ️ No foreign key constraints to remove');
                 }
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
    
    // Create return tables manually to avoid schema conflicts
    await createReturnTables();
    
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
    
    // Setup inventory system if not already initialized
    try {
      const { setupInventorySystem } = await import('../script/setupInventorySystem.js');
      await setupInventorySystem();
    } catch (inventoryError) {
      console.log('ℹ️ Inventory system setup skipped (may already exist)');
    }
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Please check your database configuration and ensure MySQL is running.');
    throw error;
  }
};
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
    
    // Create return_requests table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS return_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_order_id VARCHAR(50) NOT NULL UNIQUE,
        original_order_id VARCHAR(50) NOT NULL,
        customer_id INT NOT NULL,
        return_reason ENUM('defective_product', 'wrong_item', 'damaged_in_transit', 'not_as_described', 'size_issue', 'quality_issue', 'customer_changed_mind', 'duplicate_order', 'late_delivery', 'try_and_buy_not_satisfied', 'try_and_buy_expired', 'other') NOT NULL,
        status ENUM('pending', 'approved', 'pickup_scheduled', 'in_transit', 'received', 'qc_pending', 'qc_completed', 'refund_initiated', 'refunded', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
        return_type ENUM('full_return', 'partial_return', 'exchange', 'try_and_buy_return') NOT NULL DEFAULT 'full_return',
        total_items_count INT NOT NULL DEFAULT 0,
        total_return_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        pidge_tracking_id VARCHAR(100) NULL,
        pickup_address JSON NULL,
        return_notes TEXT NULL,
        images JSON NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        created_by INT NOT NULL,
        is_active TINYINT NOT NULL DEFAULT 1,
        INDEX idx_return_order_id (return_order_id),
        INDEX idx_original_order_id (original_order_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_status (status),
        INDEX idx_pidge_tracking_id (pidge_tracking_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Create return_items table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_request_id INT NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        return_reason ENUM('defective_product', 'wrong_item', 'damaged_in_transit', 'not_as_described', 'size_issue', 'quality_issue', 'customer_changed_mind', 'duplicate_order', 'late_delivery', 'try_and_buy_not_satisfied', 'try_and_buy_expired', 'other') NOT NULL,
        item_details TEXT NULL,
        variation VARCHAR(255) NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        images JSON NULL,
        notes TEXT NULL,
        qc_status ENUM('pending', 'passed', 'failed', 'needs_repair', 'disposal') NOT NULL DEFAULT 'pending',
        qc_notes TEXT NULL,
        qc_by INT NULL,
        qc_at BIGINT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        is_active TINYINT NOT NULL DEFAULT 1,
        INDEX idx_return_request_id (return_request_id),
        INDEX idx_item_id (item_id),
        INDEX idx_qc_status (qc_status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Create return_timeline table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS return_timeline (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_request_id INT NOT NULL,
        event_type ENUM('created', 'approved', 'pickup_scheduled', 'picked_up', 'in_transit', 'received', 'qc_started', 'qc_completed', 'grn_created', 'putaway_started', 'putaway_completed', 'refund_initiated', 'refunded', 'rejected', 'cancelled', 'status_updated') NOT NULL,
        status ENUM('pending', 'approved', 'pickup_scheduled', 'in_transit', 'received', 'qc_pending', 'qc_completed', 'refund_initiated', 'refunded', 'rejected', 'cancelled') NULL,
        notes TEXT NULL,
        metadata JSON NULL,
        created_at BIGINT NOT NULL,
        created_by INT NULL,
        INDEX idx_return_request_id (return_request_id),
        INDEX idx_event_type (event_type),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Please check your database configuration and ensure MySQL is running.');
    throw error;
  }
};
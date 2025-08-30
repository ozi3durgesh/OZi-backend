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
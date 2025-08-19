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
        acquireTimeout: 60000,
        timeout: 60000,
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
      acquireTimeout: 60000,
      timeout: 60000,
    },
  };
};

const sequelize = new Sequelize(getDatabaseConfig());

// Function to safely clean up existing foreign key constraints
const cleanupForeignKeys = async (): Promise<void> => {
  try {
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all tables in the database
    const [tables] = await sequelize.query("SHOW TABLES");
    
    for (const table of tables as any[]) {
      const tableName = Object.values(table)[0];
      
      // Get foreign key constraints for this table
      const constraints = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `, {
        replacements: [tableName],
        type: QueryTypes.SELECT
      });
      
      // Drop existing foreign key constraints
      for (const constraint of constraints as any[]) {
        const constraintName = constraint.CONSTRAINT_NAME;
        if (constraintName) {
          try {
            await sequelize.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${constraintName}\``);
            console.log(`Dropped foreign key constraint: ${constraintName} from table: ${tableName}`);
          } catch (dropError) {
            console.warn(`Could not drop constraint ${constraintName}:`, (dropError as Error).message);
          }
        }
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key constraints cleaned up successfully');
  } catch (error) {
    console.warn('Warning: Could not clean up foreign key constraints:', (error as Error).message);
    // Re-enable foreign key checks even if cleanup failed
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      console.warn('Could not re-enable foreign key checks');
    }
  }
};

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
    
    // Check if tables already exist to determine sync strategy
    const [results] = await sequelize.query("SHOW TABLES");
    const tableCount = results.length;
    
    if (tableCount === 0) {
      // No tables exist, safe to use force sync
      console.log('No existing tables found. Creating fresh database schema...');
      await sequelize.sync({ force: true });
      console.log('Database synchronized successfully with force sync.');
    } else if (process.env.FORCE_DB_RESET === 'true') {
      // Force reset database if environment variable is set
      console.log('FORCE_DB_RESET is enabled. Dropping all tables and recreating...');
      await sequelize.sync({ force: true });
      console.log('Database synchronized successfully with force reset.');
    } else {
      // Tables exist, clean up constraints and use alter mode
      console.log(`${tableCount} existing tables found. Cleaning up constraints and syncing...`);
      try {
        // Clean up existing foreign key constraints to avoid conflicts
        await cleanupForeignKeys();
        
        // Try to sync with alter mode
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully with alter sync.');
      } catch (syncError) {
        console.warn('Alter sync failed, attempting to continue with existing schema...');
        console.warn('Sync error details:', (syncError as Error).message);
        // Continue without sync - tables already exist
      }
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Please check your database configuration and ensure MySQL is running.');
    throw error;
  }
};
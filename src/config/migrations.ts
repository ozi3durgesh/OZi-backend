import sequelize from './database';
import { QueryTypes } from 'sequelize';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create ecom_logs table if it doesn't exist
    await createEcomLogsTable();
    
    // Create dc_inventory_1 table if it doesn't exist
    await createDCInventory1Table();
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const createEcomLogsTable = async (): Promise<void> => {
  try {
    // Check if table exists
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'ecom_logs'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('📋 Creating ecom_logs table...');
      
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
  } catch (error) {
    console.error('❌ Error creating ecom_logs table:', error);
    throw error;
  }
};

const createDCInventory1Table = async (): Promise<void> => {
  try {
    // Check if table exists
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'dc_inventory_1'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('📋 Creating dc_inventory_1 table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS dc_inventory_1 (
          id INT AUTO_INCREMENT PRIMARY KEY,
          catalogue_id VARCHAR(7) NOT NULL UNIQUE,
          po_raise_quantity INT NOT NULL DEFAULT 0,
          po_approve_quantity INT NOT NULL DEFAULT 0,
          sku_split JSON DEFAULT NULL,
          grn_done JSON DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_catalogue_id (catalogue_id),
          INDEX idx_po_raise_quantity (po_raise_quantity),
          INDEX idx_po_approve_quantity (po_approve_quantity)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ dc_inventory_1 table created successfully');
    } else {
      console.log('ℹ️ dc_inventory_1 table already exists');
    }
  } catch (error) {
    console.error('❌ Error creating dc_inventory_1 table:', error);
    throw error;
  }
};

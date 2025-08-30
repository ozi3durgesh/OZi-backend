import sequelize from './database';
import { QueryTypes } from 'sequelize';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create ecom_logs table if it doesn't exist
    await createEcomLogsTable();
    
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

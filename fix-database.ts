import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'ozi_backend',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'rLfcu9Y80S8X',
  host: process.env.DB_HOST || 'ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  logging: false
});

async function fixDatabase(): Promise<void> {
  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Check if ecom_logs table exists
    console.log('📋 Checking for ecom_logs table...');
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
    
    // Test inserting a record
    console.log('🧪 Testing EcomLog insertion...');
    await sequelize.query(`
      INSERT INTO ecom_logs (order_id, action, payload, response, status) 
      VALUES (999999, 'test', '{"test": true}', '{"status": "success"}', 'success')
    `);
    console.log('✅ Test record inserted successfully');
    
    // Verify the record
    const logs = await sequelize.query(
      'SELECT * FROM ecom_logs ORDER BY created_at DESC LIMIT 5',
      { type: QueryTypes.SELECT }
    );
    console.log('📊 Recent logs:', logs);
    
    console.log('🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
  } finally {
    await sequelize.close();
  }
}

fixDatabase();

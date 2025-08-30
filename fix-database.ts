import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection with hardcoded credentials for AWS RDS
const sequelize = new Sequelize({
  database: 'ozi_backend',
  username: 'admin',
  password: 'rLfcu9Y80S8X',
  host: 'ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com',
  port: 3306,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
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
    
    // Test EcomLog insertion with a valid order ID
    console.log('🧪 Testing EcomLog insertion...');
    
    // First, check if there are any existing orders to use for testing
    const existingOrders = await sequelize.query(
      "SELECT id FROM orders LIMIT 1",
      { type: QueryTypes.SELECT }
    );
    
    let testOrderId = 1; // Default fallback
    if (existingOrders.length > 0) {
      testOrderId = (existingOrders[0] as any).id;
      console.log(`📋 Using existing order ID: ${testOrderId} for testing`);
    } else {
      console.log('⚠️ No existing orders found, using default test ID: 1');
    }

    await sequelize.query(`
      INSERT INTO ecom_logs (order_id, action, payload, response, status) 
      VALUES (?, 'test', '{"test": true}', '{"status": "success"}', 'success')
    `, {
      replacements: [testOrderId],
      type: QueryTypes.INSERT
    });

    console.log('✅ Test EcomLog entry created successfully');
    
    // Verify the entry was created
    const testLogs = await sequelize.query(
      "SELECT * FROM ecom_logs ORDER BY created_at DESC LIMIT 1",
      { type: QueryTypes.SELECT }
    );
    
    if (testLogs.length > 0) {
      console.log('✅ Database verification successful');
      console.log('📊 Total ecom_logs entries:', testLogs.length);
    }

    console.log('🎉 Database fix completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

fixDatabase();

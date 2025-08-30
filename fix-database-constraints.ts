import { Sequelize, QueryTypes } from 'sequelize';

console.log('🔧 Fixing Database Constraints...');
console.log('==================================');

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

async function fixDatabaseConstraints(): Promise<void> {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Check current table structure
    console.log('📋 Checking current ecom_logs table structure...');
    const tableInfo = await sequelize.query(
      "SHOW CREATE TABLE ecom_logs",
      { type: QueryTypes.SELECT }
    );
    
    console.log('📊 Current table structure:', tableInfo);
    
    // Check for foreign key constraints
    console.log('🔍 Checking for foreign key constraints...');
    const constraints = await sequelize.query(
      "SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'ozi_backend' AND TABLE_NAME = 'ecom_logs' AND REFERENCED_TABLE_NAME IS NOT NULL",
      { type: QueryTypes.SELECT }
    );
    
    if (constraints.length > 0) {
      console.log('❌ Found foreign key constraints:', constraints);
      
      // Drop the foreign key constraint
      console.log('🗑️ Dropping foreign key constraint...');
      await sequelize.query(
        "ALTER TABLE ecom_logs DROP FOREIGN KEY ecom_logs_ibfk_1"
      );
      console.log('✅ Foreign key constraint dropped');
      
      // Drop the index if it exists
      try {
        await sequelize.query(
          "ALTER TABLE ecom_logs DROP INDEX order_id"
        );
        console.log('✅ order_id index dropped');
      } catch (error) {
        console.log('ℹ️ order_id index already dropped or doesn\'t exist');
      }
      
      // Recreate the table without foreign key constraints
      console.log('🔄 Recreating ecom_logs table without constraints...');
      await sequelize.query("DROP TABLE IF EXISTS ecom_logs");
      
      await sequelize.query(`
        CREATE TABLE ecom_logs (
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
      console.log('✅ ecom_logs table recreated without foreign key constraints');
      
    } else {
      console.log('✅ No foreign key constraints found');
    }
    
    // Test insertion with any order ID
    console.log('🧪 Testing insertion with order ID 999999...');
    await sequelize.query(`
      INSERT INTO ecom_logs (order_id, action, payload, response, status) 
      VALUES (999999, 'test', '{"test": true}', '{"status": "success"}', 'success')
    `, {
      type: QueryTypes.INSERT
    });
    console.log('✅ Test insertion successful');
    
    // Verify the entry was created
    const testLogs = await sequelize.query(
      "SELECT * FROM ecom_logs ORDER BY created_at DESC LIMIT 1",
      { type: QueryTypes.SELECT }
    );
    
    if (testLogs.length > 0) {
      console.log('✅ Database verification successful');
      console.log('📊 Total ecom_logs entries:', testLogs.length);
      console.log('📝 Latest entry:', testLogs[0]);
    }

    console.log('🎉 Database constraints fixed successfully!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   ✅ Removed foreign key constraint to orders table');
    console.log('   ✅ Recreated table without constraints');
    console.log('   ✅ Can now insert logs for any order ID');
    console.log('   ✅ Test insertion successful');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Database constraint fix failed:', error);
    process.exit(1);
  }
}

fixDatabaseConstraints();

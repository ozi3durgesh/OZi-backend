import { Sequelize, QueryTypes } from 'sequelize';

console.log('🧪 Testing Database Connection from Local Machine...');
console.log('==================================================');

// Test database connection with AWS RDS credentials
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

async function testConnection(): Promise<void> {
  try {
    console.log('🔌 Attempting to connect to AWS RDS...');
    console.log('   Host: ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com');
    console.log('   Database: ozi_backend');
    console.log('   User: admin');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    console.log('🧪 Testing basic query...');
    const result = await sequelize.query('SELECT 1 as test', { type: QueryTypes.SELECT });
    console.log('✅ Basic query successful:', result);
    
    // Check if ecom_logs table exists
    console.log('📋 Checking for ecom_logs table...');
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'ecom_logs'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('❌ ecom_logs table does NOT exist');
      console.log('💡 You need to run this script on your AWS server where the database is accessible');
    } else {
      console.log('✅ ecom_logs table exists');
    }
    
    console.log('🎉 Connection test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('1. Check if your IP is whitelisted in AWS RDS Security Group');
      console.log('2. Verify database credentials are correct');
      console.log('3. Ensure RDS instance is running and accessible');
      console.log('');
      console.log('💡 Solution: Run the database fix on your AWS server instead');
      console.log('   ssh ubuntu@13.232.150.239');
      console.log('   cd /home/ubuntu/OZi-backend');
      console.log('   ./deploy-all-fixes.sh');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the RDS endpoint is correct');
      console.log('3. Try pinging the host: ping ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com');
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testConnection();

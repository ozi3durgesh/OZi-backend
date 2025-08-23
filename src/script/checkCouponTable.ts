import sequelize from '../config/database';

async function checkCouponTable() {
  try {
    console.log('🔍 Checking coupons table structure...');
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get table info
    const [results] = await sequelize.query('DESCRIBE coupons');
    console.log('\n📋 Coupons table structure:');
    console.table(results);
    
    // Check if table exists and has data
    const [countResult] = await sequelize.query('SELECT COUNT(*) as count FROM coupons');
    console.log('\n📊 Total coupons in table:', countResult[0]);
    
    // Try to get one record to see the actual field names
    const [sampleResult] = await sequelize.query('SELECT * FROM coupons LIMIT 1');
    if (sampleResult.length > 0) {
      console.log('\n📝 Sample coupon record:');
      console.log(JSON.stringify(sampleResult[0], null, 2));
    } else {
      console.log('\n📝 No coupons found in table');
    }
    
  } catch (error) {
    console.error('❌ Error checking coupon table:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
checkCouponTable();

// scripts/testOrderLogging.ts
import axios from 'axios';
import { UniversalLog } from '../models';
import sequelize from '../config/database';

async function testOrderLogging() {
  try {
    console.log('Testing universal logging functionality...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if UniversalLog table exists and has records
    const logCount = await UniversalLog.count();
    console.log(`📊 Current log records: ${logCount}`);

    if (logCount > 0) {
      // Show the most recent log entry
      const recentLog = await UniversalLog.findOne({
        order: [['created_at', 'DESC']]
      });
      
      if (recentLog) {
        const logData = recentLog.toJSON();
        console.log('\n📝 Most recent log entry:');
        console.log('ID:', logData.id);
        console.log('URL:', logData.url);
        console.log('Method:', logData.method);
        console.log('Status Code:', logData.status_code);
        console.log('User ID:', logData.user_id);
        console.log('Module:', logData.module);
        console.log('Endpoint:', logData.endpoint_name);
        console.log('Execution Time:', logData.execution_time_ms + 'ms');
        console.log('Created At:', new Date(logData.created_at * 1000).toISOString());
        console.log('IP Address:', logData.ip_address);
        console.log('User Agent:', logData.user_agent?.substring(0, 100) + '...');
      }
    }

    console.log('\n✅ Universal logging test completed!');
    console.log('\nTo test the actual logging:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Make any API request (e.g., POST to: http://localhost:3000/api/v1/customer/order/place)');
    console.log('3. Check the universal_log table for new entries');
    console.log('4. All API requests and responses will be automatically logged!');

  } catch (error) {
    console.error('❌ Universal logging test failed:', error);
    throw error;
  }
}

// Run the test
testOrderLogging()
  .then(() => {
    console.log('Universal logging test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.log('Universal logging test failed');
    process.exit(1);
  });

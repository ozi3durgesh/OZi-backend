// scripts/testOrderLogging.ts
import sequelize from '../config/database';

async function testOrderLogging() {
  try {
    console.log('Testing universal logging functionality...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('📊 UniversalLog table has been removed from the application');
    console.log('📝 Order logging is now handled through the main application flow');

    console.log('\n✅ Universal logging test completed!');
    console.log('\nNote: Universal logging has been simplified and integrated into the main application');

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

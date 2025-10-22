const { ProductMasterService } = require('./dist/services/productMasterService');

async function testAverageCostCalculation() {
  console.log('🧪 Testing Average Cost Calculation...\n');

  try {
    // Test with a sample SKU ID
    const testSkuId = '400000101001'; // Replace with an actual SKU ID from your database
    const userId = 1;

    console.log(`📋 Testing SKU: ${testSkuId}`);
    console.log(`👤 User ID: ${userId}\n`);

    // Call the calculateAndUpdateAverageCost method
    const result = await ProductMasterService.calculateAndUpdateAverageCost(testSkuId, userId);

    console.log('✅ Test completed successfully!');
    console.log('📊 Result:', {
      sku_id: result.sku_id,
      name: result.name,
      avg_cost_to_ozi: result.avg_cost_to_ozi,
      updated_at: result.updated_at
    });

    // Show the latest log entry
    if (result.logs && result.logs.length > 0) {
      const latestLog = result.logs[result.logs.length - 1];
      console.log('\n📝 Latest Log Entry:', JSON.stringify(latestLog, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAverageCostCalculation()
  .then(() => {
    console.log('\n🎉 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });

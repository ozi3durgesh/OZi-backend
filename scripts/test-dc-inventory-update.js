const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize({
  host: 'ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com',
  database: 'ozi_backend',
  username: 'admin',
  password: 'rLfcu9Y80S8X',
  port: 3306,
  dialect: 'mysql',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function testDCInventoryUpdate() {
  try {
    console.log('🚀 Testing DC inventory update...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Check current DC inventory data
    console.log('📊 Current DC inventory data:');
    const dcInventoryData = await sequelize.query('SELECT * FROM dc_inventory_1', { type: Sequelize.QueryTypes.SELECT });
    console.table(dcInventoryData);

    // Check current inventory data
    console.log('📊 Current inventory data:');
    const inventoryData = await sequelize.query('SELECT * FROM inventory', { type: Sequelize.QueryTypes.SELECT });
    console.table(inventoryData);

    // Test the DC inventory update manually
    console.log('🔧 Testing DC inventory updateOnFCPORaise...');
    
    // Simulate FC PO raise for SKU 400041801001 with quantity 1
    const testSkuId = '400041801001';
    const testDcId = 1;
    const testQuantity = 1;

    // Get current values
    const currentDC = await sequelize.query(
      'SELECT * FROM dc_inventory_1 WHERE sku_id = ? AND dc_id = ?',
      { 
        replacements: [testSkuId, testDcId],
        type: Sequelize.QueryTypes.SELECT 
      }
    );

    if (currentDC.length > 0) {
      const current = currentDC[0];
      console.log(`📊 Current DC inventory for ${testSkuId}:`);
      console.log(`  - grn_done: ${current.grn_done}`);
      console.log(`  - total_available_quantity: ${current.total_available_quantity}`);

      // Calculate new total_available_quantity = grn_done - fc_po_raise_quantity
      const newTotalAvailable = current.grn_done - testQuantity;
      
      console.log(`🔧 Updating total_available_quantity to: ${newTotalAvailable} (${current.grn_done} - ${testQuantity})`);
      
      await sequelize.query(
        'UPDATE dc_inventory_1 SET total_available_quantity = ? WHERE sku_id = ? AND dc_id = ?',
        { 
          replacements: [newTotalAvailable, testSkuId, testDcId]
        }
      );

      console.log('✅ DC inventory updated successfully');

      // Verify the update
      const updatedDC = await sequelize.query(
        'SELECT * FROM dc_inventory_1 WHERE sku_id = ? AND dc_id = ?',
        { 
          replacements: [testSkuId, testDcId],
          type: Sequelize.QueryTypes.SELECT 
        }
      );

      console.log('📊 Updated DC inventory:');
      console.table(updatedDC);
    } else {
      console.log(`⚠️ No DC inventory record found for SKU ${testSkuId} in DC ${testDcId}`);
    }

    console.log('✅ DC inventory update test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testDCInventoryUpdate()
  .then(() => {
    console.log('🎉 DC inventory update test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });

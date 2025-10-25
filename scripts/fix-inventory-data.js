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

async function fixInventoryData() {
  try {
    console.log('🚀 Fixing inventory data...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Check current inventory data
    console.log('📊 Current inventory data:');
    const currentData = await sequelize.query('SELECT * FROM inventory', { type: Sequelize.QueryTypes.SELECT });
    console.table(currentData);

    // Fix the existing record
    console.log('🔧 Fixing inventory record...');
    await sequelize.query(`
      UPDATE inventory 
      SET 
        fc_id = 1,
        dc_id = 1,
        sale_available_quantity = fc_putaway_quantity,
        fc_total_available_quantity = fc_putaway_quantity - fc_picklist_quantity,
        updated_at = CURRENT_TIMESTAMP
      WHERE sku = '400041801001'
    `);

    console.log('✅ Inventory record updated successfully');

    // Verify the fix
    console.log('🔍 Verifying updated data:');
    const updatedData = await sequelize.query('SELECT * FROM inventory', { type: Sequelize.QueryTypes.SELECT });
    console.table(updatedData);

    console.log('✅ Inventory data fixed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixInventoryData()
  .then(() => {
    console.log('🎉 Inventory data fixed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });

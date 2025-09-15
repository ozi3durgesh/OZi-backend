import sequelize from '../config/database';

async function addReturnColumns() {
  try {
    console.log('🔄 Adding return_item_id columns to orders and order_details tables...');
    
    // Add return_item_id column to orders table
    await sequelize.query(`
      ALTER TABLE \`orders\` 
      ADD COLUMN \`return_item_id\` VARCHAR(50) NULL COMMENT 'Return order ID for tracking returns'
    `);
    console.log('✅ Added return_item_id column to orders table');
    
    // Add return_item_id column to order_details table
    await sequelize.query(`
      ALTER TABLE \`order_details\` 
      ADD COLUMN \`return_item_id\` VARCHAR(50) NULL COMMENT 'Return order ID for tracking returns'
    `);
    console.log('✅ Added return_item_id column to order_details table');
    
    // Add indexes for better performance
    await sequelize.query(`
      CREATE INDEX \`idx_orders_return_item_id\` ON \`orders\` (\`return_item_id\`)
    `);
    console.log('✅ Added index on orders.return_item_id');
    
    await sequelize.query(`
      CREATE INDEX \`idx_order_details_return_item_id\` ON \`order_details\` (\`return_item_id\`)
    `);
    console.log('✅ Added index on order_details.return_item_id');
    
    // Verify the columns were added
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ozi_backend' 
      AND TABLE_NAME IN ('orders', 'order_details') 
      AND COLUMN_NAME = 'return_item_id'
    `);
    
    console.log('📋 Verification results:');
    console.table(results);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addReturnColumns()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });

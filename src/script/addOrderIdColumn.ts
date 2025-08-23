import sequelize from '../config/database';

async function addOrderIdColumn() {
  try {
    console.log('Adding order_id column to orders table...');

    // Add order_id column
    try {
      await sequelize.query("ALTER TABLE orders ADD COLUMN order_id VARCHAR(50) NOT NULL UNIQUE AFTER id");
      console.log('✅ Added order_id column');
    } catch (error: any) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  order_id column already exists');
      } else {
        console.error('❌ Error adding order_id column:', error.message);
        return;
      }
    }

    // Create index for order_id
    try {
      await sequelize.query("CREATE INDEX idx_order_id ON orders(order_id)");
      console.log('✅ Created index on order_id');
    } catch (error: any) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️  Index on order_id already exists');
      } else {
        console.error('❌ Error creating index:', error.message);
      }
    }

    console.log('✅ Order ID column setup completed successfully!');
    
    // Show the updated table structure
    const [results] = await sequelize.query("DESCRIBE orders");
    console.log('\n📋 Updated orders table structure:');
    console.table(results);

  } catch (error) {
    console.error('❌ Error setting up order_id column:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
addOrderIdColumn();

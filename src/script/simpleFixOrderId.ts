import sequelize from '../config/database';

async function simpleFixOrderId() {
  try {
    console.log('Applying simple fix to orders table...');

    // First, let's backup the existing data by creating a temporary table
    console.log('Creating backup table...');
    try {
      await sequelize.query("CREATE TABLE orders_backup AS SELECT * FROM orders");
      console.log('✅ Backup table created');
    } catch (error: any) {
      console.error('❌ Error creating backup:', error.message);
    }

    // Now let's modify the existing table structure
    console.log('Modifying existing table structure...');
    
    // 1. Drop the order_id column (since we're using id as the primary key)
    try {
      await sequelize.query("ALTER TABLE orders DROP COLUMN order_id");
      console.log('✅ Dropped order_id column');
    } catch (error: any) {
      console.log('⚠️  order_id column not found or already dropped');
    }

    // 2. Drop the id_string column if it exists
    try {
      await sequelize.query("ALTER TABLE orders DROP COLUMN id_string");
      console.log('✅ Dropped id_string column');
    } catch (error: any) {
      console.log('⚠️  id_string column not found or already dropped');
    }

    // 3. Drop the auto-increment constraint from id
    try {
      await sequelize.query("ALTER TABLE orders MODIFY id VARCHAR(50) NOT NULL");
      console.log('✅ Modified id column to VARCHAR(50)');
    } catch (error: any) {
      console.error('❌ Error modifying id column:', error.message);
    }

    // 4. Update existing orders with custom IDs
    console.log('Updating existing orders with custom IDs...');
    const [orders] = await sequelize.query("SELECT id, created_at FROM orders ORDER BY id");
    
    for (const order of orders as any[]) {
      const timestamp = order.created_at * 1000; // Convert to milliseconds
      const sequence = order.id.toString().padStart(4, '0');
      const customOrderId = `ozi${timestamp}${sequence}`;
      
      try {
        await sequelize.query("UPDATE orders SET id = ? WHERE id = ?", {
          replacements: [customOrderId, order.id]
        });
        console.log(`✅ Updated order ${order.id} with custom ID: ${customOrderId}`);
      } catch (error: any) {
        console.error(`❌ Error updating order ${order.id}:`, error.message);
      }
    }

    // 5. Add primary key constraint back
    try {
      await sequelize.query("ALTER TABLE orders ADD PRIMARY KEY (id)");
      console.log('✅ Added primary key constraint');
    } catch (error: any) {
      console.error('❌ Error adding primary key:', error.message);
    }

    console.log('✅ Simple fix completed successfully!');
    
    // Show the final table structure
    const [results] = await sequelize.query("DESCRIBE orders");
    console.log('\n📋 Final orders table structure:');
    console.table(results);

  } catch (error) {
    console.error('❌ Error applying simple fix:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
simpleFixOrderId();

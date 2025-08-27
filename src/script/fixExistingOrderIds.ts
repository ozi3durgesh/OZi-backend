// script/fixExistingOrderIds.ts
import sequelize from '../config/database';

async function fixExistingOrderIds() {
  try {
    console.log('🔧 Fixing existing order IDs to use correct format...\n');

    // Check if there are existing orders
    const [existingOrders] = await sequelize.query("SELECT COUNT(*) as count FROM orders");
    const orderCount = (existingOrders as any[])[0]?.count || 0;
    console.log(`Found ${orderCount} existing orders`);

    if (orderCount === 0) {
      console.log('✅ No existing orders to fix');
      return;
    }

    // Get all existing orders
    const [orders] = await sequelize.query("SELECT id, order_id, created_at FROM orders ORDER BY id");
    console.log(`\n📋 Processing ${orders.length} orders...\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders as any[]) {
      const currentOrderId = order.order_id;
      
      // Check if the order ID already follows the correct format
      if (currentOrderId && currentOrderId.match(/^ozi\d{13,17}$/)) {
        console.log(`⏭️  Order ${order.id}: Already has correct format: ${currentOrderId}`);
        skippedCount++;
        continue;
      }

      // Generate new order ID in correct format
      const timestamp = order.created_at * 1000; // Convert to milliseconds
      const sequence = order.id.toString().padStart(4, '0');
      const newOrderId = `ozi${timestamp}${sequence}`;

      try {
        await sequelize.query("UPDATE orders SET order_id = ? WHERE id = ?", {
          replacements: [newOrderId, order.id]
        });
        console.log(`✅ Order ${order.id}: ${currentOrderId || 'NULL'} → ${newOrderId}`);
        updatedCount++;
      } catch (error: any) {
        console.error(`❌ Error updating order ${order.id}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} orders`);
    console.log(`⏭️  Skipped (already correct): ${skippedCount} orders`);
    console.log(`📝 Total processed: ${orders.length} orders`);

    if (updatedCount > 0) {
      console.log('\n🎉 Successfully updated order IDs to correct format!');
      console.log('📋 New format: ozi + milliseconds + sequence (e.g., ozi17561230400390001)');
    } else {
      console.log('\n✨ All order IDs are already in the correct format!');
    }

  } catch (error) {
    console.error('❌ Error fixing order IDs:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  fixExistingOrderIds()
    .then(() => {
      console.log('\n🎉 Order ID fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Order ID fix failed:', error);
      process.exit(1);
    });
}

export default fixExistingOrderIds;

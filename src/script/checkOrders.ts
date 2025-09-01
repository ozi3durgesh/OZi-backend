import sequelize from '../config/database';

async function checkOrders() {
  try {
    console.log('🔍 Checking Orders in Database...\n');

    // Raw query to check orders
    const [results] = await sequelize.query('SELECT id, order_id, order_amount, payment_status, order_status FROM orders ORDER BY created_at DESC LIMIT 5');
    
    if (results.length === 0) {
      console.log('❌ No orders found in database.');
      return;
    }

    console.log(`✅ Found ${results.length} order(s):\n`);

    results.forEach((order: any, index: number) => {
      console.log(`📦 Order ${index + 1}:`);
      console.log(`   Internal ID: ${order.id}`);
      console.log(`   Order ID: ${order.order_id}`);
      console.log(`   Amount: $${order.order_amount}`);
      console.log(`   Payment Status: ${order.payment_status}`);
      console.log(`   Order Status: ${order.order_status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkOrders();

import sequelize from '../config/database';
import Order from '../models/Order';
import PaymentRequest from '../models/PaymentRequest';

async function debugOrderLookup() {
  try {
    console.log('🔍 Debugging Order Lookup...\n');

    // Check payment request
    const paymentRequest = await PaymentRequest.findByPk('de0e941b-7cad-451c-8077-73ff70caaf62');
    if (!paymentRequest) {
      console.log('❌ Payment request not found');
      return;
    }

    console.log('📋 Payment Request:');
    console.log(`   ID: ${(paymentRequest as any).id}`);
    console.log(`   Order ID: ${(paymentRequest as any).order_id}`);
    console.log(`   Amount: $${(paymentRequest as any).payment_amount}`);

    // Check if order exists
    const order = await Order.findByPk((paymentRequest as any).order_id);
    if (!order) {
      console.log('❌ Order not found with ID:', (paymentRequest as any).order_id);
      
      // Check what orders exist
      const allOrders = await Order.findAll({ limit: 5 });
      console.log('\n📦 Available Orders:');
      allOrders.forEach((o: any, index: number) => {
        console.log(`   ${index + 1}. ID: ${o.id}, Order ID: ${o.order_id}`);
      });
      
      return;
    }

    console.log('✅ Order found:');
    console.log(`   Internal ID: ${(order as any).id}`);
    console.log(`   Order ID: ${(order as any).order_id}`);
    console.log(`   Amount: $${(order as any).order_amount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

debugOrderLookup();

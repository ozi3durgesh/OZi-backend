import sequelize from '../config/database';
import PaymentRequest from '../models/PaymentRequest';

async function findPaymentRequests() {
  try {
    console.log('🔍 Finding Payment Requests...\n');

    // Find all payment requests
    const paymentRequests = await PaymentRequest.findAll({
      order: [['created_at', 'DESC']]
    });

    if (paymentRequests.length === 0) {
      console.log('❌ No payment requests found.');
      console.log('💡 Place an order with payment_method: "digital_payment" first.');
      return;
    }

    console.log(`✅ Found ${paymentRequests.length} payment request(s):\n`);

    for (const pr of paymentRequests) {
      console.log(`📋 Payment Request:`);
      console.log(`   ID: ${pr.id}`);
      console.log(`   Amount: $${pr.payment_amount}`);
      console.log(`   Currency: ${pr.currency_code}`);
      console.log(`   Method: ${pr.payment_method}`);
      console.log(`   Status: ${pr.is_paid ? 'Paid' : 'Unpaid'}`);
      console.log(`   Order ID: ${pr.order_id}`);
      console.log(`   Created: ${pr.created_at}`);
      console.log('');
    }

    console.log('💡 Use the payment request ID to test the payment flow:');
    console.log(`   GET /payment/razor-pay/pay?payment_id=${paymentRequests[0].id}`);

  } catch (error) {
    console.error('❌ Error finding payment requests:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

findPaymentRequests();

import sequelize from '../config/database';

async function checkPaymentRequests() {
  try {
    console.log('🔍 Checking Payment Requests in Database...\n');

    // Raw query to check payment requests
    const [results] = await sequelize.query('SELECT * FROM payment_requests ORDER BY created_at DESC');
    
    if (results.length === 0) {
      console.log('❌ No payment requests found in database.');
      return;
    }

    console.log(`✅ Found ${results.length} payment request(s):\n`);

    results.forEach((pr: any, index: number) => {
      console.log(`📋 Payment Request ${index + 1}:`);
      console.log(`   ID: ${pr.id}`);
      console.log(`   Amount: $${pr.payment_amount}`);
      console.log(`   Currency: ${pr.currency_code}`);
      console.log(`   Method: ${pr.payment_method}`);
      console.log(`   Status: ${pr.is_paid ? 'Paid' : 'Unpaid'}`);
      console.log(`   Order ID: ${pr.order_id}`);
      console.log(`   Created: ${pr.created_at}`);
      console.log('');
    });

    console.log('💡 Use the payment request ID to test the payment flow:');
    console.log(`   GET /payment/razor-pay/pay?payment_id=${(results[0] as any).id}`);

  } catch (error) {
    console.error('❌ Error checking payment requests:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkPaymentRequests();

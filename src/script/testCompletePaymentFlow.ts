import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testCompletePaymentFlow() {
  try {
    console.log('🚀 Starting Complete Payment Flow Test...\n');

    // Step 1: Place Order with Digital Payment
    console.log('📝 Step 1: Placing Order with Digital Payment');
    const orderData = {
      cart: [
        {
          sku: "1191",
          amount: 100.00,
          quantity: 1
        }
      ],
      order_amount: 100.00,
      payment_method: "digital_payment",
      order_type: "delivery",
      store_id: 11,
      distance: 5.0,
      address: "123 Test Street, Test City",
      longitude: 77.2090,
      latitude: 28.6139,
      contact_person_name: "Test User",
      contact_person_number: "9999999999"
    };

    console.log('Order Data:', JSON.stringify(orderData, null, 2));
    
    const placeOrderResponse = await axios.post(`${BASE_URL}/api/v1/customer/order/place`, orderData);
    console.log('✅ Order Placed Successfully:');
    console.log('Response:', JSON.stringify(placeOrderResponse.data, null, 2));
    
    const orderId = placeOrderResponse.data.data.order_id;
    console.log(`📦 Order ID: ${orderId}\n`);

    // Step 2: Get Payment Request ID (in production, this would be returned from order placement)
    console.log('🔍 Step 2: Finding Payment Request');
    
    // For testing, we'll need to query the database to get the payment request ID
    // In production, this would be returned from the order placement
    console.log('Note: In production, payment_request_id would be returned from order placement\n');

    // Step 3: Access Payment Gateway
    console.log('💳 Step 3: Accessing Payment Gateway');
    console.log(`GET ${BASE_URL}/payment/razor-pay/pay?payment_id={uuid}`);
    console.log('This will render the payment form with RazorPay checkout\n');

    // Step 4: Process Payment
    console.log('💸 Step 4: Processing Payment');
    console.log(`POST ${BASE_URL}/payment/razor-pay/payment`);
    console.log('Body: { payment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature }');
    console.log('This handles the payment response from RazorPay\n');

    // Step 5: Handle Callback
    console.log('📞 Step 5: Handling Callback');
    console.log(`POST ${BASE_URL}/payment/razor-pay/callback`);
    console.log('Body: { payment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature }');
    console.log('This handles RazorPay webhook callbacks\n');

    // Step 6: Track Order
    console.log('📍 Step 6: Tracking Order');
    console.log(`GET ${BASE_URL}/api/v1/customer/order/track?order_id=${orderId}`);
    console.log('This returns order status and delivery details\n');

    // Step 7: Cancel Order (if needed)
    console.log('❌ Step 7: Cancelling Order (if needed)');
    console.log(`POST ${BASE_URL}/api/v1/customer/order/cancel`);
    console.log('Body: { order_id, cancellation_reason }');
    console.log('This cancels the order if needed\n');

    // Step 8: Request Refund (if needed)
    console.log('💰 Step 8: Requesting Refund (if needed)');
    console.log(`POST ${BASE_URL}/api/v1/customer/order/refund-request`);
    console.log('Body: { order_id, refund_reason, refund_amount, contact_number }');
    console.log('This creates a refund request\n');

    console.log('🎉 Complete Payment Flow Test Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Use the curl commands below to test each endpoint');
    console.log('3. Check the database for created records');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompletePaymentFlow();

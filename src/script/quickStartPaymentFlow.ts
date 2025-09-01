import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function quickStartPaymentFlow() {
  try {
    console.log('🚀 Quick Start Payment Flow Demo\n');
    console.log('This script demonstrates the complete payment flow step by step.\n');

    // Step 1: Place Order
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

    console.log('Placing order...');
    const placeOrderResponse = await axios.post(`${BASE_URL}/api/v1/customer/order/place`, orderData);
    
    if (placeOrderResponse.data.success) {
      const orderId = placeOrderResponse.data.data.order_id;
      console.log(`✅ Order placed successfully! Order ID: ${orderId}\n`);
      
      // Step 2: Find Payment Request
      console.log('🔍 Step 2: Finding Payment Request');
      console.log('Run this command to find the payment request ID:');
      console.log('npx ts-node src/script/findPaymentRequest.ts\n');
      
      // Step 3: Test Payment Gateway
      console.log('💳 Step 3: Test Payment Gateway');
      console.log('After getting the payment request ID, test the payment gateway:');
      console.log('curl -X GET "http://localhost:3000/payment/razor-pay/pay?payment_id=YOUR_PAYMENT_REQUEST_ID"\n');
      
      // Step 4: Test Payment Processing
      console.log('💸 Step 4: Test Payment Processing');
      console.log('Test payment processing with:');
      console.log('curl -X POST http://localhost:3000/payment/razor-pay/payment \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"payment_id": "YOUR_PAYMENT_REQUEST_ID", "razorpay_payment_id": "pay_test", "razorpay_order_id": "order_test", "razorpay_signature": "sig_test"}\'\n');
      
      // Step 5: Test Order Tracking
      console.log('📍 Step 5: Test Order Tracking');
      console.log('Track your order with:');
      console.log(`curl -X GET "http://localhost:3000/api/v1/customer/order/track?order_id=${orderId}"\n`);
      
      // Step 6: Test Order Cancellation
      console.log('❌ Step 6: Test Order Cancellation (Optional)');
      console.log('Cancel order if needed:');
      console.log('curl -X POST http://localhost:3000/api/v1/customer/order/cancel \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log(`  -d '{"order_id": "${orderId}", "cancellation_reason": "Testing"}'`);
      
    } else {
      console.log('❌ Order placement failed:', placeOrderResponse.data);
    }

  } catch (error: any) {
    console.error('❌ Quick start failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure your server is running: npm run dev');
  }
}

quickStartPaymentFlow();

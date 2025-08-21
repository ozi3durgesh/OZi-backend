import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const JWT_TOKEN = 'YOUR_ACTUAL_JWT_TOKEN'; // Replace with actual token

async function testResponseFormat() {
  try {
    console.log('Testing order response format...');

    const orderData = {
      "cart": [
        {
          "sku": 123,
          "amount": 25.99
        }
      ],
      "coupon_discount_amount": 0.0,
      "order_amount": 96.0,
      "order_type": "delivery",
      "payment_method": "cash_on_delivery",
      "store_id": 9,
      "distance": 88.6379234112387,
      "discount_amount": 10.0,
      "tax_amount": 10.0,
      "address": "532, Shakti Nagar, New Delhi, Delhi, 110007, India",
      "latitude": 28.67280321318178,
      "longitude": 77.18774400651455,
      "contact_person_name": "John Doe",
      "contact_person_number": "+918987562984",
      "address_type": "others",
      "dm_tips": 0,
      "cutlery": 0,
      "partial_payment": 0,
      "is_buy_now": 0,
      "extra_packaging_amount": 0.0,
      "create_new_user": 0
    };

    console.log('Sending order data...');
    console.log('Endpoint:', `${BASE_URL}/api/v1/customer/order/place`);

    const response = await axios.post(
      `${BASE_URL}/api/v1/customer/order/place`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'source': 'web',
          'app-version': '1.0.0'
        }
      }
    );

    console.log('\n✅ Order placed successfully!');
    console.log('\n📋 Response Format:');
    console.log('Status Code:', response.status);
    console.log('Response Body:', JSON.stringify(response.data, null, 2));
    
    // Verify response structure matches production
    const expectedFields = ['message', 'order_id', 'total_ammount', 'status', 'created_at', 'user_id'];
    const missingFields = expectedFields.filter(field => !(field in response.data));
    
    if (missingFields.length === 0) {
      console.log('\n✅ Response structure matches production format!');
      console.log('All expected fields present:', expectedFields);
    } else {
      console.log('\n❌ Missing fields:', missingFields);
    }

  } catch (error: any) {
    if (error.response) {
      console.error('❌ Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the test
testResponseFormat();

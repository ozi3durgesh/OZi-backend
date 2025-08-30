const axios = require('axios');

const NODE_BACKEND_URL = 'http://13.232.150.239:3000';

async function testEcomLog() {
  try {
    console.log('🧪 Testing EcomLog functionality...');
    
    // Test the test endpoint
    const response = await axios.post(`${NODE_BACKEND_URL}/api/ecommerce/test-ecomlog`);
    
    console.log('✅ Test successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

async function testDirectLogging() {
  try {
    console.log('📝 Testing direct logging endpoint...');
    
    const testOrder = {
      id: 12345,
      order_id: 'TEST_12345',
      user_id: 999,
      order_amount: 1500.00,
      payment_method: 'cash_on_delivery',
      delivery_address: '{"contact_person_name": "Test User", "address": "Test Address"}',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    };
    
    // Test the direct logging endpoint
    const response = await axios.post(`${NODE_BACKEND_URL}/api/ecommerce/log-order`, {
      order: testOrder
    });
    
    console.log('✅ Direct logging successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Direct logging failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    
    const response = await axios.get(`${NODE_BACKEND_URL}/health`);
    
    console.log('✅ Health check successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting tests...\n');
  
  await testHealthCheck();
  console.log('');
  
  await testEcomLog();
  console.log('');
  
  await testDirectLogging();
  console.log('');
  
  console.log('✨ Tests completed!');
}

runTests();

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
  
  console.log('✨ Tests completed!');
}

runTests();

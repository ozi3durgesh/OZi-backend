const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test payload with colors and ages
const testPayload = {
  colors: ["Yellow", "Pink", "Green"],
  ageSizes: ["M", "XL"],
  name: "Test Product",
  category: "Test Category", 
  description: "Test Description",
  mrp: 100,
  brand_id: 2,
  gst: 18,
  cess: 5,
  hsn: "12345678",
  status: 1
};

async function testProductCreation() {
  try {
    console.log('🧪 Testing Product Creation API...');
    console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/product-master`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error occurred:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📊 Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('📊 Error:', error.message);
    }
  }
}

// Test without colors/ages
async function testProductCreationWithoutColors() {
  try {
    console.log('\n🧪 Testing Product Creation WITHOUT Colors/Ages...');
    
    const payloadWithoutColors = {
      name: "Test Product No Colors",
      category: "Test Category",
      description: "Test Description", 
      mrp: 100,
      brand_id: 2,
      gst: 18,
      cess: 5,
      hsn: "12345678",
      status: 1
    };
    
    console.log('📋 Payload:', JSON.stringify(payloadWithoutColors, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/product-master`, payloadWithoutColors, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error occurred:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📊 Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('📊 Error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  await testProductCreationWithoutColors();
  await testProductCreation();
}

runTests();

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
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ab3ppLmluIiwicm9sZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlsidXNlcnNfcm9sZXM6bWFuYWdlIiwic2l0ZXM6Y3JlYXRlX2NvbmZpZyIsInNpdGVzOnZpZXciLCJzaXRlczp2aWV3X293biIsIm9yZGVycy52aWV3X2FsbCIsIm9yZGVyczp2aWV3X3doIiwib3JkZXJzOnZpZXdfc3RvcmUiLCJvcmRlcnM6dmlld190YXNrIiwicGlja2luZzp2aWV3IiwicGlja2luZzphc3NpZ25fbWFuYWdlIiwicGlja2luZzpleGVjdXRlIiwicGlja2luZzptb25pdG9yIiwiaW5ib3VuZDp2aWV3IiwiaW5ib3VuZDphcHByb3ZlX3ZhcmlhbmNlcyIsImluYm91bmQ6ZXhlY3V0ZSIsInB1dGF3YXk6dmlldyIsInB1dGF3YXk6bWFuYWdlIiwicHV0YXdheTpleGVjdXRlIiwiaW52ZW50b3J5OmFwcHJvdmUiLCJpbnZlbnRvcnk6cmFpc2UiLCJjeWNsZV9jb3VudDp2aWV3IiwiY3ljbGVfY291bnQ6c2NoZWR1bGVfYXBwcm92ZSIsImN5Y2xlX2NvdW50OmV4ZWN1dGUiLCJyZXBsZW5pc2htZW50OmNvbmZpZyIsInJlcGxlbmlzaG1lbnQ6YXBwcm92ZSIsInJ0djpjb25maWdfYXBwcm92ZSIsInJ0djpjcmVhdGVfYXBwcm92ZSIsInJ0djpleGVjdXRlIiwicG9zOnZpZXciLCJwb3M6ZXhlY3V0ZSIsInN0b3JlX3doX3JlcXVlc3RzOnZpZXciLCJzdG9yZV93aF9yZXF1ZXN0czpjcmVhdGVfY2hlY2tpbiIsImV4Y2VwdGlvbnM6YWxsX2FjdGlvbnMiLCJleGNlcHRpb25zOnJlc29sdmUiLCJleGNlcHRpb25zOnJhaXNlIiwiZXhjZXB0aW9uczpyYWlzZV9zdG9yZSIsImRhc2hib2FyZHM6dmlld19hbGwiLCJkYXNoYm9hcmRzOnZpZXdfd2giLCJkYXNoYm9hcmRzOnZpZXdfdGFzayIsImRhc2hib2FyZHM6dmlld19zdG9yZSIsInNsYTpjb25maWd1cmUiLCJzbGE6dmlldyIsInN0b3JlX29wczpwb3NfY2hlY2tvdXQiLCJzdG9yZV9vcHM6aW52b2ljZV9jcmVhdGUiLCJzdG9yZV9vcHM6c3RvcmVfc3RhdHVzIiwic3RvcmVfb3BzOnN1cmdlX3RvZ2dsZSIsInN0b3JlX29wczpzdG9ja19jaGVjayJdLCJpYXQiOjE3MzE5MTU0NDQsImV4cCI6MTczMTk1ODY0NH0.example'
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
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ab3ppLmluIiwicm9sZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlsidXNlcnNfcm9sZXM6bWFuYWdlIiwic2l0ZXM6Y3JlYXRlX2NvbmZpZyIsInNpdGVzOnZpZXciLCJzaXRlczp2aWV3X293biIsIm9yZGVycy52aWV3X2FsbCIsIm9yZGVyczp2aWV3X3doIiwib3JkZXJzOnZpZXdfc3RvcmUiLCJvcmRlcnM6dmlld190YXNrIiwicGlja2luZzp2aWV3IiwicGlja2luZzphc3NpZ25fbWFuYWdlIiwicGlja2luZzpleGVjdXRlIiwicGlja2luZzptb25pdG9yIiwiaW5ib3VuZDp2aWV3IiwiaW5ib3VuZDphcHByb3ZlX3ZhcmlhbmNlcyIsImluYm91bmQ6ZXhlY3V0ZSIsInB1dGF3YXk6dmlldyIsInB1dGF3YXk6bWFuYWdlIiwicHV0YXdheTpleGVjdXRlIiwiaW52ZW50b3J5OmFwcHJvdmUiLCJpbnZlbnRvcnk6cmFpc2UiLCJjeWNsZV9jb3VudDp2aWV3IiwiY3ljbGVfY291bnQ6c2NoZWR1bGVfYXBwcm92ZSIsImN5Y2xlX2NvdW50OmV4ZWN1dGUiLCJyZXBsZW5pc2htZW50OmNvbmZpZyIsInJlcGxlbmlzaG1lbnQ6YXBwcm92ZSIsInJ0djpjb25maWdfYXBwcm92ZSIsInJ0djpjcmVhdGVfYXBwcm92ZSIsInJ0djpleGVjdXRlIiwicG9zOnZpZXciLCJwb3M6ZXhlY3V0ZSIsInN0b3JlX3doX3JlcXVlc3RzOnZpZXciLCJzdG9yZV93aF9yZXF1ZXN0czpjcmVhdGVfY2hlY2tpbiIsImV4Y2VwdGlvbnM6YWxsX2FjdGlvbnMiLCJleGNlcHRpb25zOnJlc29sdmUiLCJleGNlcHRpb25zOnJhaXNlIiwiZXhjZXB0aW9uczpyYWlzZV9zdG9yZSIsImRhc2hib2FyZHM6dmlld19hbGwiLCJkYXNoYm9hcmRzOnZpZXdfd2giLCJkYXNoYm9hcmRzOnZpZXdfdGFzayIsImRhc2hib2FyZHM6dmlld19zdG9yZSIsInNsYTpjb25maWd1cmUiLCJzbGE6dmlldyIsInN0b3JlX29wczpwb3NfY2hlY2tvdXQiLCJzdG9yZV9vcHM6aW52b2ljZV9jcmVhdGUiLCJzdG9yZV9vcHM6c3RvcmVfc3RhdHVzIiwic3RvcmVfb3BzOnN1cmdlX3RvZ2dsZSIsInN0b3JlX29wczpzdG9ja19jaGVjayJdLCJpYXQiOjE3MzE5MTU0NDQsImV4cCI6MTczMTk1ODY0NH0.example'
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

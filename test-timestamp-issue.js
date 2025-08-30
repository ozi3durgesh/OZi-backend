#!/usr/bin/env node

/**
 * Test script to debug timestamp parsing issues
 * Run with: node test-timestamp-issue.js
 */

const axios = require('axios');

const NODEJS_URL = process.env.NODEJS_ECOMMERCE_URL || 'http://13.232.150.239:3000';

async function testTimestampParsing() {
  try {
    console.log('🧪 Testing timestamp parsing endpoint...');
    console.log(`📍 Node.js URL: ${NODEJS_URL}`);
    
    const response = await axios.get(`${NODEJS_URL}/api/ecommerce/test-timestamp`);
    
    console.log('✅ Timestamp parsing test results:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Timestamp parsing test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🏥 Testing health check endpoint...');
    
    const response = await axios.get(`${NODEJS_URL}/api/ecommerce/health`);
    
    console.log('✅ Health check successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Health check failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testEcomLog() {
  try {
    console.log('\n📝 Testing EcomLog functionality...');
    
    const response = await axios.post(`${NODEJS_URL}/api/ecommerce/test-ecomlog`);
    
    console.log('✅ EcomLog test successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ EcomLog test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting timestamp debugging tests...\n');
  
  await testHealthCheck();
  await testTimestampParsing();
  await testEcomLog();
  
  console.log('\n✨ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTimestampParsing,
  testHealthCheck,
  testEcomLog,
  runAllTests
};

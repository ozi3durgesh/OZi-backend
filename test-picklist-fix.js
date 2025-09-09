// Test script to fix picklist items for wave 7
const axios = require('axios');

const BASE_URL = 'http://13.232.150.239/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYWRtaW5AY29tcGFueS5jb20iLCJyb2xlIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJ1c2Vyc19yb2xlczptYW5hZ2UiLCJzaXRlczpjcmVhdGVfY29uZmlnIiwic2l0ZXM6dmlldyIsInNpdGVzOnZpZXdfb3duIiwib3JkZXJzOnZpZXdfYWxsIiwib3JkZXJzOnZpZXdfd2giLCJvcmRlcnM6dmlld19zdG9yZSIsIm9yZGVyczp2aWV3X3Rhc2siLCJwaWNraW5nOnZpZXciLCJwaWNraW5nOmFzc2lnbl9tYW5hZ2UiLCJwaWNraW5nOmV4ZWN1dGUiLCJwaWNraW5nOm1vbml0b3IiLCJpbmJvdW5kOnZpZXciLCJpbmJvdW5kOmFwcHJvdmVfdmFyaWFuY2VzIiwiaW5ib3VuZDpleGVjdXRlIiwicHV0YXdheTp2aWV3IiwicHV0YXdheTptYW5hZ2UiLCJwdXRhd2F5OmV4ZWN1dGUiLCJpbnZlbnRvcnk6YXBwcm92ZSIsImludmVudG9yeTpyYWlzZSIsImN5Y2xlX2NvdW50OnZpZXciLCJjeWNsZV9jb3VudDpzY2hlZHVsZV9hcHByb3ZlIiwiY3ljbGVfY291bnQ6ZXhlY3V0ZSIsInJlcGxlbmlzaG1lbnQ6Y29uZmlnIiwicmVwbGVuaXNobWVudDphcHByb3ZlIiwicnR2OmNvbmZpZ19hcHByb3ZlIiwicnR2OmNyZWF0ZV9hcHByb3ZlIiwicnR2OmV4ZWN1dGUiLCJwb3M6dmlldyIsInBvczpleGVjdXRlIiwic3RvcmVfd2hfcmVxdWVzdHM6dmlldyIsInN0b3JlX3doX3JlcXVlc3RzOmNyZWF0ZV9jaGVja2luIiwiZXhjZXB0aW9uczphbGxfYWN0aW9ucyIsImV4Y2VwdGlvbnM6cmVzb2x2ZSIsImV4Y2VwdGlvbnM6cmFpc2UiLCJleGNlcHRpb25zOnJhaXNlX3N0b3JlIiwiZGFzaGJvYXJkczp2aWV3X2FsbCIsImRhc2hib2FyZHM6dmlld193aCIsImRhc2hib2FyZHM6dmlld190YXNrIiwiZGFzaGJvYXJkczp2aWV3X3N0b3JlIiwic2xhOmNvbmZpZ3VyZSIsInNsYTp2aWV3Iiwic3RvcmVfb3BzOnBvc19jaGVja291dCIsInN0b3JlX29wczppbnZvaWNlX2NyZWF0ZSIsInN0b3JlX29wczpzdG9yZV9zdGF0dXMiLCJzdG9yZV9vcHM6c3VyZ2VfdG9nZ2xlIiwic3RvcmVfb3BzOnN0b2NrX2NoZWNrIl0sImlhdCI6MTc1NzM5NTUzMiwiZXhwIjoxNzU4MDAwMzMyfQ.1eQz6E-q9Hr1psCgBYD89q_1z8C6K5AWoOY4wJEhZBY';

async function testPicklistFix() {
  try {
    console.log('🔍 Testing picklist items for wave 7...\n');

    // Step 1: Check current picklist items
    console.log('1. Checking current picklist items...');
    const currentItems = await axios.get(`${BASE_URL}/picklist/7/items?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Current items count:', currentItems.data.data.items.length);
    console.log('Current total items in wave:', currentItems.data.data.wave.totalItems);
    console.log('Response:', JSON.stringify(currentItems.data, null, 2));

    // Step 2: Create picklist items if none exist
    if (currentItems.data.data.items.length === 0) {
      console.log('\n2. No items found, creating picklist items...');
      const createItems = await axios.post(`${BASE_URL}/picklist/7/items/create`, {}, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Create items response:', JSON.stringify(createItems.data, null, 2));

      // Step 3: Check items again after creation
      console.log('\n3. Checking items after creation...');
      const newItems = await axios.get(`${BASE_URL}/picklist/7/items?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('New items count:', newItems.data.data.items.length);
      console.log('New total items in wave:', newItems.data.data.wave.totalItems);
      console.log('Response:', JSON.stringify(newItems.data, null, 2));
    } else {
      console.log('\n✅ Items already exist, no need to create them.');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testPicklistFix();

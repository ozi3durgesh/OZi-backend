import { OrderTransactionService, OrderTransactionData } from '../services/OrderTransactionService';
import { setupOrderDetailsTable } from './setupOrderDetailsTable';

/**
 * Test script for OrderTransactionService
 * Demonstrates comprehensive transaction handling for order placement
 */
async function testOrderTransaction() {
  try {
    console.log('🧪 Testing OrderTransactionService...\n');

    // Setup order_details table if it doesn't exist
    console.log('📋 Setting up order_details table...');
    await setupOrderDetailsTable();
    console.log('✅ Table setup completed\n');

    // Test data for order placement
    const testOrderData: OrderTransactionData = {
      user_id: 1, // Assuming user ID 1 exists
      order_amount: 150.00,
      coupon_discount_amount: 10.00,
      coupon_discount_title: 'WELCOME10',
      payment_method: 'cash_on_delivery',
      order_type: 'delivery',
      store_id: 1, // Assuming warehouse ID 1 exists
      delivery_charge: 5.00,
      delivery_address: '123 Test Street, Test City, TC 12345',
      latitude: 40.7128,
      longitude: -74.0060,
      contact_person_name: 'John Doe',
      contact_person_number: '+1234567890',
      is_guest: false,
      dm_tips: 2.00,
      cutlery: 1,
      order_note: 'Test order for transaction handling',
      schedule_at: Math.floor(Date.now() / 1000),
      zone_id: 1,
      module_id: 1,
      distance: 2.5,
      cart: [
        {
          sku: 1001,
          amount: 75.00,
          quantity: 2,
          // item_type: 'food' // Removed as not in CartItem interface
        },
        {
          sku: 1002,
          amount: 75.00,
          quantity: 1,
          // item_type: 'beverage' // Removed as not in CartItem interface
        }
      ],
      coupon_code: 'WELCOME10',
      tax_amount: 12.50,
      store_discount_amount: 0,
      original_delivery_charge: 5.00,
      is_scheduled: false,
      callback: 'https://example.com/callback',
      prescription_order: false,
      tax_status: 'included',
      processing_time: 30,
      unavailable_item_note: '',
      delivery_instruction: 'Please ring doorbell',
      tax_percentage: 10,
      additional_charge: 0,
      partial_payment: false,
      is_buy_now: false,
      create_new_user: false,
      address_type: 'home'
    };

    console.log('📝 Test Order Data:');
    console.log(JSON.stringify(testOrderData, null, 2));
    console.log('\n');

    // Execute order transaction
    console.log('🚀 Executing order placement transaction...');
    const startTime = Date.now();
    
    const result = await OrderTransactionService.executeOrderTransaction(testOrderData);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log('⏱️  Transaction execution time:', executionTime, 'ms');
    console.log('\n');

    if (result.success) {
      console.log('✅ Order placement successful!');
      console.log('📊 Transaction Result:');
      console.log('- Order ID:', result.orderId);
      console.log('- Internal ID:', result.internalId);
      console.log('- Message:', result.message);
      console.log('- Order Details Count:', result.orderDetails?.length || 0);
      
      if (result.orderDetails && result.orderDetails.length > 0) {
        console.log('\n📦 Order Details:');
        result.orderDetails.forEach((detail, index) => {
          console.log(`  ${index + 1}. ${(detail as any).product_name} (SKU: ${(detail as any).sku})`);
          console.log(`     Quantity: ${(detail as any).quantity}, Price: $${(detail as any).price}`);
        });
      }
    } else {
      console.log('❌ Order placement failed!');
      console.log('🚨 Error:', result.error);
    }

  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

/**
 * Test error scenarios
 */
async function testErrorScenarios() {
  console.log('\n🧪 Testing Error Scenarios...\n');

  // Test 1: Invalid user ID
  console.log('🔍 Test 1: Invalid User ID');
  const invalidUserData: OrderTransactionData = {
    user_id: 99999, // Non-existent user
    order_amount: 100.00,
    payment_method: 'cash_on_delivery',
    order_type: 'delivery',
    store_id: 1,
    delivery_address: 'Test Address',
    contact_person_name: 'Test User',
    contact_person_number: '+1234567890',
    cart: [
      {
        sku: 1001,
        amount: 100.00,
        quantity: 1
        // item_type: 'food' // Removed as not in CartItem interface
      }
    ]
  };

  try {
    const result = await OrderTransactionService.executeOrderTransaction(invalidUserData);
    if (!result.success) {
      console.log('✅ Expected error caught:', result.error);
    } else {
      console.log('❌ Unexpected success for invalid user');
    }
  } catch (error) {
    console.log('✅ Error handled properly:', error);
  }

  // Test 2: Empty cart
  console.log('\n🔍 Test 2: Empty Cart');
  const emptyCartData: OrderTransactionData = {
    user_id: 1,
    order_amount: 100.00,
    payment_method: 'cash_on_delivery',
    order_type: 'delivery',
    store_id: 1,
    delivery_address: 'Test Address',
    contact_person_name: 'Test User',
    contact_person_number: '+1234567890',
    cart: [] // Empty cart
  };

  try {
    const result = await OrderTransactionService.executeOrderTransaction(emptyCartData);
    if (!result.success) {
      console.log('✅ Expected error caught:', result.error);
    } else {
      console.log('❌ Unexpected success for empty cart');
    }
  } catch (error) {
    console.log('✅ Error handled properly:', error);
  }

  // Test 3: Missing required fields
  console.log('\n🔍 Test 3: Missing Required Fields');
  const missingFieldsData = {
    user_id: 1,
    // Missing order_amount, payment_method, etc.
    cart: [
      {
        sku: 1001,
        amount: 100.00,
        quantity: 1
        // item_type: 'food' // Removed as not in CartItem interface
      }
    ]
  } as any;

  try {
    const result = await OrderTransactionService.executeOrderTransaction(missingFieldsData);
    if (!result.success) {
      console.log('✅ Expected error caught:', result.error);
    } else {
      console.log('❌ Unexpected success for missing fields');
    }
  } catch (error) {
    console.log('✅ Error handled properly:', error);
  }
}

/**
 * Performance test
 */
async function testPerformance() {
  console.log('\n🚀 Performance Test...\n');

  const testData: OrderTransactionData = {
    user_id: 1,
    order_amount: 200.00,
    payment_method: 'cash_on_delivery',
    order_type: 'delivery',
    store_id: 1,
    delivery_address: 'Performance Test Address',
    contact_person_name: 'Performance User',
    contact_person_number: '+1234567890',
          cart: [
        {
          sku: 1001,
          amount: 50.00,
          quantity: 4
          // item_type: 'food' // Removed as not in CartItem interface
        }
      ]
  };

  const iterations = 5;
  const times: number[] = [];

  console.log(`Running ${iterations} iterations...`);

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const result = await OrderTransactionService.executeOrderTransaction(testData);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      if (result.success) {
        times.push(executionTime);
        console.log(`  Iteration ${i + 1}: ${executionTime}ms ✅`);
      } else {
        console.log(`  Iteration ${i + 1}: Failed - ${result.error} ❌`);
      }
    } catch (error) {
      console.log(`  Iteration ${i + 1}: Error - ${error} ❌`);
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log('\n📊 Performance Results:');
    console.log(`  Average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Minimum: ${minTime}ms`);
    console.log(`  Maximum: ${maxTime}ms`);
    console.log(`  Total successful: ${times.length}/${iterations}`);
  }
}

// Main execution
if (require.main === module) {
  const testType = process.argv[2] || 'all';
  
  async function runTests() {
    try {
      switch (testType) {
        case 'basic':
          await testOrderTransaction();
          break;
        case 'errors':
          await testErrorScenarios();
          break;
        case 'performance':
          await testPerformance();
          break;
        case 'all':
        default:
          await testOrderTransaction();
          await testErrorScenarios();
          await testPerformance();
          break;
      }
      
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    } catch (error) {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    }
  }

  runTests();
}

export { testOrderTransaction, testErrorScenarios, testPerformance };

/**
 * Manual Inventory System Test
 * Simple step-by-step testing for manual verification
 */

import sequelize from '../config/database';
const { InventoryService } = require('../services/InventoryService');
const { INVENTORY_OPERATIONS } = require('../config/inventoryConstants');

async function manualTest(): Promise<void> {
  console.log('🧪 Manual Inventory System Test');
  console.log('================================\n');

  try {
    // Step 1: Connect to database
    console.log('Step 1: Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');

    // Step 2: Initialize inventory service
    console.log('Step 2: Initializing inventory service...');
    const inventoryService = new InventoryService();
    console.log('✅ Inventory service initialized\n');

    // Step 3: Test SKU
    const testSku = 'MANUAL-TEST-SKU-001';
    console.log(`Step 3: Testing with SKU: ${testSku}\n`);

    // Step 4: Clean up any existing data
    console.log('Step 4: Cleaning up existing test data...');
    await sequelize.query('DELETE FROM inventory_logs WHERE sku = ?', { replacements: [testSku] });
    await sequelize.query('DELETE FROM inventory WHERE sku = ?', { replacements: [testSku] });
    console.log('✅ Test data cleaned up\n');

    // Step 5: Test PO Operation
    console.log('Step 5: Testing PO Operation (Purchase Order)...');
    const poResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.PO,
      quantity: 100,
      referenceId: 'MANUAL-PO-001',
      operationDetails: { supplier: 'Test Supplier', manual_test: true },
      performedBy: 1,
    });
    
    if (poResult.success) {
      console.log('✅ PO operation successful');
      console.log(`   Message: ${poResult.message}`);
    } else {
      console.log('❌ PO operation failed');
      console.log(`   Error: ${poResult.message}`);
    }
    console.log();

    // Step 6: Test GRN Operation
    console.log('Step 6: Testing GRN Operation (Goods Received)...');
    const grnResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.GRN,
      quantity: 80,
      referenceId: 'MANUAL-GRN-001',
      operationDetails: { batch: 'BATCH-001', manual_test: true },
      performedBy: 1,
    });
    
    if (grnResult.success) {
      console.log('✅ GRN operation successful');
      console.log(`   Message: ${grnResult.message}`);
    } else {
      console.log('❌ GRN operation failed');
      console.log(`   Error: ${grnResult.message}`);
    }
    console.log();

    // Step 7: Test Putaway Operation
    console.log('Step 7: Testing Putaway Operation...');
    const putawayResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.PUTAWAY,
      quantity: 70,
      referenceId: 'MANUAL-PUTAWAY-001',
      operationDetails: { bin_location: 'A-01-01', zone: 'Zone A', manual_test: true },
      performedBy: 1,
    });
    
    if (putawayResult.success) {
      console.log('✅ Putaway operation successful');
      console.log(`   Message: ${putawayResult.message}`);
    } else {
      console.log('❌ Putaway operation failed');
      console.log(`   Error: ${putawayResult.message}`);
    }
    console.log();

    // Step 8: Test Picklist Operation
    console.log('Step 8: Testing Picklist Operation...');
    const picklistResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.PICKLIST,
      quantity: 30,
      referenceId: 'MANUAL-PICKLIST-001',
      operationDetails: { wave_id: 'WAVE-001', order_ids: ['ORD-001', 'ORD-002'], manual_test: true },
      performedBy: 1,
    });
    
    if (picklistResult.success) {
      console.log('✅ Picklist operation successful');
      console.log(`   Message: ${picklistResult.message}`);
    } else {
      console.log('❌ Picklist operation failed');
      console.log(`   Error: ${picklistResult.message}`);
    }
    console.log();

    // Step 9: Test Return Operations
    console.log('Step 9: Testing Return Operations...');
    
    // Try and Buy Return
    const returnTryBuyResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.RETURN_TRY_AND_BUY,
      quantity: 5,
      referenceId: 'MANUAL-RETURN-TB-001',
      operationDetails: { return_type: 'try_and_buy', reason: 'customer_not_satisfied', manual_test: true },
      performedBy: 1,
    });
    
    if (returnTryBuyResult.success) {
      console.log('✅ Try & Buy return operation successful');
    } else {
      console.log('❌ Try & Buy return operation failed');
    }

    // Other Return
    const returnOtherResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.RETURN_OTHER,
      quantity: 3,
      referenceId: 'MANUAL-RETURN-OTHER-001',
      operationDetails: { return_type: 'defective', reason: 'product_defect', manual_test: true },
      performedBy: 1,
    });
    
    if (returnOtherResult.success) {
      console.log('✅ Other return operation successful');
    } else {
      console.log('❌ Other return operation failed');
    }
    console.log();

    // Step 10: Get Final Summary
    console.log('Step 10: Getting final inventory summary...');
    const summary = await inventoryService.getInventorySummary(testSku);
    
    if (summary) {
      console.log('✅ Inventory summary retrieved successfully');
      console.log('\n📊 Final Inventory Summary:');
      console.log('   SKU:', summary.sku);
      console.log('   PO Quantity:', summary.po_quantity);
      console.log('   GRN Quantity:', summary.grn_quantity);
      console.log('   Putaway Quantity:', summary.putaway_quantity);
      console.log('   Picklist Quantity:', summary.picklist_quantity);
      console.log('   Return Try & Buy:', summary.return_try_and_buy_quantity);
      console.log('   Return Other:', summary.return_other_quantity);
      console.log('   Total Available:', summary.total_available_quantity);
      console.log('   Available for Picking:', summary.available_for_picking);
      console.log('   Total Inventory:', summary.total_inventory);
    } else {
      console.log('❌ Failed to retrieve inventory summary');
    }
    console.log();

    // Step 11: Get Inventory Logs
    console.log('Step 11: Getting inventory logs...');
    const logs = await inventoryService.getInventoryLogs(testSku, 10, 0);
    
    if (logs && logs.length > 0) {
      console.log('✅ Inventory logs retrieved successfully');
      console.log('\n📋 Recent Inventory Logs:');
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.operation_type.toUpperCase()}: ${log.quantity_change > 0 ? '+' : ''}${log.quantity_change} units`);
        console.log(`      Previous: ${log.previous_quantity} → New: ${log.new_quantity}`);
        console.log(`      Reference: ${log.reference_id}`);
        console.log(`      Time: ${log.created_at}`);
        console.log();
      });
    } else {
      console.log('❌ No inventory logs found');
    }

    // Step 12: Test Availability Check
    console.log('Step 12: Testing availability check...');
    const availability = await inventoryService.checkInventoryAvailability({
      sku: testSku,
      requiredQuantity: 20,
      operation: INVENTORY_OPERATIONS.PUTAWAY,
    });
    
    console.log(`   Available: ${availability.available}`);
    console.log(`   Current Quantity: ${availability.currentQuantity}`);
    console.log(`   Message: ${availability.message}`);
    console.log();

    // Step 13: Clean up
    console.log('Step 13: Cleaning up test data...');
    await sequelize.query('DELETE FROM inventory_logs WHERE sku = ?', { replacements: [testSku] });
    await sequelize.query('DELETE FROM inventory WHERE sku = ?', { replacements: [testSku] });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 Manual test completed successfully!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Manual test failed:', error);
    console.log('=====================================');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  manualTest().catch(console.error);
}

export { manualTest };

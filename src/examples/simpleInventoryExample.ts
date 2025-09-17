/**
 * Simple Inventory System Usage Example
 * This demonstrates basic usage of the inventory system
 */

const InventoryService = require('../services/InventoryService').default;
const { INVENTORY_OPERATIONS } = require('../config/inventoryConstants');

async function simpleInventoryExample() {
  try {
    console.log('🚀 Simple Inventory Example...\n');

    const inventoryService = new InventoryService();
    const testSku = 'EXAMPLE-SKU-001';

    // 1. Add PO quantity
    console.log('📦 Adding PO quantity...');
    const poResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.PO,
      quantity: 100,
      referenceId: 'PO-001',
      operationDetails: { supplier: 'Test Supplier' },
      performedBy: 1,
    });
    console.log('   Result:', poResult.message);

    // 2. Add GRN quantity
    console.log('\n📋 Adding GRN quantity...');
    const grnResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.GRN,
      quantity: 80,
      referenceId: 'GRN-001',
      operationDetails: { batch: 'BATCH-001' },
      performedBy: 1,
    });
    console.log('   Result:', grnResult.message);

    // 3. Add Putaway quantity
    console.log('\n🏪 Adding Putaway quantity...');
    const putawayResult = await inventoryService.updateInventory({
      sku: testSku,
      operation: INVENTORY_OPERATIONS.PUTAWAY,
      quantity: 70,
      referenceId: 'PUTAWAY-001',
      operationDetails: { bin: 'A-01-01' },
      performedBy: 1,
    });
    console.log('   Result:', putawayResult.message);

    // 4. Get inventory summary
    console.log('\n📊 Inventory Summary:');
    const summary = await inventoryService.getInventorySummary(testSku);
    if (summary) {
      console.log('   SKU:', summary.sku);
      console.log('   PO:', summary.po_quantity);
      console.log('   GRN:', summary.grn_quantity);
      console.log('   Putaway:', summary.putaway_quantity);
      console.log('   Available:', summary.total_available_quantity);
    }

    // 5. Get recent logs
    console.log('\n📋 Recent Logs:');
    const logs = await inventoryService.getInventoryLogs(testSku, 5, 0);
    logs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.operation_type}: ${log.quantity_change} units`);
    });

    console.log('\n✅ Example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  simpleInventoryExample();
}

export { simpleInventoryExample };

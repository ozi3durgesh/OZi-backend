/**
 * Comprehensive Inventory System Test Suite
 * This file tests all aspects of the inventory management system
 */

import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
const InventoryService = require('../services/InventoryService').default;
const { INVENTORY_OPERATIONS } = require('../config/inventoryConstants');

class InventoryTester {
  private inventoryService: any;
  private testResults: any[] = [];

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Inventory System Tests...\n');

    try {
      // Test 1: Database Connection
      await this.testDatabaseConnection();

      // Test 2: Basic CRUD Operations
      await this.testBasicOperations();

      // Test 3: Inventory Operations
      await this.testInventoryOperations();

      // Test 4: Error Handling
      await this.testErrorHandling();

      // Test 5: Bulk Operations
      await this.testBulkOperations();

      // Test 6: Database Triggers (if applicable)
      await this.testDatabaseTriggers();

      // Test 7: Performance Test
      await this.testPerformance();

      // Display Results
      this.displayResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  /**
   * Test 1: Database Connection
   */
  async testDatabaseConnection(): Promise<void> {
    console.log('🔌 Test 1: Database Connection');
    
    try {
      await sequelize.authenticate();
      this.addResult('Database Connection', true, 'Connected successfully');
      console.log('   ✅ Database connection successful');
    } catch (error) {
      this.addResult('Database Connection', false, `Connection failed: ${error}`);
      console.log('   ❌ Database connection failed');
    }
  }

  /**
   * Test 2: Basic CRUD Operations
   */
  async testBasicOperations(): Promise<void> {
    console.log('\n📝 Test 2: Basic CRUD Operations');
    
    const testSku = 'TEST-SKU-CRUD-001';
    
    try {
      // Clean up any existing test data
      await this.cleanupTestData(testSku);

      // Test Create
      const createResult = await this.inventoryService.updateInventory({
        sku: testSku,
        operation: INVENTORY_OPERATIONS.PO,
        quantity: 100,
        referenceId: 'TEST-PO-001',
        operationDetails: { test: 'create' },
        performedBy: 1,
      });

      if (createResult.success) {
        this.addResult('Create Operation', true, 'Inventory record created');
        console.log('   ✅ Create operation successful');
      } else {
        this.addResult('Create Operation', false, createResult.message);
        console.log('   ❌ Create operation failed');
      }

      // Test Read
      const summary = await this.inventoryService.getInventorySummary(testSku);
      if (summary && summary.sku === testSku) {
        this.addResult('Read Operation', true, 'Inventory summary retrieved');
        console.log('   ✅ Read operation successful');
      } else {
        this.addResult('Read Operation', false, 'Failed to retrieve inventory');
        console.log('   ❌ Read operation failed');
      }

      // Test Update
      const updateResult = await this.inventoryService.updateInventory({
        sku: testSku,
        operation: INVENTORY_OPERATIONS.GRN,
        quantity: 50,
        referenceId: 'TEST-GRN-001',
        operationDetails: { test: 'update' },
        performedBy: 1,
      });

      if (updateResult.success) {
        this.addResult('Update Operation', true, 'Inventory updated');
        console.log('   ✅ Update operation successful');
      } else {
        this.addResult('Update Operation', false, updateResult.message);
        console.log('   ❌ Update operation failed');
      }

      // Clean up
      await this.cleanupTestData(testSku);

    } catch (error) {
      this.addResult('Basic CRUD Operations', false, `Error: ${error}`);
      console.log('   ❌ Basic operations test failed');
    }
  }

  /**
   * Test 3: Inventory Operations
   */
  async testInventoryOperations(): Promise<void> {
    console.log('\n📦 Test 3: Inventory Operations');
    
    const testSku = 'TEST-SKU-OPS-001';
    
    try {
      await this.cleanupTestData(testSku);

      // Test PO Operation
      await this.testOperation(testSku, INVENTORY_OPERATIONS.PO, 100, 'PO-001');

      // Test GRN Operation
      await this.testOperation(testSku, INVENTORY_OPERATIONS.GRN, 80, 'GRN-001');

      // Test Putaway Operation
      await this.testOperation(testSku, INVENTORY_OPERATIONS.PUTAWAY, 70, 'PUTAWAY-001');

      // Test Picklist Operation
      await this.testOperation(testSku, INVENTORY_OPERATIONS.PICKLIST, 30, 'PICKLIST-001');

      // Test Return Operations
      await this.testOperation(testSku, INVENTORY_OPERATIONS.RETURN_TRY_AND_BUY, 5, 'RETURN-TB-001');
      await this.testOperation(testSku, INVENTORY_OPERATIONS.RETURN_OTHER, 3, 'RETURN-OTHER-001');

      // Test Availability Check
      const availability = await this.inventoryService.checkInventoryAvailability({
        sku: testSku,
        requiredQuantity: 20,
        operation: INVENTORY_OPERATIONS.PUTAWAY,
      });

      if (availability.available) {
        this.addResult('Availability Check', true, 'Availability check successful');
        console.log('   ✅ Availability check successful');
      } else {
        this.addResult('Availability Check', false, availability.message);
        console.log('   ❌ Availability check failed');
      }

      // Test Final Summary
      const finalSummary = await this.inventoryService.getInventorySummary(testSku);
      if (finalSummary) {
        console.log('   📊 Final Summary:');
        console.log(`      PO: ${finalSummary.po_quantity}`);
        console.log(`      GRN: ${finalSummary.grn_quantity}`);
        console.log(`      Putaway: ${finalSummary.putaway_quantity}`);
        console.log(`      Picklist: ${finalSummary.picklist_quantity}`);
        console.log(`      Available: ${finalSummary.total_available_quantity}`);
        this.addResult('Final Summary', true, 'Summary retrieved successfully');
      }

      await this.cleanupTestData(testSku);

    } catch (error) {
      this.addResult('Inventory Operations', false, `Error: ${error}`);
      console.log('   ❌ Inventory operations test failed');
    }
  }

  /**
   * Test individual operation
   */
  async testOperation(sku: string, operation: string, quantity: number, referenceId: string): Promise<void> {
    const result = await this.inventoryService.updateInventory({
      sku,
      operation: operation as any,
      quantity,
      referenceId,
      operationDetails: { test: true },
      performedBy: 1,
    });

    if (result.success) {
      console.log(`   ✅ ${operation} operation successful (+${quantity})`);
    } else {
      console.log(`   ❌ ${operation} operation failed: ${result.message}`);
    }
  }

  /**
   * Test 4: Error Handling
   */
  async testErrorHandling(): Promise<void> {
    console.log('\n❌ Test 4: Error Handling');
    
    try {
      // Test invalid operation
      const invalidResult = await this.inventoryService.updateInventory({
        sku: 'TEST-ERROR-001',
        operation: 'invalid_operation' as any,
        quantity: 10,
        referenceId: 'ERROR-001',
      });

      if (!invalidResult.success) {
        this.addResult('Invalid Operation Error', true, 'Error handled correctly');
        console.log('   ✅ Invalid operation error handled correctly');
      } else {
        this.addResult('Invalid Operation Error', false, 'Error not handled');
        console.log('   ❌ Invalid operation error not handled');
      }

      // Test negative quantity
      const negativeResult = await this.inventoryService.updateInventory({
        sku: 'TEST-ERROR-002',
        operation: INVENTORY_OPERATIONS.PICKLIST,
        quantity: -1000, // Large negative number
        referenceId: 'ERROR-002',
      });

      if (!negativeResult.success) {
        this.addResult('Negative Quantity Error', true, 'Error handled correctly');
        console.log('   ✅ Negative quantity error handled correctly');
      } else {
        this.addResult('Negative Quantity Error', false, 'Error not handled');
        console.log('   ❌ Negative quantity error not handled');
      }

    } catch (error) {
      this.addResult('Error Handling', false, `Error: ${error}`);
      console.log('   ❌ Error handling test failed');
    }
  }

  /**
   * Test 5: Bulk Operations
   */
  async testBulkOperations(): Promise<void> {
    console.log('\n📦 Test 5: Bulk Operations');
    
    try {
      const bulkUpdates = [
        {
          sku: 'BULK-TEST-001',
          operation: INVENTORY_OPERATIONS.PO,
          quantity: 100,
          referenceId: 'BULK-PO-001',
          operationDetails: { test: 'bulk' },
          performedBy: 1,
        },
        {
          sku: 'BULK-TEST-002',
          operation: INVENTORY_OPERATIONS.PO,
          quantity: 200,
          referenceId: 'BULK-PO-001',
          operationDetails: { test: 'bulk' },
          performedBy: 1,
        },
        {
          sku: 'BULK-TEST-003',
          operation: INVENTORY_OPERATIONS.PO,
          quantity: 150,
          referenceId: 'BULK-PO-001',
          operationDetails: { test: 'bulk' },
          performedBy: 1,
        },
      ];

      const bulkResult = await this.inventoryService.bulkUpdateInventory(bulkUpdates);
      
      if (bulkResult.success && bulkResult.results.length === 3) {
        this.addResult('Bulk Operations', true, 'Bulk update successful');
        console.log('   ✅ Bulk operations successful');
      } else {
        this.addResult('Bulk Operations', false, 'Bulk update failed');
        console.log('   ❌ Bulk operations failed');
      }

      // Clean up bulk test data
      for (const update of bulkUpdates) {
        await this.cleanupTestData(update.sku);
      }

    } catch (error) {
      this.addResult('Bulk Operations', false, `Error: ${error}`);
      console.log('   ❌ Bulk operations test failed');
    }
  }

  /**
   * Test 6: Database Triggers
   */
  async testDatabaseTriggers(): Promise<void> {
    console.log('\n🔧 Test 6: Database Triggers');
    
    try {
      // Check if triggers exist
      const triggers = await sequelize.query(
        "SHOW TRIGGERS LIKE 'grn_lines'",
        { type: QueryTypes.SELECT }
      );

      if ((triggers as any[]).length > 0) {
        this.addResult('Database Triggers', true, `${(triggers as any[]).length} triggers found`);
        console.log(`   ✅ Found ${(triggers as any[]).length} triggers for grn_lines`);
      } else {
        this.addResult('Database Triggers', false, 'No triggers found');
        console.log('   ⚠️  No triggers found (may not be set up yet)');
      }

    } catch (error) {
      this.addResult('Database Triggers', false, `Error: ${error}`);
      console.log('   ❌ Database triggers test failed');
    }
  }

  /**
   * Test 7: Performance Test
   */
  async testPerformance(): Promise<void> {
    console.log('\n⚡ Test 7: Performance Test');
    
    const testSku = 'PERF-TEST-001';
    const iterations = 10;
    
    try {
      await this.cleanupTestData(testSku);

      const startTime = Date.now();

      // Perform multiple operations
      for (let i = 0; i < iterations; i++) {
        await this.inventoryService.updateInventory({
          sku: testSku,
          operation: INVENTORY_OPERATIONS.PO,
          quantity: 10,
          referenceId: `PERF-${i}`,
          operationDetails: { iteration: i },
          performedBy: 1,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      if (avgTime < 1000) { // Less than 1 second per operation
        this.addResult('Performance Test', true, `Avg: ${avgTime.toFixed(2)}ms per operation`);
        console.log(`   ✅ Performance test passed (${avgTime.toFixed(2)}ms avg)`);
      } else {
        this.addResult('Performance Test', false, `Slow: ${avgTime.toFixed(2)}ms avg`);
        console.log(`   ⚠️  Performance test slow (${avgTime.toFixed(2)}ms avg)`);
      }

      await this.cleanupTestData(testSku);

    } catch (error) {
      this.addResult('Performance Test', false, `Error: ${error}`);
      console.log('   ❌ Performance test failed');
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(sku: string): Promise<void> {
    try {
      await sequelize.query(
        'DELETE FROM inventory_logs WHERE sku = ?',
        { replacements: [sku] }
      );
      await sequelize.query(
        'DELETE FROM inventory WHERE sku = ?',
        { replacements: [sku] }
      );
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Add test result
   */
  addResult(testName: string, passed: boolean, message: string): void {
    this.testResults.push({
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Display test results
   */
  displayResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const successRate = (passed / total) * 100;

    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });

    console.log('=' .repeat(50));
    console.log(`📈 Overall Success Rate: ${passed}/${total} (${successRate.toFixed(1)}%)`);
    
    if (successRate >= 80) {
      console.log('🎉 Inventory System is working well!');
    } else if (successRate >= 60) {
      console.log('⚠️  Inventory System has some issues that need attention.');
    } else {
      console.log('❌ Inventory System has significant issues that need to be fixed.');
    }
  }
}

/**
 * Run the test suite
 */
async function runInventoryTests(): Promise<void> {
  const tester = new InventoryTester();
  await tester.runAllTests();
}

// Run if this file is executed directly
if (require.main === module) {
  runInventoryTests().catch(console.error);
}

export { runInventoryTests, InventoryTester };

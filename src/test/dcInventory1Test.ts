import { DCInventory1Service } from '../services/DCInventory1Service';
import DCInventory1 from '../models/DCInventory1';

/**
 * Test script for DC Inventory 1 functionality
 * This demonstrates the automatic updates for different scenarios
 */
export class DCInventory1Test {
  
  /**
   * Test Case 1: Successful PO Flow (sku_id: 100000101001, dc_id: 1)
   */
  static async testSuccessfulPOFlow(): Promise<void> {
    console.log('🧪 Testing Case 1: Successful PO Flow (sku_id: 100000101001, dc_id: 1)');
    
    try {
      // Step 1: PO Raised (50 items)
      console.log('Step 1: PO Raised (50 items)');
      await DCInventory1Service.updateOnPORaise('100000101001', 1, 50);
      
      // Step 2: PO Approved (50 items)
      console.log('Step 2: PO Approved (50 items)');
      await DCInventory1Service.updateOnPOApprove('100000101001', 1, 50);
      
      // Step 3: SKU Split removed from DC Inventory 1
      console.log('Step 3: SKU Split operations removed from DC Inventory 1');
      
      // Step 4: GRN Done (50 items received)
      console.log('Step 4: GRN Done (50 items received)');
      await DCInventory1Service.updateOnGRNDone('100000101001', 1, 50);
      
      // Verify final state
      const record = await DCInventory1Service.getBySkuIdAndDcId('100000101001', 1);
      console.log('✅ Final state:', JSON.stringify(record, null, 2));
      
    } catch (error) {
      console.error('❌ Test Case 1 failed:', error);
    }
  }

  /**
   * Test Case 2: Rejected PO (sku_id: 100000101002, dc_id: 1)
   */
  static async testRejectedPO(): Promise<void> {
    console.log('\n🧪 Testing Case 2: Rejected PO (sku_id: 100000101002, dc_id: 1)');
    
    try {
      // Step 1: PO Raised (50 items)
      console.log('Step 1: PO Raised (50 items)');
      await DCInventory1Service.updateOnPORaise('100000101002', 1, 50);
      
      // Step 2: PO Rejected (no further updates)
      console.log('Step 2: PO Rejected (no further updates)');
      // No approval or GRN updates
      
      // Verify final state
      const record = await DCInventory1Service.getBySkuIdAndDcId('100000101002', 1);
      console.log('✅ Final state:', JSON.stringify(record, null, 2));
      
    } catch (error) {
      console.error('❌ Test Case 2 failed:', error);
    }
  }

  /**
   * Test Case 3: Additional PO on Same SKU (sku_id: 100000101001, dc_id: 1)
   */
  static async testAdditionalPO(): Promise<void> {
    console.log('\n🧪 Testing Case 3: Additional PO on Same SKU (sku_id: 100000101001, dc_id: 1)');
    
    try {
      // Additional PO raised (50 more items)
      console.log('Additional PO raised (50 more items)');
      await DCInventory1Service.updateOnPORaise('100000101001', 1, 50);
      
      // Verify final state
      const record = await DCInventory1Service.getBySkuIdAndDcId('100000101001', 1);
      console.log('✅ Final state:', JSON.stringify(record, null, 2));
      
    } catch (error) {
      console.error('❌ Test Case 3 failed:', error);
    }
  }

  /**
   * Test Case 4: Same SKU in Different DC (sku_id: 100000101001, dc_id: 2)
   */
  static async testSameSkuDifferentDc(): Promise<void> {
    console.log('\n🧪 Testing Case 4: Same SKU in Different DC (sku_id: 100000101001, dc_id: 2)');
    
    try {
      // PO raised for same SKU but different DC
      console.log('PO raised for same SKU but different DC');
      await DCInventory1Service.updateOnPORaise('100000101001', 2, 30);
      
      // Verify final state
      const record = await DCInventory1Service.getBySkuIdAndDcId('100000101001', 2);
      console.log('✅ Final state:', JSON.stringify(record, null, 2));
      
    } catch (error) {
      console.error('❌ Test Case 4 failed:', error);
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Starting DC Inventory 1 Tests...\n');
    
    await this.testSuccessfulPOFlow();
    await this.testRejectedPO();
    await this.testAdditionalPO();
    await this.testSameSkuDifferentDc();
    
    console.log('\n✅ All tests completed!');
  }

  /**
   * Clean up test data
   */
  static async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      await DCInventory1.destroy({
        where: {
          sku_id: ['100000101001', '100000101002']
        }
      });
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Export for use in other files
export default DCInventory1Test;
import { DCInventory1Service } from '../services/DCInventory1Service';
import DCInventory1 from '../models/DCInventory1';

/**
 * Test script for DC Inventory 1 functionality
 * This demonstrates the automatic updates for different scenarios
 */
export class DCInventory1Test {
  
  /**
   * Test Case 1: Successful PO Flow (catalogue_id: 1000000)
   */
  static async testSuccessfulPOFlow(): Promise<void> {
    console.log('🧪 Testing Case 1: Successful PO Flow (catalogue_id: 1000000)');
    
    try {
      // Step 1: PO Raised (50 items)
      console.log('Step 1: PO Raised (50 items)');
      await DCInventory1Service.updateOnPORaise('100000101001', '1000000', 50);
      
      // Step 2: PO Approved (50 items)
      console.log('Step 2: PO Approved (50 items)');
      await DCInventory1Service.updateOnPOApprove('100000101001', 50);
      
      // Step 3: SKU Split removed from DC Inventory 1
      console.log('Step 3: SKU Split operations removed from DC Inventory 1');
      
      // Step 4: GRN Done (50 items received)
      console.log('Step 4: GRN Done (50 items received)');
      await DCInventory1Service.updateOnGRNDone('100000101001', 50);
      
      // Verify final state
      const record = await DCInventory1Service.getByCatalogueId('1000000');
      console.log('✅ Final state:', JSON.stringify(record, null, 2));
      
    } catch (error) {
      console.error('❌ Test Case 1 failed:', error);
    }
  }

  /**
   * Test Case 2: Rejected PO (catalogue_id: 1000001)
   */
  static async testRejectedPO(): Promise<void> {
    console.log('\n🧪 Testing Case 2: Rejected PO (catalogue_id: 1000001)');
    
    try {
      // Step 1: PO Raised (50 items)
      console.log('Step 1: PO Raised (50 items)');
      await DCInventory1Service.updateOnPORaise('100000101002', '1000001', 50);
      
      // Step 2: PO Rejected (no further updates)
      console.log('Step 2: PO Rejected (no further updates)');
      // No approval or GRN updates
      
      // Verify final state
      const record = await DCInventory1Service.getByCatalogueId('1000001');
      console.log('✅ Final state:', JSON.stringify(record, null, 2));
      
    } catch (error) {
      console.error('❌ Test Case 2 failed:', error);
    }
  }

  /**
   * Test Case 3: Additional PO on Same Catalogue (catalogue_id: 1000000)
   */
  static async testAdditionalPO(): Promise<void> {
    console.log('\n🧪 Testing Case 3: Additional PO on Same Catalogue (catalogue_id: 1000000)');
    
    try {
      // Additional PO raised (50 more items)
      console.log('Additional PO raised (50 more items)');
      await DCInventory1Service.updateOnPORaise('100000101001', '1000000', 50);
      
      // Verify final state
      const record = await DCInventory1Service.getByCatalogueId('1000000');
      console.log('✅ Final state:', JSON.stringify(record, null, 2));
      
    } catch (error) {
      console.error('❌ Test Case 3 failed:', error);
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
          catalogue_id: ['1000000', '1000001']
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

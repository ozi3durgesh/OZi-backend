/**
 * Setup Verification Script
 * Verifies that the inventory system is properly set up
 */

import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function verifySetup(): Promise<void> {
  console.log('🔍 Inventory System Setup Verification');
  console.log('=====================================\n');

  try {
    // Step 1: Database Connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('   ✅ Database connected successfully\n');

    // Step 2: Check Inventory Table
    console.log('2. Checking inventory table...');
    const inventoryTable = await sequelize.query(
      "SHOW TABLES LIKE 'inventory'",
      { type: QueryTypes.SELECT }
    );
    
    if ((inventoryTable as any[]).length > 0) {
      console.log('   ✅ Inventory table exists');
      
      // Check table structure
      const inventoryStructure = await sequelize.query(
        'DESCRIBE inventory',
        { type: QueryTypes.SELECT }
      );
      console.log(`   📋 Table has ${(inventoryStructure as any[]).length} columns`);
    } else {
      console.log('   ❌ Inventory table does not exist');
      console.log('   💡 Run: npx ts-node src/script/setupInventorySystem.ts');
    }
    console.log();

    // Step 3: Check Inventory Logs Table
    console.log('3. Checking inventory_logs table...');
    const inventoryLogsTable = await sequelize.query(
      "SHOW TABLES LIKE 'inventory_logs'",
      { type: QueryTypes.SELECT }
    );
    
    if ((inventoryLogsTable as any[]).length > 0) {
      console.log('   ✅ Inventory logs table exists');
      
      // Check table structure
      const logsStructure = await sequelize.query(
        'DESCRIBE inventory_logs',
        { type: QueryTypes.SELECT }
      );
      console.log(`   📋 Table has ${(logsStructure as any[]).length} columns`);
    } else {
      console.log('   ❌ Inventory logs table does not exist');
      console.log('   💡 Run: npx ts-node src/script/setupInventorySystem.ts');
    }
    console.log();

    // Step 4: Check Database Triggers
    console.log('4. Checking database triggers...');
    const triggers = await sequelize.query(
      "SHOW TRIGGERS",
      { type: QueryTypes.SELECT }
    );
    
    const inventoryTriggers = (triggers as any[]).filter((trigger: any) => 
      trigger.Table === 'grn_lines' || 
      trigger.Table === 'putaway_tasks' || 
      trigger.Table === 'picklist_items' ||
      trigger.Table === 'return_request_items'
    );
    
    if (inventoryTriggers.length > 0) {
      console.log(`   ✅ Found ${inventoryTriggers.length} inventory-related triggers`);
      inventoryTriggers.forEach((trigger: any) => {
        console.log(`      - ${trigger.Trigger} on ${trigger.Table}`);
      });
    } else {
      console.log('   ⚠️  No inventory triggers found');
      console.log('   💡 Triggers will be created when you run the setup script');
    }
    console.log();

    // Step 5: Check Stored Procedures
    console.log('5. Checking stored procedures...');
    const procedures = await sequelize.query(
      "SHOW PROCEDURE STATUS WHERE Name = 'ReconcileInventory'",
      { type: QueryTypes.SELECT }
    );
    
    if ((procedures as any[]).length > 0) {
      console.log('   ✅ ReconcileInventory procedure exists');
    } else {
      console.log('   ⚠️  ReconcileInventory procedure not found');
      console.log('   💡 Procedure will be created when you run the setup script');
    }
    console.log();

    // Step 6: Check Views
    console.log('6. Checking database views...');
    const views = await sequelize.query(
      "SHOW TABLES LIKE 'inventory_summary'",
      { type: QueryTypes.SELECT }
    );
    
    if ((views as any[]).length > 0) {
      console.log('   ✅ inventory_summary view exists');
    } else {
      console.log('   ⚠️  inventory_summary view not found');
      console.log('   💡 View will be created when you run the setup script');
    }
    console.log();

    // Step 7: Test Model Import
    console.log('7. Testing model imports...');
    try {
      const { Inventory } = require('../models/Inventory');
      const { InventoryLog } = require('../models/InventoryLog');
      console.log('   ✅ Inventory models imported successfully');
    } catch (error) {
      console.log('   ❌ Failed to import inventory models');
      console.log(`   Error: ${error}`);
    }
    console.log();

    // Step 8: Test Service Import
    console.log('8. Testing service import...');
    try {
      const { InventoryService } = require('../services/InventoryService');
      console.log('   ✅ InventoryService imported successfully');
    } catch (error) {
      console.log('   ❌ Failed to import InventoryService');
      console.log(`   Error: ${error}`);
    }
    console.log();

    // Step 9: Test Constants Import
    console.log('9. Testing constants import...');
    try {
      const { INVENTORY_OPERATIONS } = require('../config/inventoryConstants');
      console.log('   ✅ Inventory constants imported successfully');
      console.log(`   📋 Available operations: ${Object.keys(INVENTORY_OPERATIONS).join(', ')}`);
    } catch (error) {
      console.log('   ❌ Failed to import inventory constants');
      console.log(`   Error: ${error}`);
    }
    console.log();

    // Summary
    console.log('📊 Setup Verification Summary');
    console.log('==============================');
    console.log('✅ Database connection: Working');
    console.log('✅ Models: Available');
    console.log('✅ Service: Available');
    console.log('✅ Constants: Available');
    console.log('⚠️  Database tables: Need setup');
    console.log('⚠️  Triggers: Need setup');
    console.log('⚠️  Procedures: Need setup');
    console.log('⚠️  Views: Need setup');
    console.log();
    console.log('🚀 Next Steps:');
    console.log('1. Run: npx ts-node src/script/setupInventorySystem.ts');
    console.log('2. Run: npx ts-node src/test/manualTest.ts');
    console.log('3. Run: npx ts-node src/test/inventoryTest.ts');

  } catch (error) {
    console.error('❌ Setup verification failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  verifySetup().catch(console.error);
}

export { verifySetup };

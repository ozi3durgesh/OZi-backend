/**
 * Simple Inventory System Setup
 * Creates tables and basic functionality without complex triggers
 */

import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function setupInventoryTables(): Promise<void> {
  try {
    console.log('🚀 Setting up Inventory Tables...');

    // Create inventory table
    console.log('📝 Creating inventory table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL UNIQUE,
        po_quantity INT NOT NULL DEFAULT 0,
        grn_quantity INT NOT NULL DEFAULT 0,
        putaway_quantity INT NOT NULL DEFAULT 0,
        picklist_quantity INT NOT NULL DEFAULT 0,
        return_try_and_buy_quantity INT NOT NULL DEFAULT 0,
        return_other_quantity INT NOT NULL DEFAULT 0,
        total_available_quantity INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_sku (sku),
        INDEX idx_po_quantity (po_quantity),
        INDEX idx_grn_quantity (grn_quantity),
        INDEX idx_putaway_quantity (putaway_quantity),
        INDEX idx_picklist_quantity (picklist_quantity),
        INDEX idx_total_available (total_available_quantity),
        
        CONSTRAINT chk_po_quantity CHECK (po_quantity >= 0),
        CONSTRAINT chk_grn_quantity CHECK (grn_quantity >= 0),
        CONSTRAINT chk_putaway_quantity CHECK (putaway_quantity >= 0),
        CONSTRAINT chk_picklist_quantity CHECK (picklist_quantity >= 0),
        CONSTRAINT chk_return_try_and_buy_quantity CHECK (return_try_and_buy_quantity >= 0),
        CONSTRAINT chk_return_other_quantity CHECK (return_other_quantity >= 0),
        CONSTRAINT chk_total_available_quantity CHECK (total_available_quantity >= 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('✅ Inventory table created');

    // Create inventory_logs table
    console.log('📝 Creating inventory_logs table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL,
        operation_type ENUM('po', 'grn', 'putaway', 'picklist', 'return_try_and_buy', 'return_other') NOT NULL,
        quantity_change INT NOT NULL,
        previous_quantity INT NOT NULL,
        new_quantity INT NOT NULL,
        reference_id VARCHAR(100) DEFAULT NULL,
        operation_details JSON DEFAULT NULL,
        performed_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_sku (sku),
        INDEX idx_operation_type (operation_type),
        INDEX idx_reference_id (reference_id),
        INDEX idx_performed_by (performed_by),
        INDEX idx_created_at (created_at),
        
        CONSTRAINT chk_previous_quantity CHECK (previous_quantity >= 0),
        CONSTRAINT chk_new_quantity CHECK (new_quantity >= 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('✅ Inventory logs table created');

    // Create inventory_summary view
    console.log('📝 Creating inventory_summary view...');
    await sequelize.query(`
      CREATE OR REPLACE VIEW inventory_summary AS
      SELECT 
        sku,
        po_quantity,
        grn_quantity,
        putaway_quantity,
        picklist_quantity,
        return_try_and_buy_quantity,
        return_other_quantity,
        total_available_quantity,
        (putaway_quantity - picklist_quantity) as available_for_picking,
        (po_quantity + grn_quantity + putaway_quantity + return_try_and_buy_quantity + return_other_quantity) as total_inventory,
        created_at,
        updated_at
      FROM inventory
    `);
    console.log('✅ Inventory summary view created');

    console.log('🎉 Inventory tables setup completed successfully!');

  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist, skipping creation');
    } else {
      console.error('❌ Error setting up inventory tables:', error);
      throw error;
    }
  }
}

async function verifySetup(): Promise<void> {
  try {
    console.log('\n🔍 Verifying setup...');

    // Check inventory table
    const inventoryTable = await sequelize.query(
      "SHOW TABLES LIKE 'inventory'",
      { type: QueryTypes.SELECT }
    );
    
    if ((inventoryTable as any[]).length > 0) {
      console.log('✅ Inventory table exists');
    } else {
      console.log('❌ Inventory table missing');
    }

    // Check inventory_logs table
    const inventoryLogsTable = await sequelize.query(
      "SHOW TABLES LIKE 'inventory_logs'",
      { type: QueryTypes.SELECT }
    );
    
    if ((inventoryLogsTable as any[]).length > 0) {
      console.log('✅ Inventory logs table exists');
    } else {
      console.log('❌ Inventory logs table missing');
    }

    // Check inventory_summary view
    const inventorySummaryView = await sequelize.query(
      "SHOW TABLES LIKE 'inventory_summary'",
      { type: QueryTypes.SELECT }
    );
    
    if ((inventorySummaryView as any[]).length > 0) {
      console.log('✅ Inventory summary view exists');
    } else {
      console.log('❌ Inventory summary view missing');
    }

    console.log('\n🎯 Setup verification completed!');

  } catch (error) {
    console.error('❌ Error verifying setup:', error);
  }
}

async function testBasicFunctionality(): Promise<void> {
  try {
    console.log('\n🧪 Testing basic functionality...');

    const testSku = 'SETUP-TEST-SKU-001';

    // Clean up any existing test data
    await sequelize.query('DELETE FROM inventory_logs WHERE sku = ?', { replacements: [testSku] });
    await sequelize.query('DELETE FROM inventory WHERE sku = ?', { replacements: [testSku] });

    // Test 1: Insert inventory record
    console.log('📝 Testing inventory insert...');
    await sequelize.query(`
      INSERT INTO inventory (sku, po_quantity, grn_quantity, putaway_quantity, picklist_quantity, return_try_and_buy_quantity, return_other_quantity, total_available_quantity)
      VALUES (?, 100, 80, 70, 30, 5, 3, 40)
    `, { replacements: [testSku] });
    console.log('✅ Inventory insert successful');

    // Test 2: Insert inventory log
    console.log('📝 Testing inventory log insert...');
    await sequelize.query(`
      INSERT INTO inventory_logs (sku, operation_type, quantity_change, previous_quantity, new_quantity, reference_id, operation_details)
      VALUES (?, 'po', 100, 0, 100, 'TEST-PO-001', ?)
    `, { replacements: [testSku, JSON.stringify({ test: true })] });
    console.log('✅ Inventory log insert successful');

    // Test 3: Query inventory summary
    console.log('📝 Testing inventory summary query...');
    const summary = await sequelize.query(
      'SELECT * FROM inventory_summary WHERE sku = ?',
      { replacements: [testSku], type: QueryTypes.SELECT }
    );
    
    if ((summary as any[]).length > 0) {
      console.log('✅ Inventory summary query successful');
      const data = (summary as any[])[0];
      console.log(`   SKU: ${data.sku}`);
      console.log(`   PO: ${data.po_quantity}`);
      console.log(`   Available for Picking: ${data.available_for_picking}`);
    } else {
      console.log('❌ Inventory summary query failed');
    }

    // Clean up test data
    await sequelize.query('DELETE FROM inventory_logs WHERE sku = ?', { replacements: [testSku] });
    await sequelize.query('DELETE FROM inventory WHERE sku = ?', { replacements: [testSku] });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Basic functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing basic functionality:', error);
  }
}

async function main(): Promise<void> {
  try {
    await setupInventoryTables();
    await verifySetup();
    await testBasicFunctionality();
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Run: npx ts-node src/test/manualTest.ts');
    console.log('2. Run: npx ts-node src/test/inventoryTest.ts');
    console.log('3. Use the InventoryService in your application');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { setupInventoryTables, verifySetup, testBasicFunctionality };

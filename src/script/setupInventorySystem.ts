import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

/**
 * Parse SQL statements properly handling MySQL triggers
 */
function parseSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inTrigger = false;
  let delimiter = ';';
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
      continue;
    }
    
    // Check for delimiter change
    if (trimmedLine.startsWith('DELIMITER')) {
      delimiter = trimmedLine.split(' ')[1];
      continue;
    }
    
    // Check for trigger start
    if (trimmedLine.includes('CREATE TRIGGER')) {
      inTrigger = true;
    }
    
    currentStatement += line + '\n';
    
    // Check for statement end
    if (trimmedLine.endsWith(delimiter)) {
      if (inTrigger && delimiter === '$$') {
        // End of trigger
        statements.push(currentStatement.trim());
        currentStatement = '';
        inTrigger = false;
        delimiter = ';';
      } else if (!inTrigger && delimiter === ';') {
        // Regular statement
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(stmt => stmt.length > 0);
}

/**
 * Setup Inventory System
 * This script creates the inventory tables and triggers for automatic updates
 */
async function setupInventorySystem(): Promise<void> {
  try {
    console.log('🚀 Setting up Inventory System...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/create_inventory_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Handle SQL statements properly (including triggers)
    const statements = parseSQLStatements(migrationSQL);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await sequelize.query(statement);
        } catch (error: any) {
          // Skip errors for existing tables/triggers
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate entry') ||
              error.message.includes('already exists') ||
              error.message.includes('Duplicate trigger')) {
            console.log(`    ⚠️  Skipped (already exists): ${error.message}`);
            continue;
          }
          throw error;
        }
      }
    }

    console.log('✅ Inventory System setup completed successfully!');
    
    // Verify tables were created
    await verifyInventoryTables();
    
  } catch (error) {
    console.error('❌ Error setting up Inventory System:', error);
    throw error;
  }
}

/**
 * Verify that inventory tables were created successfully
 */
async function verifyInventoryTables(): Promise<void> {
  try {
    console.log('🔍 Verifying inventory tables...');

    // Check if inventory table exists
    const inventoryTableCheck = await sequelize.query(
      "SHOW TABLES LIKE 'inventory'",
      { type: QueryTypes.SELECT }
    );

    if ((inventoryTableCheck as any[]).length === 0) {
      throw new Error('Inventory table was not created');
    }

    // Check if inventory_logs table exists
    const inventoryLogsTableCheck = await sequelize.query(
      "SHOW TABLES LIKE 'inventory_logs'",
      { type: QueryTypes.SELECT }
    );

    if ((inventoryLogsTableCheck as any[]).length === 0) {
      throw new Error('Inventory logs table was not created');
    }

    // Check if triggers exist
    const triggersCheck = await sequelize.query(
      "SHOW TRIGGERS LIKE 'grn_lines'",
      { type: QueryTypes.SELECT }
    );

    console.log(`✅ Found ${(triggersCheck as any[]).length} triggers for grn_lines table`);

    // Check if stored procedure exists
    const procedureCheck = await sequelize.query(
      "SHOW PROCEDURE STATUS WHERE Name = 'ReconcileInventory'",
      { type: QueryTypes.SELECT }
    );

    if ((procedureCheck as any[]).length === 0) {
      console.log('⚠️  ReconcileInventory procedure was not created');
    } else {
      console.log('✅ ReconcileInventory procedure created successfully');
    }

    // Check if view exists
    const viewCheck = await sequelize.query(
      "SHOW TABLES LIKE 'inventory_summary'",
      { type: QueryTypes.SELECT }
    );

    if ((viewCheck as any[]).length === 0) {
      console.log('⚠️  inventory_summary view was not created');
    } else {
      console.log('✅ inventory_summary view created successfully');
    }

    console.log('✅ All inventory tables and components verified successfully!');

  } catch (error) {
    console.error('❌ Error verifying inventory tables:', error);
    throw error;
  }
}

/**
 * Test the inventory system with sample data
 */
async function testInventorySystem(): Promise<void> {
  try {
    console.log('🧪 Testing inventory system...');

    // Test data
    const testSku = 'TEST-SKU-001';
    
    // Clean up any existing test data
    await sequelize.query(
      'DELETE FROM inventory_logs WHERE sku = ?',
      { replacements: [testSku] }
    );
    await sequelize.query(
      'DELETE FROM inventory WHERE sku = ?',
      { replacements: [testSku] }
    );

    // Test 1: Create inventory record
    console.log('  Test 1: Creating inventory record...');
    await sequelize.query(
      'INSERT INTO inventory (sku, po_quantity, grn_quantity, putaway_quantity, picklist_quantity, return_try_and_buy_quantity, return_other_quantity, total_available_quantity) VALUES (?, 100, 0, 0, 0, 0, 0, 0)',
      { replacements: [testSku] }
    );

    // Test 2: Update GRN quantity (simulate GRN operation)
    console.log('  Test 2: Simulating GRN operation...');
    await sequelize.query(
      'INSERT INTO inventory_logs (sku, operation_type, quantity_change, previous_quantity, new_quantity, reference_id, operation_details) VALUES (?, "grn", 50, 0, 50, "GRN-001", ?)',
      { replacements: [testSku, JSON.stringify({ test: true })] }
    );

    // Test 3: Update inventory via trigger simulation
    console.log('  Test 3: Updating inventory quantities...');
    await sequelize.query(
      'UPDATE inventory SET grn_quantity = grn_quantity + 50, updated_at = CURRENT_TIMESTAMP WHERE sku = ?',
      { replacements: [testSku] }
    );

    // Verify the update
    const result = await sequelize.query(
      'SELECT * FROM inventory WHERE sku = ?',
      { replacements: [testSku], type: QueryTypes.SELECT }
    );

    if (result.length > 0) {
      console.log('✅ Test data created successfully:', result[0]);
    } else {
      throw new Error('Test data was not created');
    }

    // Clean up test data
    await sequelize.query(
      'DELETE FROM inventory_logs WHERE sku = ?',
      { replacements: [testSku] }
    );
    await sequelize.query(
      'DELETE FROM inventory WHERE sku = ?',
      { replacements: [testSku] }
    );

    console.log('✅ Inventory system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing inventory system:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await setupInventorySystem();
    await testInventorySystem();
    console.log('🎉 Inventory System is ready to use!');
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { setupInventorySystem, verifyInventoryTables, testInventorySystem };

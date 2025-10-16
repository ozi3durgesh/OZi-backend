// FC Migration Runner
// This runs the FC mapping migration when the server starts

import sequelize from './config/database';
import { addBrandTypeToBrands } from './migrations/add-brand-type-to-brands';

export async function runFCMigration() {
  console.log('🚀 Starting FC mapping migration...');
  
  try {
    // Ensure sequelize is connected
    if (!sequelize) {
      console.log('ℹ️ Sequelize not available, skipping migration');
      return;
    }

    const tables = [
      'orders', 'product_master', 'purchase_orders', 'grns', 'grn_lines', 'grn_batches',
      'inventory', 'inventory_logs', 'vendors', 'warehouses', 'picking_waves', 'picklist_items',
      'packing_jobs', 'handovers', 'putaway_tasks', 'putaway_audits', 'bin_locations',
      'return_request_items', 'bulk_import_logs', 'po_products'
    ];

    for (const table of tables) {
      try {
        // Check if fc_id column already exists
        const [columns] = await sequelize.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'ozi_backend' 
          AND TABLE_NAME = '${table}' 
          AND COLUMN_NAME = 'fc_id'
        `);

        if (columns.length === 0) {
          // Add fc_id column
          await sequelize.query(`
            ALTER TABLE \`${table}\` 
            ADD COLUMN \`fc_id\` INT NULL,
            ADD INDEX \`idx_${table}_fc_id\` (\`fc_id\`)
          `);
          console.log(`✅ Added fc_id to ${table} table`);
        } else {
          console.log(`ℹ️ fc_id already exists in ${table} table`);
        }
      } catch (error) {
        console.log(`ℹ️ ${table}: ${(error as Error).message}`);
      }
    }

    console.log('🎉 FC mapping migration completed successfully!');
    
    // Run brand type migration
    await addBrandTypeToBrands();
    
  } catch (error) {
    console.error('❌ Migration failed:', (error as Error).message);
  }
}

// Migration will be called automatically when server starts

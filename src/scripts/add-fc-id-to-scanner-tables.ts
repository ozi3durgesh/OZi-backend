// Add fc_id to scanner tables migration
import sequelize from '../config/database';

export async function addFcIdToScannerTables() {
  console.log('🚀 Adding fc_id to scanner tables...');
  
  try {
    // Ensure sequelize is connected
    if (!sequelize) {
      console.log('ℹ️ Sequelize not available, skipping migration');
      return;
    }

    const tables = ['scanner_sku', 'scanner_bin'];

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
            ADD COLUMN \`fc_id\` INT NULL COMMENT 'Fulfillment Center ID from auth token'
          `);
          console.log(`✅ Added fc_id to ${table} table`);
        } else {
          console.log(`ℹ️ fc_id already exists in ${table} table`);
        }
      } catch (error) {
        console.log(`ℹ️ ${table}: ${(error as Error).message}`);
      }
    }

    console.log('🎉 Scanner tables migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', (error as Error).message);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addFcIdToScannerTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

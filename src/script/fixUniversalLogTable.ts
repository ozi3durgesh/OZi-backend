// scripts/fixUniversalLogTable.ts
import sequelize from '../config/database';
import { UniversalLog } from '../models';

async function fixUniversalLogTable() {
  try {
    console.log('Fixing UniversalLog table...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Drop the existing UniversalLog table if it exists
    console.log('🗑️  Dropping existing UniversalLog table...');
    try {
      await sequelize.query('DROP TABLE IF EXISTS universal_log');
      console.log('✅ Existing table dropped');
    } catch (error) {
      console.log('ℹ️  No existing table to drop');
    }

    // Create the UniversalLog table with correct structure
    console.log('🏗️  Creating UniversalLog table with correct structure...');
    await UniversalLog.sync({ force: true });
    console.log('✅ UniversalLog table created successfully!');

    console.log('\n✅ UniversalLog table fix completed!');
    console.log('The table now has the correct structure with VARCHAR(1000) for URL field.');

  } catch (error) {
    console.error('❌ UniversalLog table fix failed:', error);
    throw error;
  }
}

// Run the fix
fixUniversalLogTable()
  .then(() => {
    console.log('Table fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Table fix failed');
    process.exit(1);
  });

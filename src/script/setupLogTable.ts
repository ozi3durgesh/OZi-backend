// scripts/setupLogTable.ts
import sequelize from '../config/database';
import { UniversalLog } from '../models';

async function setupLogTable() {
  try {
    console.log('Setting up UniversalLog table...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create the UniversalLog table
    console.log('🏗️  Creating UniversalLog table...');
    await UniversalLog.sync({ force: true });
    console.log('✅ UniversalLog table created successfully!');

    console.log('\n✅ UniversalLog table setup completed!');

  } catch (error) {
    console.error('❌ UniversalLog table setup failed:', error);
    throw error;
  }
}

// Run the setup
setupLogTable()
  .then(() => {
    console.log('UniversalLog table setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('UniversalLog table setup failed:', error);
    process.exit(1);
  });

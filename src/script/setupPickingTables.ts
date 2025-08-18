// script/setupPickingTables.ts
import sequelize from '../config/database';
import { PickingWave, PicklistItem, PickingException } from '../models';

async function setupPickingTables() {
  try {
    console.log('Setting up picking tables...');
    
    // Sync all models to create tables
    await sequelize.sync({ force: false });
    
    console.log('Picking tables setup completed successfully!');
    console.log('Tables created:');
    console.log('- picking_waves');
    console.log('- picklist_items');
    console.log('- picking_exceptions');
    
    // Test table creation
    const waveCount = await PickingWave.count();
    const itemCount = await PicklistItem.count();
    const exceptionCount = await PickingException.count();
    
    console.log('\nTable status:');
    console.log(`- PickingWaves: ${waveCount} records`);
    console.log(`- PicklistItems: ${itemCount} records`);
    console.log(`- PickingExceptions: ${exceptionCount} records`);
    
  } catch (error) {
    console.error('Error setting up picking tables:', error);
    throw error;
  }
}

// Run the setup
setupPickingTables()
  .then(() => {
    console.log('Picking tables setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Picking tables setup failed:', error);
    process.exit(1);
  });

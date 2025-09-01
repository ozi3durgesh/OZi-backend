// script/initScannerTables.ts
import sequelize from '../config/database';
import { ScannerBin, ScannerSku } from '../models';

async function initScannerTables() {
  try {
    console.log('🚀 Starting scanner tables initialization...');

    // Sync database to ensure tables exist
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synced');

    // Initialize scanner_bin table with default bin locations
    const defaultBinLocations = [
      {
        binLocationScanId: 'Z05B02R02S4B1',
        sku: ['1191', '1192']
      }
    ];

    console.log('📦 Initializing scanner_bin table...');
    for (const binLocation of defaultBinLocations) {
      const [bin, created] = await ScannerBin.findOrCreate({
        where: { binLocationScanId: binLocation.binLocationScanId },
        defaults: binLocation
      });
      console.log(`${created ? '✅ Created' : 'ℹ️  Exists'}: ${binLocation.binLocationScanId} with ${binLocation.sku.length} SKUs`);
    }

    // Initialize scanner_sku table with default SKU records
    const defaultSkuRecords = [
      {
        skuScanId: '1191',
        sku: [{ skuId: '1191', quantity: 10 }],
        binLocationScanId: 'Z05B02R02S4B1'
      },
      {
        skuScanId: '1192',
        sku: [{ skuId: '1192', quantity: 5 }],
        binLocationScanId: 'Z05B02R02S4B1'
      }
    ];

    console.log('\n🏷️  Initializing scanner_sku table...');
    for (const skuRecord of defaultSkuRecords) {
      const [sku, created] = await ScannerSku.findOrCreate({
        where: { skuScanId: skuRecord.skuScanId },
        defaults: skuRecord
      });
      console.log(`${created ? '✅ Created' : 'ℹ️  Exists'}: ${skuRecord.skuScanId} at ${skuRecord.binLocationScanId}`);
    }

    console.log('\n🎉 Scanner tables initialization completed successfully!');
    
    // Show summary
    const binCount = await ScannerBin.count();
    const skuCount = await ScannerSku.count();
    console.log(`\n📊 Summary:`);
    console.log(`- scanner_bin: ${binCount} records`);
    console.log(`- scanner_sku: ${skuCount} records`);

  } catch (error) {
    console.error('❌ Error initializing scanner tables:', error);
    throw error;
  }
}

// Run the initialization
if (require.main === module) {
  initScannerTables()
    .then(() => {
      console.log('\n✅ Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

export { initScannerTables };

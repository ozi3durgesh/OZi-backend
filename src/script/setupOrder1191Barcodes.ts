// script/setupOrder1191Barcodes.ts
import sequelize from '../config/database';
import { BarcodeMapping, BarcodeItem } from '../models';

async function setupOrder1191Barcodes() {
  try {
    console.log('Setting up barcode mappings for Order SKU 1191...');

    // Sync models
    await BarcodeMapping.sync({ force: false });
    await BarcodeItem.sync({ force: false });
    console.log('✅ Models synchronized');

    // Create barcode mapping for the new order
    const barcodeMapping = await BarcodeMapping.create({
      barcode: '22133394988588',
      barcodeType: 'HYBRID',
      binLocation: 'A7-B9-C3',
      warehouseId: 11,
      zoneId: 1,
      isActive: true,
      description: 'Barcode for Order SKU 1191 at bin A7-B9-C3'
    });

    console.log(`✅ Created barcode mapping: ${barcodeMapping.barcode}`);

    // Create barcode item for SKU 1191
    const barcodeItem = await BarcodeItem.create({
      barcodeMappingId: barcodeMapping.id,
      sku: '1191',
      productName: 'Test Product 1191',
      quantity: 1,
      isActive: true
    });

    console.log(`✅ Created barcode item: SKU ${barcodeItem.sku}`);

    // Create additional barcode mappings for testing
    const additionalMappings = [
      {
        barcode: 'BIN1191',
        barcodeType: 'BIN_LOCATION' as const,
        binLocation: 'A7-B9-C3',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'Bin location barcode for A7-B9-C3 (Order 1191)'
      },
      {
        barcode: 'SKU1191',
        barcodeType: 'SKU' as const,
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'SKU barcode for Product 1191'
      }
    ];

    for (const mappingData of additionalMappings) {
      const [mapping, created] = await BarcodeMapping.findOrCreate({
        where: { barcode: mappingData.barcode },
        defaults: mappingData
      });

      if (created) {
        console.log(`✅ Created additional barcode mapping: ${mapping.barcode} (${mapping.barcodeType})`);
      } else {
        console.log(`ℹ️  Barcode mapping already exists: ${mapping.barcode}`);
      }
    }

    console.log('\n🎉 Barcode mappings for Order SKU 1191 setup completed!');
    console.log('\n📱 **Available Barcodes for Testing:**');
    console.log('\n🔄 **Hybrid Barcode (Both Bin & SKU):**');
    console.log('   - 22133394988588 → SKU 1191 at A7-B9-C3');
    console.log('\n🔍 **Bin Location Only:**');
    console.log('   - BIN1191 → A7-B9-C3');
    console.log('\n🏷️ **SKU Only:**');
    console.log('   - SKU1191 → Product 1191');

  } catch (error) {
    console.error('❌ Error setting up barcode mappings:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  setupOrder1191Barcodes()
    .then(() => {
      console.log('Barcode mappings setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Barcode mappings setup failed:', error);
      process.exit(1);
    });
}

export default setupOrder1191Barcodes;

// script/setupBarcodeMappings.ts
import sequelize from '../config/database';
import { BarcodeMapping } from '../models';

async function setupBarcodeMappings() {
  try {
    console.log('Setting up barcode mappings for scanning system...');

    // Sync BarcodeMapping model
    await BarcodeMapping.sync({ force: false });
    console.log('✅ BarcodeMapping table synchronized');

    // Create test barcode mappings
    const testMappings = [
      {
        barcode: '22133394988585',
        barcodeType: 'HYBRID' as const,
        binLocation: 'A1-B2-C3',
        sku: '122',
        productName: 'Product-122',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'Test barcode for SKU 122 at bin A1-B2-C3'
      },
      {
        barcode: '22133394988586',
        barcodeType: 'HYBRID' as const,
        binLocation: 'A1-B2-C4',
        sku: '123',
        productName: 'Product-123',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'Test barcode for SKU 123 at bin A1-B2-C4'
      },
      {
        barcode: '22133394988587',
        barcodeType: 'HYBRID' as const,
        binLocation: 'A1-B3-C1',
        sku: '124',
        productName: 'Product-124',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'Test barcode for SKU 124 at bin A1-B3-C1'
      },
      {
        barcode: 'BIN001',
        barcodeType: 'BIN_LOCATION' as const,
        binLocation: 'A1-B2-C3',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'Bin location barcode for A1-B2-C3'
      },
      {
        barcode: 'BIN002',
        barcodeType: 'BIN_LOCATION' as const,
        binLocation: 'A1-B2-C4',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'Bin location barcode for A1-B2-C4'
      },
      {
        barcode: 'BIN003',
        barcodeType: 'BIN_LOCATION' as const,
        binLocation: 'A1-B3-C1',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'Bin location barcode for A1-B3-C1'
      },
      {
        barcode: 'SKU122',
        barcodeType: 'SKU' as const,
        sku: '122',
        productName: 'Product-122',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'SKU barcode for Product-122'
      },
      {
        barcode: 'SKU123',
        barcodeType: 'SKU' as const,
        sku: '123',
        productName: 'Product-123',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'SKU barcode for Product-123'
      },
      {
        barcode: 'SKU124',
        barcodeType: 'SKU' as const,
        sku: '124',
        productName: 'Product-124',
        warehouseId: 11,
        zoneId: 1,
        isActive: true,
        description: 'SKU barcode for Product-124'
      }
    ];

    for (const mappingData of testMappings) {
      const [mapping, created] = await BarcodeMapping.findOrCreate({
        where: { barcode: mappingData.barcode },
        defaults: mappingData
      });

      if (created) {
        console.log(`✅ Created barcode mapping: ${mapping.barcode} (${mapping.barcodeType})`);
      } else {
        console.log(`ℹ️  Barcode mapping already exists: ${mapping.barcode}`);
      }
    }

    console.log('\n🎉 Barcode mappings setup completed successfully!');
    console.log('\n📱 You can now test the scanning APIs with these barcodes:');
    console.log('\n🔍 **Bin Location Scanning:**');
    console.log('   - BIN001 → A1-B2-C3');
    console.log('   - BIN002 → A1-B2-C4');
    console.log('   - BIN003 → A1-B3-C1');
    console.log('\n🏷️  **SKU Scanning:**');
    console.log('   - SKU122 → Product-122');
    console.log('   - SKU123 → Product-123');
    console.log('   - SKU124 → Product-124');
    console.log('\n🔄 **Hybrid Barcodes (Both Bin & SKU):**');
    console.log('   - 22133394988585 → SKU 122 at A1-B2-C3');
    console.log('   - 22133394988586 → SKU 123 at A1-B2-C4');
    console.log('   - 22133394988587 → SKU 124 at A1-B3-C1');

  } catch (error) {
    console.error('❌ Error setting up barcode mappings:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  setupBarcodeMappings()
    .then(() => {
      console.log('Barcode mappings setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Barcode mappings setup failed:', error);
      process.exit(1);
    });
}

export default setupBarcodeMappings;

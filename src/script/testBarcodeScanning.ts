// script/testBarcodeScanning.ts
import sequelize from '../config/database';
import { PickingWave, PicklistItem, BarcodeMapping } from '../models';

async function testBarcodeScanning() {
  try {
    console.log('🧪 Testing Barcode Scanning System...\n');

    // 1. Check barcode mappings
    console.log('1. 📱 Checking Barcode Mappings...');
    const barcodeMappings = await BarcodeMapping.findAll({
      where: { isActive: true },
      order: [['barcodeType', 'ASC'], ['barcode', 'ASC']]
    });

    console.log(`✅ Found ${barcodeMappings.length} active barcode mappings:`);
    barcodeMappings.forEach(mapping => {
      console.log(`   - ${mapping.barcode} (${mapping.barcodeType})`);
      if (mapping.barcodeType === 'HYBRID') {
        console.log(`     → SKU: ${mapping.sku}, Bin: ${mapping.binLocation}`);
      } else if (mapping.barcodeType === 'BIN_LOCATION') {
        console.log(`     → Bin: ${mapping.binLocation}`);
      } else if (mapping.barcodeType === 'SKU') {
        console.log(`     → SKU: ${mapping.sku}`);
      }
    });

    // 2. Check picking wave and items
    console.log('\n2. 📋 Checking Picking Wave 7...');
    const wave = await PickingWave.findByPk(7);
    if (!wave) {
      console.log('❌ Picking wave 7 not found. Please run createTestPicklist.ts first.');
      return;
    }

    console.log(`✅ Wave ${wave.waveNumber} found (Status: ${wave.status})`);
    
    const picklistItems = await PicklistItem.findAll({
      where: { waveId: 7 },
      order: [['scanSequence', 'ASC']]
    });

    console.log(`✅ Found ${picklistItems.length} picklist items:`);
    picklistItems.forEach(item => {
      console.log(`   - SKU: ${item.sku}, Bin: ${item.binLocation}, Status: ${item.status}`);
    });

    // 3. Test bin location scanning logic
    console.log('\n3. 🔍 Testing Bin Location Scanning Logic...');
    
    // Test with hybrid barcode
    const testHybridBarcode = '22133394988585';
    const hybridMapping = await BarcodeMapping.findOne({
      where: { barcode: testHybridBarcode, isActive: true }
    });

    if (hybridMapping) {
      console.log(`✅ Hybrid barcode "${testHybridBarcode}" found:`);
      console.log(`   - Type: ${hybridMapping.barcodeType}`);
      console.log(`   - SKU: ${hybridMapping.sku}`);
      console.log(`   - Bin Location: ${hybridMapping.binLocation}`);
      
      // Check if this bin location exists in picklist
      const matchingItem = await PicklistItem.findOne({
        where: { 
          waveId: 7,
          binLocation: hybridMapping.binLocation,
          status: ['PENDING', 'PICKING']
        }
      });

      if (matchingItem) {
        console.log(`✅ Bin location "${hybridMapping.binLocation}" found in picklist`);
        console.log(`   - Expected SKU: ${matchingItem.sku}`);
        console.log(`   - Expected Product: ${matchingItem.productName}`);
        console.log(`   - Quantity: ${matchingItem.quantity}`);
      } else {
        console.log(`❌ Bin location "${hybridMapping.binLocation}" not found in picklist`);
      }
    }

    // 4. Test SKU scanning logic
    console.log('\n4. 🏷️ Testing SKU Scanning Logic...');
    
    // Test with hybrid barcode for SKU scanning
    const hybridMappingForSku = await BarcodeMapping.findOne({
      where: { barcode: testHybridBarcode, isActive: true }
    });

    if (hybridMappingForSku) {
      console.log(`✅ SKU barcode "${testHybridBarcode}" found:`);
      console.log(`   - Scanned SKU: ${hybridMappingForSku.sku}`);
      console.log(`   - Scanned Bin: ${hybridMappingForSku.binLocation}`);
      
      // Get current item to pick
      const currentItem = await PicklistItem.findOne({
        where: { 
          waveId: 7,
          status: ['PENDING', 'PICKING']
        },
        order: [['scanSequence', 'ASC']]
      });

      if (currentItem) {
        console.log(`✅ Current item to pick:`);
        console.log(`   - Expected SKU: ${currentItem.sku}`);
        console.log(`   - Expected Bin: ${currentItem.binLocation}`);
        console.log(`   - Product: ${currentItem.productName}`);
        
        // Check if scanned SKU and bin match current item
        const skuMatch = currentItem.sku === hybridMappingForSku.sku;
        const binMatch = currentItem.binLocation === hybridMappingForSku.binLocation;
        
        console.log(`\n🔍 Validation Results:`);
        console.log(`   - SKU Match: ${skuMatch ? '✅' : '❌'}`);
        console.log(`   - Bin Match: ${binMatch ? '✅' : '❌'}`);
        console.log(`   - Overall Match: ${skuMatch && binMatch ? '✅ VALID' : '❌ INVALID'}`);
        
        if (skuMatch && binMatch) {
          console.log(`\n🎯 **PICKING VALID** - Item can be picked!`);
          console.log(`   - Item will be marked as PICKED`);
          console.log(`   - pickedQuantity will be set to ${currentItem.quantity}`);
          console.log(`   - remainingQuantity will be set to 0`);
        } else {
          console.log(`\n⚠️ **PICKING INVALID** - Item cannot be picked`);
          if (!skuMatch) {
            console.log(`   - SKU mismatch: Expected ${currentItem.sku}, got ${hybridMappingForSku.sku}`);
          }
          if (!binMatch) {
            console.log(`   - Bin mismatch: Expected ${currentItem.binLocation}, got ${hybridMappingForSku.binLocation}`);
          }
        }
      } else {
        console.log('❌ No pending items found in wave 7');
      }
    }

    // 5. Test different barcode types
    console.log('\n5. 🔄 Testing Different Barcode Types...');
    
    // Test bin location only barcode
    const binOnlyBarcode = 'BIN001';
    const binOnlyMapping = await BarcodeMapping.findOne({
      where: { barcode: binOnlyBarcode, isActive: true }
    });
    
    if (binOnlyMapping) {
      console.log(`✅ Bin-only barcode "${binOnlyBarcode}" found:`);
      console.log(`   - Type: ${binOnlyMapping.barcodeType}`);
      console.log(`   - Bin Location: ${binOnlyMapping.binLocation}`);
      console.log(`   - SKU: ${binOnlyMapping.sku || 'None'}`);
    }

    // Test SKU only barcode
    const skuOnlyBarcode = 'SKU122';
    const skuOnlyMapping = await BarcodeMapping.findOne({
      where: { barcode: skuOnlyBarcode, isActive: true }
    });
    
    if (skuOnlyMapping) {
      console.log(`✅ SKU-only barcode "${skuOnlyBarcode}" found:`);
      console.log(`   - Type: ${skuOnlyMapping.barcodeType}`);
      console.log(`   - SKU: ${skuOnlyMapping.sku}`);
      console.log(`   - Bin Location: ${skuOnlyMapping.binLocation || 'None'}`);
    }

    console.log('\n🎉 Barcode scanning system test completed successfully!');
    console.log('\n📱 **Ready for API Testing:**');
    console.log('   - Bin Location Scan: POST /api/picklist/7/scan/binLocation');
    console.log('   - SKU Scan: POST /api/picklist/7/scan/sku');
    console.log('\n🔑 **Test Barcodes:**');
    console.log('   - Hybrid: 22133394988585, 22133394988586, 22133394988587');
    console.log('   - Bin Only: BIN001, BIN002, BIN003');
    console.log('   - SKU Only: SKU122, SKU123, SKU124');

  } catch (error) {
    console.error('❌ Error testing barcode scanning:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  testBarcodeScanning()
    .then(() => {
      console.log('Barcode scanning test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Barcode scanning test failed:', error);
      process.exit(1);
    });
}

export default testBarcodeScanning;

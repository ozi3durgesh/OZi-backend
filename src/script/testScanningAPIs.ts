// script/testScanningAPIs.ts
import sequelize from '../config/database';
import { PickingWave, PicklistItem } from '../models';

async function testScanningAPIs() {
  try {
    console.log('🧪 Testing Scanning APIs...\n');

    // Test 1: Check if wave 7 exists and has items
    console.log('1. Checking wave 7 and picklist items...');
    const wave = await PickingWave.findByPk(7);
    if (!wave) {
      console.log('❌ Wave 7 not found');
      return;
    }
    console.log(`✅ Wave found: ${wave.waveNumber} (Status: ${wave.status})`);

    const picklistItems = await PicklistItem.findAll({
      where: { waveId: 7 },
      order: [['scanSequence', 'ASC']]
    });
    console.log(`✅ Found ${picklistItems.length} picklist items`);

    // Display items
    picklistItems.forEach(item => {
      console.log(`   - SKU: ${item.sku}, Bin: ${item.binLocation}, Status: ${item.status}, Sequence: ${item.scanSequence}`);
    });

    // Test 2: Simulate bin location scan
    console.log('\n2. Testing Bin Location Scan Logic...');
    const testBinLocation = 'A1-B2-C3';
    const binLocationItem = await PicklistItem.findOne({
      where: { 
        waveId: 7,
        binLocation: testBinLocation,
        status: ['PENDING', 'PICKING']
      }
    });

    if (binLocationItem) {
      console.log(`✅ Bin location "${testBinLocation}" found - contains SKU: ${binLocationItem.sku}`);
    } else {
      console.log(`❌ Bin location "${testBinLocation}" not found`);
    }

    // Test 3: Simulate SKU scan
    console.log('\n3. Testing SKU Scan Logic...');
    const testSku = '122';
    const currentItem = await PicklistItem.findOne({
      where: { 
        waveId: 7,
        status: ['PENDING', 'PICKING']
      },
      order: [['scanSequence', 'ASC']]
    });

    if (currentItem) {
      console.log(`✅ Current item to pick: SKU ${currentItem.sku} at ${currentItem.binLocation}`);
      
      if (currentItem.sku === testSku) {
        console.log(`✅ SKU "${testSku}" matches current item - can proceed with picking`);
        
        // Simulate the picking process
        console.log('\n4. Simulating Item Pick...');
        await currentItem.update({
          status: 'PICKED',
          pickedQuantity: currentItem.quantity,
          pickedAt: new Date(),
          pickedBy: 1 // test user ID
        });
        
        console.log(`✅ Item ${currentItem.sku} marked as PICKED`);
        
        // Check remaining items
        const remainingItems = await PicklistItem.count({
          where: { 
            waveId: 7,
            status: ['PENDING', 'PICKING']
          }
        });
        
        console.log(`📊 Remaining items to pick: ${remainingItems}`);
        
        if (remainingItems === 0) {
          console.log('🎉 All items picked! Wave can be completed.');
        }
        
      } else {
        console.log(`❌ SKU "${testSku}" does not match current item "${currentItem.sku}"`);
      }
    } else {
      console.log('❌ No pending items found in wave 7');
    }

    console.log('\n🎯 API Testing Summary:');
    console.log('1. Bin Location Scan: POST /api/picklist/7/scan/binLocation');
    console.log('   Body: {"scannedId": "A1-B2-C3"}');
    console.log('   Expected: {"binLocationFound": true}');
    console.log('');
    console.log('2. SKU Scan: POST /api/picklist/7/scan/sku');
    console.log('   Body: {"scannedId": "122"}');
    console.log('   Expected: {"skuFound": true, "item": {...}}');

  } catch (error) {
    console.error('❌ Error testing scanning APIs:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  testScanningAPIs()
    .then(() => {
      console.log('\nScanning API testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Scanning API testing failed:', error);
      process.exit(1);
    });
}

export default testScanningAPIs;

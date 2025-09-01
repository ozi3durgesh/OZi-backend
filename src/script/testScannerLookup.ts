// script/testScannerLookup.ts
import sequelize from '../config/database';
import { ScannerBin, ScannerSku } from '../models';

async function testScannerLookup() {
  try {
    console.log('🧪 Testing scanner table lookup...\n');

    // Test 1: Check if scanner tables have data
    console.log('1. Checking scanner tables data...');
    const binCount = await ScannerBin.count();
    const skuCount = await ScannerSku.count();
    console.log(`✓ scanner_bin: ${binCount} records`);
    console.log(`✓ scanner_sku: ${skuCount} records`);

    // Test 2: Test SKU lookup for 1191
    console.log('\n2. Testing SKU lookup for 1191...');
    const sku1191 = await ScannerSku.findOne({
      where: { skuScanId: '1191' }
    });

    if (sku1191) {
      console.log(`✅ SKU 1191 found`);
      console.log(`   - skuScanId: ${sku1191.skuScanId}`);
      console.log(`   - binLocationScanId: ${sku1191.binLocationScanId}`);
      console.log(`   - sku data:`, JSON.stringify(sku1191.sku, null, 2));

      // Test 3: Get bin location for SKU 1191
      console.log('\n3. Getting bin location for SKU 1191...');
      const binFor1191 = await ScannerBin.findOne({
        where: { binLocationScanId: sku1191.binLocationScanId }
      });

      if (binFor1191) {
        console.log(`✅ Bin location found`);
        console.log(`   - binLocationScanId: ${binFor1191.binLocationScanId}`);
        console.log(`   - SKUs:`, JSON.stringify(binFor1191.sku, null, 2));
      } else {
        console.log(`❌ Bin location not found for ${sku1191.binLocationScanId}`);
      }
    } else {
      console.log(`❌ SKU 1191 not found`);
    }

    // Test 4: Test SKU lookup for 1192
    console.log('\n4. Testing SKU lookup for 1192...');
    const sku1192 = await ScannerSku.findOne({
      where: { skuScanId: '1192' }
    });

    if (sku1192) {
      console.log(`✅ SKU 1192 found`);
      console.log(`   - skuScanId: ${sku1192.skuScanId}`);
      console.log(`   - binLocationScanId: ${sku1192.binLocationScanId}`);
      console.log(`   - sku data:`, JSON.stringify(sku1192.sku, null, 2));
    } else {
      console.log(`❌ SKU 1192 not found`);
    }

    // Test 5: Test non-existent SKU
    console.log('\n5. Testing non-existent SKU lookup...');
    const nonExistentSku = await ScannerSku.findOne({
      where: { skuScanId: '999999' }
    });

    if (!nonExistentSku) {
      console.log(`✅ Non-existent SKU correctly returns null`);
    } else {
      console.log(`❌ Unexpected result for non-existent SKU`);
    }

    console.log('\n🎉 Scanner lookup test completed!');

  } catch (error) {
    console.error('❌ Error testing scanner lookup:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testScannerLookup()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testScannerLookup };

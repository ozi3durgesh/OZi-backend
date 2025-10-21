const { ProductMasterService } = require('../services/productMasterService');

async function testIdGeneration() {
  console.log('🧪 Testing ID Generation Logic...\n');
  
  const service = new ProductMasterService();
  
  // Test catalogue_id generation
  console.log('1. Testing catalogue_id generation:');
  const catalogueId = await service.generateCatalogueId();
  console.log(`   Generated catalogue_id: ${catalogueId}`);
  console.log(`   Expected format: 7 characters starting from 4000001`);
  console.log(`   ✅ ${catalogueId.length === 7 && catalogueId.startsWith('4') ? 'PASS' : 'FAIL'}\n`);
  
  // Test product_id generation for different colors
  console.log('2. Testing product_id generation:');
  const colors = ['Red', 'Blue', 'Green'];
  colors.forEach((color, index) => {
    const productId = service.generateProductId(catalogueId, index);
    console.log(`   Color ${index + 1} (${color}): ${productId}`);
    console.log(`   Expected: ${catalogueId}${(index + 1).toString().padStart(2, '0')}`);
    console.log(`   ✅ ${productId === `${catalogueId}${(index + 1).toString().padStart(2, '0')}` ? 'PASS' : 'FAIL'}`);
  });
  console.log();
  
  // Test sku_id generation for different age/sizes
  console.log('3. Testing sku_id generation:');
  const ageSizes = ['S', 'M', 'L'];
  const productId = `${catalogueId}01`; // First product_id
  ageSizes.forEach((ageSize, index) => {
    const skuId = service.generateSkuId(productId, index);
    console.log(`   Age/Size ${index + 1} (${ageSize}): ${skuId}`);
    console.log(`   Expected: ${productId}${(index + 1).toString().padStart(3, '0')}`);
    console.log(`   ✅ ${skuId === `${productId}${(index + 1).toString().padStart(3, '0')}` ? 'PASS' : 'FAIL'}`);
  });
  console.log();
  
  // Test complete combination
  console.log('4. Testing complete ID combination:');
  console.log(`   Catalogue ID: ${catalogueId}`);
  console.log(`   Product IDs for 3 colors:`);
  colors.forEach((color, colorIndex) => {
    const productId = service.generateProductId(catalogueId, colorIndex);
    console.log(`     ${color}: ${productId}`);
    console.log(`     SKUs for 3 sizes:`);
    ageSizes.forEach((ageSize, ageSizeIndex) => {
      const skuId = service.generateSkuId(productId, ageSizeIndex);
      console.log(`       ${ageSize}: ${skuId}`);
    });
  });
  
  console.log('\n🎉 ID Generation Test Complete!');
  console.log('\nExpected Pattern:');
  console.log('catalogue_id: 4000001 (7 chars)');
  console.log('product_id: 400000101, 400000102, 400000103 (9 chars)');
  console.log('sku_id: 400000101001, 400000101002, 400000101003, 400000102001, 400000102002, 400000102003, 400000103001, 400000103002, 400000103003 (12 chars)');
}

testIdGeneration().catch(console.error);

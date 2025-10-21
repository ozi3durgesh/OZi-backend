const { ProductMasterService } = require('./src/services/productMasterService.ts');

async function testServiceDirect() {
  try {
    console.log('🧪 Testing ProductMasterService directly...');
    
    const productService = new ProductMasterService();
    
    // Test payload with colors and ages
    const testPayload = {
      colors: ["Yellow", "Pink", "Green"],
      ageSizes: ["M", "XL"],
      name: "Test Product",
      category: "Test Category",
      description: "Test Description",
      mrp: 100,
      brand_id: 2,
      gst: 18,
      cess: 5,
      hsn: "12345678",
      status: 1
    };
    
    console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));
    
    const result = await productService.createProduct(testPayload, 1);
    
    console.log('✅ Success!');
    console.log('📊 Created products:', result.length);
    result.forEach((product, index) => {
      console.log(`  Product ${index + 1}:`);
      console.log(`    ID: ${product.id}`);
      console.log(`    Catalogue ID: ${product.catelogue_id}`);
      console.log(`    Product ID: ${product.product_id}`);
      console.log(`    SKU ID: ${product.sku_id}`);
      console.log(`    Color: ${product.color}`);
      console.log(`    Age/Size: ${product.age_size}`);
      console.log(`    Name: ${product.name}`);
    });
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('📊 Error:', error.message);
    if (error.errors) {
      console.log('📊 Validation errors:', error.errors);
    }
  }
}

testServiceDirect();

import sequelize from '../config/database';
import Product from '../models/Product';

async function checkAndFixProductDatabase() {
  try {
    console.log('🔍 Checking product database state...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if Product table exists and has data
    const productCount = await Product.count();
    console.log(`📊 Total products in database: ${productCount}`);

    // Check for specific SKU 1191
    const product1191 = await Product.findOne({
      where: { sku: 1191 }
    });

    if (product1191) {
      console.log('✅ Product with SKU 1191 found:');
      console.log(`   ID: ${product1191.id}`);
      console.log(`   Name: ${product1191.name}`);
      console.log(`   Status: ${product1191.status}`);
      console.log(`   Stock: ${product1191.stock_quantity}`);
      console.log(`   Price: ${product1191.base_price}`);
      console.log(`   Store ID: ${product1191.store_id}`);
    } else {
      console.log('❌ Product with SKU 1191 NOT found');
      
      // Check what products exist
      const allProducts = await Product.findAll({
        attributes: ['id', 'sku', 'name', 'status', 'store_id'],
        limit: 10
      });
      
      console.log('📋 Existing products:');
      allProducts.forEach(p => {
        console.log(`   SKU: ${p.sku}, Name: ${p.name}, Status: ${p.status}, Store: ${p.store_id}`);
      });

      // Create the missing product
      console.log('\n🔧 Creating missing product with SKU 1191...');
      
      const newProduct = await Product.create({
        sku: 1191,
        name: 'Test Product 1191',
        description: 'Product created for testing order placement',
        base_price: 1.00,
        sale_price: 1.00,
        cost_price: 0.50,
        category_id: 1,
        brand_id: 1,
        status: 'active',
        stock_quantity: 100,
        min_stock_level: 10,
        max_stock_level: 200,
        weight: 0.5,
        dimensions: '10x5x2 cm',
        barcode: '1191000000001',
        store_id: 11
      });

      console.log('✅ Successfully created product:');
      console.log(`   ID: ${newProduct.id}`);
      console.log(`   SKU: ${newProduct.sku}`);
      console.log(`   Name: ${newProduct.name}`);
      console.log(`   Stock: ${newProduct.stock_quantity}`);
      console.log(`   Price: ${newProduct.base_price}`);
    }

    // Check store_id 11 specifically
    const store11Products = await Product.findAll({
      where: { store_id: 11 }
    });
    console.log(`\n🏪 Products in store 11: ${store11Products.length}`);
    store11Products.forEach(p => {
      console.log(`   SKU: ${p.sku}, Name: ${p.name}, Status: ${p.status}`);
    });

    console.log('\n🎉 Database check completed!');

  } catch (error) {
    console.error('❌ Error checking product database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkAndFixProductDatabase()
    .then(() => {
      console.log('🎯 Product database check completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Product database check failed:', error);
      process.exit(1);
    });
}

export default checkAndFixProductDatabase;

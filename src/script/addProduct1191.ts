// script/addProduct1191.ts
import sequelize from '../config/database';
import Product from '../models/Product';
import ProductVariant from '../models/ProductVariant';

async function addProduct1191() {
  try {
    console.log('Adding product with SKU 1191...');

    // Sync Product model
    await Product.sync({ force: false });
    console.log('✅ Product table synchronized');

    // Sync ProductVariant model
    await ProductVariant.sync({ force: false });
    console.log('✅ ProductVariant table synchronized');

    // Create the specific product needed for testing
    const productData = {
      sku: 1191,
      name: 'Test Product 1191',
      description: 'This is a test product with SKU 1191 for order placement testing',
      base_price: 1.00,
      sale_price: 1.00,
      cost_price: 0.50,
      category_id: 1,
      brand_id: 1,
      status: 'active' as const,
      stock_quantity: 1000, // High stock for testing
      min_stock_level: 10,
      max_stock_level: 2000,
      weight: 0.5,
      dimensions: '10x5x2 cm',
      barcode: '1234567890123',
      store_id: 11
    };

    const [product, created] = await Product.findOrCreate({
      where: { sku: productData.sku },
      defaults: productData
    });

    if (created) {
      console.log(`✅ Created product: ${product.name} (SKU: ${product.sku})`);
      console.log(`   - Price: $${product.base_price}`);
      console.log(`   - Stock: ${product.stock_quantity}`);
      console.log(`   - Store ID: ${product.store_id}`);
    } else {
      console.log(`ℹ️  Product already exists: ${product.name} (SKU: ${product.sku})`);
      
      // Update stock if needed
      if (product.stock_quantity < 100) {
        await product.update({ stock_quantity: 1000 });
        console.log(`✅ Updated stock to 1000 for SKU ${product.sku}`);
      }
    }

    // Create a simple variant for testing
    const variantData = {
      product_id: product.id,
      variant_name: 'Size',
      variant_value: 'Standard',
      price_modifier: 0.00,
      stock_quantity: 500,
      min_stock_level: 5,
      max_stock_level: 1000,
      sku_suffix: 'STD',
      barcode: '1234567890123-STD',
      weight_modifier: 0.00,
      dimensions_modifier: '10x5x2 cm',
      status: 'active' as const
    };

    const [variant, variantCreated] = await ProductVariant.findOrCreate({
      where: { 
        product_id: product.id,
        variant_name: variantData.variant_name,
        variant_value: variantData.variant_value
      },
      defaults: variantData
    });

    if (variantCreated) {
      console.log(`✅ Created variant: ${variant.variant_name} - ${variant.variant_value}`);
    } else {
      console.log(`ℹ️  Variant already exists: ${variant.variant_name} - ${variant.variant_value}`);
    }

    console.log('\n🎉 Product setup completed successfully!');
    console.log('\nYou can now test the order placement with:');
    console.log(`SKU: ${product.sku}`);
    console.log(`Store ID: ${product.store_id}`);
    console.log(`Price: $${product.base_price}`);
    console.log(`Stock: ${product.stock_quantity}`);

  } catch (error) {
    console.error('❌ Error adding product:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  addProduct1191()
    .then(() => {
      console.log('Product setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Product setup failed:', error);
      process.exit(1);
    });
}

export default addProduct1191;

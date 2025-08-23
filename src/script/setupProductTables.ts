import sequelize from '../config/database';
import Product from '../models/Product';
import ProductVariant from '../models/ProductVariant';

async function setupProductTables() {
  try {
    console.log('Setting up product tables...');

    // Sync Product model
    await Product.sync({ force: false });
    console.log('✅ Product table synchronized');

    // Sync ProductVariant model
    await ProductVariant.sync({ force: false });
    console.log('✅ ProductVariant table synchronized');

    // Create sample products for testing
    const sampleProducts = [
      {
        sku: 1191,
        name: 'Sample Product 1',
        description: 'This is a sample product for testing',
        base_price: 1.00,
        sale_price: 1.00,
        cost_price: 0.50,
        category_id: 1,
        brand_id: 1,
        status: 'active' as const,
        stock_quantity: 100,
        min_stock_level: 10,
        max_stock_level: 200,
        weight: 0.5,
        dimensions: '10x5x2 cm',
        barcode: '1234567890123',
        store_id: 11
      },
      {
        sku: 1192,
        name: 'Sample Product 2',
        description: 'Another sample product for testing',
        base_price: 2.50,
        sale_price: 2.50,
        cost_price: 1.25,
        category_id: 1,
        brand_id: 1,
        status: 'active' as const,
        stock_quantity: 75,
        min_stock_level: 5,
        max_stock_level: 150,
        weight: 0.8,
        dimensions: '15x8x3 cm',
        barcode: '1234567890124',
        store_id: 11
      }
    ];

    for (const productData of sampleProducts) {
      const [product, created] = await Product.findOrCreate({
        where: { sku: productData.sku },
        defaults: productData
      });

      if (created) {
        console.log(`✅ Created sample product: ${product.name} (SKU: ${product.sku})`);
      } else {
        console.log(`ℹ️  Product already exists: ${product.name} (SKU: ${product.sku})`);
      }
    }

    // Create sample variants for the first product
    const sampleVariants = [
      {
        product_id: 1,
        variant_name: 'Size',
        variant_value: 'Small',
        price_modifier: 0.00,
        stock_quantity: 50,
        min_stock_level: 5,
        max_stock_level: 100,
        sku_suffix: 'S',
        barcode: '1234567890123-S',
        weight_modifier: 0.00,
        dimensions_modifier: '8x4x1.5 cm',
        status: 'active' as const
      },
      {
        product_id: 1,
        variant_name: 'Size',
        variant_value: 'Large',
        price_modifier: 0.50,
        stock_quantity: 30,
        min_stock_level: 3,
        max_stock_level: 80,
        sku_suffix: 'L',
        barcode: '1234567890123-L',
        weight_modifier: 0.20,
        dimensions_modifier: '12x6x2.5 cm',
        status: 'active' as const
      },
      {
        product_id: 1,
        variant_name: 'Color',
        variant_value: 'Red',
        price_modifier: 0.25,
        stock_quantity: 40,
        min_stock_level: 4,
        max_stock_level: 90,
        sku_suffix: 'R',
        barcode: '1234567890123-R',
        weight_modifier: 0.00,
        dimensions_modifier: '10x5x2 cm',
        status: 'active' as const
      }
    ];

    for (const variantData of sampleVariants) {
      const [variant, created] = await ProductVariant.findOrCreate({
        where: {
          product_id: variantData.product_id,
          variant_name: variantData.variant_name,
          variant_value: variantData.variant_value
        },
        defaults: variantData
      });

      if (created) {
        console.log(`✅ Created sample variant: ${variant.variant_name} = ${variant.variant_value}`);
      } else {
        console.log(`ℹ️  Variant already exists: ${variant.variant_name} = ${variant.variant_value}`);
      }
    }

    console.log('✅ Product tables setup completed successfully!');
    console.log('\n📋 Sample data created:');
    console.log('- 2 sample products with SKUs 1191 and 1192');
    console.log('- 3 sample variants (Size: Small/Large, Color: Red)');
    console.log('- All products have stock quantities and are active');

  } catch (error) {
    console.error('❌ Error setting up product tables:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupProductTables()
    .then(() => {
      console.log('🎉 Product tables setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Product tables setup failed:', error);
      process.exit(1);
    });
}

export default setupProductTables;

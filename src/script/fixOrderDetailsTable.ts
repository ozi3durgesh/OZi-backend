import sequelize from '../config/database';

/**
 * Fix existing order_details table to match the current model
 * This script adds missing columns and updates the table structure
 */
async function fixOrderDetailsTable() {
  try {
    console.log('🔧 Fixing order_details table structure...');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SHOW TABLES LIKE 'order_details';
    `);

    if (tables.length === 0) {
      console.log('❌ order_details table does not exist. Creating it...');
      await createOrderDetailsTable();
      return;
    }

    console.log('✅ order_details table exists. Checking structure...');

    // Get current table structure
    const [columns] = await sequelize.query(`
      DESCRIBE order_details;
    `);

    console.log('📋 Current table structure:');
    console.table(columns);

    // Check for missing columns and add them
    const requiredColumns = [
      { name: 'sku', type: 'VARCHAR(100)', nullable: 'NOT NULL' },
      { name: 'product_name', type: 'VARCHAR(255)', nullable: 'NOT NULL' },
      { name: 'price', type: 'DECIMAL(10,2)', nullable: 'NOT NULL' },
      { name: 'quantity', type: 'INT', nullable: 'NOT NULL' },
      { name: 'total_price', type: 'DECIMAL(10,2)', nullable: 'NOT NULL' },
      { name: 'variant', type: 'TEXT', nullable: 'NULL' },
      { name: 'variation', type: 'TEXT', nullable: 'NULL' },
      { name: 'add_ons', type: 'TEXT', nullable: 'NULL' },
      { name: 'discount_on_item', type: 'DECIMAL(10,2)', nullable: 'NOT NULL DEFAULT 0.00' },
      { name: 'discount_type', type: 'VARCHAR(50)', nullable: 'NOT NULL DEFAULT "amount"' },
      { name: 'tax_amount', type: 'DECIMAL(10,2)', nullable: 'NOT NULL DEFAULT 0.00' },
      { name: 'total_add_on_price', type: 'DECIMAL(10,2)', nullable: 'NOT NULL DEFAULT 0.00' },
      { name: 'food_details', type: 'TEXT', nullable: 'NULL' },
      { name: 'created_at', type: 'BIGINT', nullable: 'NOT NULL' },
      { name: 'updated_at', type: 'BIGINT', nullable: 'NOT NULL' }
    ];

    const existingColumnNames = (columns as any[]).map((col: any) => col.Field);
    console.log('📝 Existing columns:', existingColumnNames);

    for (const requiredCol of requiredColumns) {
      if (!existingColumnNames.includes(requiredCol.name)) {
        console.log(`➕ Adding missing column: ${requiredCol.name}`);
        
        try {
          await sequelize.query(`
            ALTER TABLE order_details 
            ADD COLUMN ${requiredCol.name} ${requiredCol.type} ${requiredCol.nullable}
          `);
          console.log(`✅ Added column: ${requiredCol.name}`);
        } catch (error) {
          console.log(`⚠️  Could not add column ${requiredCol.name}:`, error);
        }
      } else {
        console.log(`✅ Column exists: ${requiredCol.name}`);
      }
    }

    // Add indexes if they don't exist
    console.log('\n🔍 Adding indexes...');
    
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
      `);
      console.log('✅ Index on order_id added');
    } catch (error) {
      console.log('⚠️  Index on order_id already exists or could not be created');
    }

    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);
      `);
      console.log('✅ Index on product_id added');
    } catch (error) {
      console.log('⚠️  Index on product_id already exists or could not be created');
    }

    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_order_details_sku ON order_details(sku);
      `);
      console.log('✅ Index on sku added');
    } catch (error) {
      console.log('⚠️  Index on sku already exists or could not be created');
    }

    // Verify final structure
    const [finalColumns] = await sequelize.query(`
      DESCRIBE order_details;
    `);

    console.log('\n📋 Final table structure:');
    console.table(finalColumns);

    console.log('🎉 order_details table structure fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing order_details table:', error);
    throw error;
  }
}

/**
 * Create order_details table from scratch
 */
async function createOrderDetailsTable() {
  try {
    console.log('🏗️  Creating order_details table from scratch...');

    await sequelize.query(`
      CREATE TABLE order_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        variant TEXT NULL COMMENT 'JSON encoded variant selections',
        variation TEXT NULL COMMENT 'JSON encoded variation details',
        add_ons TEXT NULL COMMENT 'JSON encoded add-on selections',
        discount_on_item DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        discount_type VARCHAR(50) DEFAULT 'amount' NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        total_add_on_price DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        food_details TEXT NULL COMMENT 'JSON encoded complete product snapshot',
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id),
        INDEX idx_sku (sku),
        
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ order_details table created successfully');
  } catch (error) {
    console.error('❌ Error creating order_details table:', error);
    throw error;
  }
}

/**
 * Drop and recreate order_details table
 */
async function recreateOrderDetailsTable() {
  try {
    console.log('🗑️  Dropping existing order_details table...');
    
    await sequelize.query(`
      DROP TABLE IF EXISTS order_details;
    `);

    console.log('✅ Table dropped successfully');
    
    // Create new table
    await createOrderDetailsTable();
    
  } catch (error) {
    console.error('❌ Error recreating order_details table:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'fix';
  
  async function runCommand() {
    try {
      switch (command) {
        case 'create':
          await createOrderDetailsTable();
          break;
        case 'recreate':
          await recreateOrderDetailsTable();
          break;
        case 'fix':
        default:
          await fixOrderDetailsTable();
          break;
      }
      
      console.log('\n🎉 Command completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\n💥 Command failed:', error);
      process.exit(1);
    }
  }

  runCommand();
}

export { fixOrderDetailsTable, createOrderDetailsTable, recreateOrderDetailsTable };

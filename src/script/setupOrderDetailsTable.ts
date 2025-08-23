import sequelize from '../config/database';

/**
 * Setup script for order_details table
 * This table stores individual order line items with detailed product information
 */
async function setupOrderDetailsTable() {
  try {
    console.log('Setting up order_details table...');

    // Create order_details table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS order_details (
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

    // Add indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);
      CREATE INDEX IF NOT EXISTS idx_order_details_sku ON order_details(sku);
    `);

    console.log('✅ Indexes created successfully');

    // Verify table structure
    const [results] = await sequelize.query(`
      DESCRIBE order_details;
    `);

    console.log('📋 order_details table structure:');
    console.table(results);

    console.log('🎉 order_details table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up order_details table:', error);
    throw error;
  }
}

/**
 * Drop order_details table (for testing/cleanup)
 */
async function dropOrderDetailsTable() {
  try {
    console.log('Dropping order_details table...');
    
    await sequelize.query(`
      DROP TABLE IF EXISTS order_details;
    `);

    console.log('✅ order_details table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping order_details table:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'drop') {
    dropOrderDetailsTable()
      .then(() => {
        console.log('Cleanup completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Cleanup failed:', error);
        process.exit(1);
      });
  } else {
    setupOrderDetailsTable()
      .then(() => {
        console.log('Setup completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Setup failed:', error);
        process.exit(1);
      });
  }
}

export { setupOrderDetailsTable, dropOrderDetailsTable };

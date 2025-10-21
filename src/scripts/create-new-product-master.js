const mysql = require('mysql2/promise');
require('dotenv').config();

async function createNewProductMasterTable() {
  let connection;
  
  try {
    console.log('🚀 Creating New Product Master Table...');
    console.log('==========================================');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'ozi_backend',
      port: process.env.DB_PORT || 3306,
    });

    console.log('🧹 Cleaning up existing tables...');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop existing foreign key constraints that might reference product_master
    const foreignKeys = [
      'picklist_items_ibfk_7',
      'po_products_ibfk_4', 
      'picklist_items_ibfk_3',
      'po_products_ibfk_2'
    ];
    
    for (const fk of foreignKeys) {
      try {
        await connection.execute(`ALTER TABLE picklist_items DROP FOREIGN KEY ${fk}`);
        console.log(`✅ Dropped foreign key constraint: ${fk}`);
      } catch (error) {
        console.log(`⚠️  Foreign key constraint ${fk} not found or already dropped`);
      }
    }
    
    for (const fk of foreignKeys) {
      try {
        await connection.execute(`ALTER TABLE po_products DROP FOREIGN KEY ${fk}`);
        console.log(`✅ Dropped foreign key constraint: ${fk}`);
      } catch (error) {
        console.log(`⚠️  Foreign key constraint ${fk} not found or already dropped`);
      }
    }

    // Drop existing product_master table if it exists
    try {
      await connection.execute('DROP TABLE IF EXISTS product_master');
      console.log('✅ Dropped existing product_master table');
    } catch (error) {
      console.log('⚠️  No existing product_master table to drop');
    }

    console.log('📋 Creating new product_master table...');
    
    // Create the new product_master table
    await connection.execute(`
      CREATE TABLE product_master (
        id INT AUTO_INCREMENT PRIMARY KEY,
        status INT NOT NULL DEFAULT 1,
        catelogue_id VARCHAR(7) NOT NULL UNIQUE,
        product_id VARCHAR(9) NOT NULL,
        sku_id VARCHAR(12) NOT NULL UNIQUE,
        color VARCHAR(100) NULL,
        age_size VARCHAR(100) NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NULL,
        mrp DECIMAL(10,2) NOT NULL,
        avg_cost_to_ozi DECIMAL(10,2) NULL DEFAULT 0.00,
        ean_upc VARCHAR(255) NULL,
        brand_id INT NOT NULL,
        weight DECIMAL(10,2) NULL,
        length DECIMAL(10,2) NULL,
        height DECIMAL(10,2) NULL,
        width DECIMAL(10,2) NULL,
        inventory_threshold INT NULL,
        gst DECIMAL(5,2) NOT NULL,
        cess DECIMAL(5,2) NOT NULL,
        hsn VARCHAR(8) NOT NULL,
        created_by INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        logs JSON NOT NULL DEFAULT ('[]'),
        
        UNIQUE KEY unique_catelogue_id (catelogue_id),
        UNIQUE KEY unique_sku_id (sku_id),
        
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ New product_master table created successfully!');
    console.log('📊 Table structure:');
    console.log('  - Mandatory fields: name, category, description, mrp, brand_id, gst, cess, hsn, status');
    console.log('  - Optional fields: color, age_size, image_url, ean_upc, weight, length, height, width, inventory_threshold');
    console.log('  - Auto-generated fields: id, catelogue_id, product_id, sku_id, avg_cost_to_ozi, created_by, created_at, updated_at, logs');
    console.log('  - ID Generation Logic:');
    console.log('    * catelogue_id: 7 characters starting from 4000001');
    console.log('    * product_id: 9 characters (catalogue_id + 2 digits for colors)');
    console.log('    * sku_id: 12 characters (product_id + 3 digits for age_size)');
    
    console.log('🎉 New product_master table creation completed successfully!');

  } catch (error) {
    console.error('❌ Error creating new product_master table:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the creation
createNewProductMasterTable()
  .then(() => {
    console.log('\n✅ Database table creation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database table creation failed:', error.message);
    process.exit(1);
  });

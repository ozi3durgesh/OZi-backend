const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateProductMasterTable() {
  let connection;
  
  try {
    console.log('🔄 Updating Product Master Table...');
    console.log('==========================================');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ozi_backend',
      port: process.env.DB_PORT || 3306,
    });

    console.log('📋 Making color and age_size fields optional...');
    
    // Update color field to allow NULL
    await connection.execute(`
      ALTER TABLE product_master 
      MODIFY COLUMN color VARCHAR(100) NULL
    `);
    console.log('✅ Color field updated to allow NULL');

    // Update age_size field to allow NULL
    await connection.execute(`
      ALTER TABLE product_master 
      MODIFY COLUMN age_size VARCHAR(100) NULL
    `);
    console.log('✅ Age/Size field updated to allow NULL');

    console.log('\n🎉 Product Master table update completed successfully!');
    console.log('📊 Summary:');
    console.log('  - Color field is now optional (can be NULL)');
    console.log('  - Age/Size field is now optional (can be NULL)');
    console.log('  - All other fields remain as before');
    console.log('\n📝 Note:');
    console.log('  - Existing products with color/age_size will keep their values');
    console.log('  - New products can be created without color/age_size');
    console.log('  - ID generation logic has been updated to handle NULL values');

  } catch (error) {
    console.error('❌ Error updating Product Master table:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the update
updateProductMasterTable()
  .then(() => {
    console.log('\n✅ Database update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database update failed:', error.message);
    process.exit(1);
  });

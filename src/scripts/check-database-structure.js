const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStructure() {
  let connection;
  
  try {
    console.log('🔍 Checking Database Structure...');
    console.log('==========================================');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'ozi_backend',
      port: process.env.DB_PORT || 3306,
    });

    console.log('📋 Checking for product-related tables...');
    
    // Check for product-related tables
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE '%product%'
    `);
    
    console.log('Found product-related tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    if (tables.length === 0) {
      console.log('❌ No product-related tables found');
      return;
    }

    // Check structure of each table
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\n📊 Structure of ${tableName}:`);
      
      const [columns] = await connection.execute(`
        DESCRIBE ${tableName}
      `);
      
      columns.forEach(column => {
        console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `(${column.Key})` : ''}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking database structure:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkDatabaseStructure()
  .then(() => {
    console.log('\n✅ Database structure check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database structure check failed:', error.message);
    process.exit(1);
  });

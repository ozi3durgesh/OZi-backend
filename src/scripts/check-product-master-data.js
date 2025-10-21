const sequelize = require('../config/database.ts').default;

async function checkProductMasterData() {
  try {
    console.log('🔍 Checking product_master table data...');
    
    // Get all records
    const [rows] = await sequelize.query(`
      SELECT id, catelogue_id, product_id, sku_id, name, color, age_size
      FROM product_master 
      ORDER BY id
    `);
    
    console.log(`\n📊 Found ${rows.length} records:`);
    rows.forEach(row => {
      console.log(`  ID: ${row.id}, Catalogue: ${row.catelogue_id}, Product: ${row.product_id}, SKU: ${row.sku_id}, Name: ${row.name}, Color: ${row.color}, Age/Size: ${row.age_size}`);
    });
    
    // Test the current generateCatalogueId logic
    console.log('\n🧪 Testing generateCatalogueId logic...');
    const [testResult] = await sequelize.query(`
      SELECT MAX(CAST(catelogue_id AS UNSIGNED)) as max_id 
      FROM product_master 
      WHERE catelogue_id REGEXP "^4[0-9]{6}$"
    `);
    
    const maxId = testResult[0]?.max_id || 4000000;
    const nextId = maxId + 1;
    
    console.log(`  Max ID found: ${maxId}`);
    console.log(`  Next ID would be: ${nextId}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkProductMasterData();

const sequelize = require('../config/database').default;

async function checkSpecificCatalogueId() {
  try {
    console.log('🔍 Checking for catalogue_id 4000003...');
    
    // Check if 4000003 exists
    const [rows] = await sequelize.query(`
      SELECT id, catelogue_id, product_id, sku_id, name, color, age_size
      FROM product_master 
      WHERE catelogue_id = '4000003'
    `);
    
    if (rows.length > 0) {
      console.log(`\n⚠️  Found ${rows.length} records with catalogue_id 4000003:`);
      rows.forEach(row => {
        console.log(`  ID: ${row.id}, Catalogue: ${row.catelogue_id}, Product: ${row.product_id}, SKU: ${row.sku_id}, Name: ${row.name}`);
      });
    } else {
      console.log('\n✅ No records found with catalogue_id 4000003');
    }
    
    // Check all records with 4000003 pattern
    const [allRows] = await sequelize.query(`
      SELECT id, catelogue_id, product_id, sku_id, name, color, age_size
      FROM product_master 
      WHERE catelogue_id LIKE '4000003%'
      ORDER BY id
    `);
    
    if (allRows.length > 0) {
      console.log(`\n📊 Found ${allRows.length} records with catalogue_id starting with 4000003:`);
      allRows.forEach(row => {
        console.log(`  ID: ${row.id}, Catalogue: ${row.catelogue_id}, Product: ${row.product_id}, SKU: ${row.sku_id}, Name: ${row.name}`);
      });
    } else {
      console.log('\n✅ No records found with catalogue_id starting with 4000003');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkSpecificCatalogueId();

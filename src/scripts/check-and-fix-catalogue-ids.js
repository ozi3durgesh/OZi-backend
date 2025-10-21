const sequelize = require('../config/database').default;

async function checkAndFixCatalogueIds() {
  try {
    console.log('🔍 Checking existing catalogue_ids...');
    
    // Check existing catalogue_ids
    const [rows] = await sequelize.query(`
      SELECT catelogue_id, COUNT(*) as count 
      FROM product_master 
      GROUP BY catelogue_id 
      ORDER BY CAST(catelogue_id AS UNSIGNED)
    `);
    
    console.log('Existing catalogue_ids:');
    rows.forEach(row => {
      console.log(`  ${row.catelogue_id}: ${row.count} records`);
    });
    
    // Get the maximum catalogue_id
    const [maxResult] = await sequelize.query(`
      SELECT MAX(CAST(catelogue_id AS UNSIGNED)) as max_id 
      FROM product_master 
      WHERE catelogue_id REGEXP "^4[0-9]{6}$"
    `);
    
    const maxId = maxResult[0]?.max_id || 4000000;
    console.log(`\n📊 Current max catalogue_id: ${maxId}`);
    console.log(`📊 Next catalogue_id should be: ${maxId + 1}`);
    
    // Check if there are any duplicate catalogue_ids
    const [duplicates] = await sequelize.query(`
      SELECT catelogue_id, COUNT(*) as count 
      FROM product_master 
      GROUP BY catelogue_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Found duplicate catalogue_ids:');
      duplicates.forEach(dup => {
        console.log(`  ${dup.catelogue_id}: ${dup.count} records`);
      });
      
      console.log('\n🔧 Fixing duplicate catalogue_ids...');
      
      for (const dup of duplicates) {
        const [records] = await sequelize.query(`
          SELECT id, catelogue_id, product_id, sku_id 
          FROM product_master 
          WHERE catelogue_id = ? 
          ORDER BY id
        `, {
          replacements: [dup.catelogue_id],
          type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`\n  Fixing ${dup.catelogue_id} (${records.length} records):`);
        
        for (let i = 1; i < records.length; i++) {
          const newCatalogueId = maxId + i;
          const newProductId = `${newCatalogueId}01`;
          const newSkuId = `${newProductId}001`;
          
          console.log(`    Record ${records[i].id}: ${dup.catelogue_id} -> ${newCatalogueId}`);
          
          await sequelize.query(`
            UPDATE product_master 
            SET catelogue_id = ?, product_id = ?, sku_id = ?
            WHERE id = ?
          `, {
            replacements: [newCatalogueId.toString(), newProductId, newSkuId, records[i].id]
          });
        }
      }
      
      console.log('✅ Duplicate catalogue_ids fixed!');
    } else {
      console.log('\n✅ No duplicate catalogue_ids found.');
    }
    
    // Final check
    const [finalRows] = await sequelize.query(`
      SELECT catelogue_id, COUNT(*) as count 
      FROM product_master 
      GROUP BY catelogue_id 
      ORDER BY CAST(catelogue_id AS UNSIGNED)
    `);
    
    console.log('\n📋 Final catalogue_ids:');
    finalRows.forEach(row => {
      console.log(`  ${row.catelogue_id}: ${row.count} records`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkAndFixCatalogueIds();
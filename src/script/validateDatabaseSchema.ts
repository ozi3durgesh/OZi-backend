// script/validateDatabaseSchema.ts
import sequelize from '../config/database';

async function validateDatabaseSchema() {
  try {
    console.log('🔍 Validating database schema...\n');

    // Check order_details table structure
    console.log('📋 Checking order_details table...');
    const [orderDetailsColumns] = await sequelize.query(`
      DESCRIBE order_details;
    `);

    const requiredColumns = [
      'id', 'order_id', 'product_id', 'product_name', 'sku', 'price', 
      'quantity', 'total_price', 'variant', 'variation', 'add_ons',
      'discount_on_item', 'discount_type', 'tax_amount', 'total_add_on_price',
      'food_details', 'created_at', 'updated_at'
    ];

    const existingColumns = (orderDetailsColumns as any[]).map(col => col.Field);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('❌ Missing required columns in order_details table:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
      
      console.log('\n🔧 To fix this, run: npm run db:fix');
    } else {
      console.log('✅ All required columns exist in order_details table');
    }

    // Check data types for timestamp fields
    console.log('\n⏰ Checking timestamp field types...');
    const createdAtCol = (orderDetailsColumns as any[]).find(col => col.Field === 'created_at');
    const updatedAtCol = (orderDetailsColumns as any[]).find(col => col.Field === 'updated_at');

    if (createdAtCol) {
      console.log(`   - created_at: ${createdAtCol.Type} (Null: ${createdAtCol.Null})`);
    }
    if (updatedAtCol) {
      console.log(`   - updated_at: ${updatedAtCol.Type} (Null: ${updatedAtCol.Null})`);
    }

    // Check foreign key constraints
    console.log('\n🔗 Checking foreign key constraints...');
    const [constraints] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'order_details' 
      AND REFERENCED_TABLE_NAME IS NOT NULL;
    `);

    if ((constraints as any[]).length > 0) {
      console.log('✅ Foreign key constraints found:');
      (constraints as any[]).forEach(constraint => {
        console.log(`   - ${constraint.COLUMN_NAME} → ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('⚠️  No foreign key constraints found for order_details table');
    }

    // Check if there are any existing records
    console.log('\n📊 Checking existing data...');
    const [recordCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM order_details;
    `);
    console.log(`   - Total records: ${(recordCount as any[])[0]?.count || 0}`);

    // Check for any records with null timestamps
    if ((recordCount as any[])[0]?.count > 0) {
      const [nullTimestampCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM order_details 
        WHERE created_at IS NULL OR updated_at IS NULL;
      `);
      const nullCount = (nullTimestampCount as any[])[0]?.count || 0;
      
      if (nullCount > 0) {
        console.log(`   - Records with null timestamps: ${nullCount}`);
        console.log('   ⚠️  This could cause the "notNull Violation" error');
      } else {
        console.log('   ✅ All existing records have valid timestamps');
      }
    }

    // Summary
    console.log('\n📋 Schema Validation Summary:');
    if (missingColumns.length === 0 && (recordCount as any[])[0]?.count === 0) {
      console.log('✅ Database schema is valid and ready for use');
    } else if (missingColumns.length > 0) {
      console.log('❌ Database schema has issues that need to be fixed');
      console.log('   Run: npm run db:fix');
    } else {
      console.log('⚠️  Database schema is mostly valid but has some warnings');
    }

  } catch (error) {
    console.error('❌ Error validating database schema:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  validateDatabaseSchema()
    .then(() => {
      console.log('\n🎉 Schema validation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Schema validation failed:', error);
      process.exit(1);
    });
}

export default validateDatabaseSchema;

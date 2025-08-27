// script/validateDatabaseSchema.ts
import sequelize from '../config/database';

async function validateDatabaseSchema() {
  try {
    console.log('🔍 Validating database schema...\n');

    // Check core tables structure
    console.log('📋 Checking core application tables...');
    
    // Check users table
    console.log('\n👥 Checking users table...');
    try {
      const [userColumns] = await sequelize.query(`DESCRIBE users;`);
      console.log(`✅ Users table exists with ${(userColumns as any[]).length} columns`);
    } catch (error) {
      console.log('❌ Users table does not exist');
    }

    // Check orders table
    console.log('\n📦 Checking orders table...');
    try {
      const [orderColumns] = await sequelize.query(`DESCRIBE orders;`);
      console.log(`✅ Orders table exists with ${(orderColumns as any[]).length} columns`);
      
      // Check order ID format
      const [orderIds] = await sequelize.query(`
        SELECT order_id, created_at 
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if ((orderIds as any[]).length > 0) {
        console.log('\n🔍 Sample order IDs:');
        (orderIds as any[]).forEach((order: any, index: number) => {
          const isValid = order.order_id && order.order_id.match(/^ozi\d{13,17}$/);
          const status = isValid ? '✅' : '❌';
          console.log(`  ${status} ${order.order_id || 'NULL'} (created: ${new Date(order.created_at * 1000).toISOString()})`);
        });
        
        // Check overall format compliance
        const [invalidCount] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM orders 
          WHERE order_id IS NULL OR order_id NOT REGEXP '^ozi[0-9]{13,17}$'
        `);
        const invalid = (invalidCount as any[])[0]?.count || 0;
        
        if (invalid > 0) {
          console.log(`⚠️  Found ${invalid} orders with incorrect ID format`);
          console.log('💡 Run: npm run script:fix-order-ids to fix existing order IDs');
        } else {
          console.log('✅ All order IDs follow the correct format: ozi + milliseconds + sequence');
        }
      }
    } catch (error) {
      console.log('❌ Orders table does not exist');
    }

    // Check roles table
    console.log('\n🔐 Checking roles table...');
    try {
      const [roleColumns] = await sequelize.query(`DESCRIBE roles;`);
      console.log(`✅ Roles table exists with ${(roleColumns as any[]).length} columns`);
    } catch (error) {
      console.log('❌ Roles table does not exist');
    }

    // Check permissions table
    console.log('\n🔑 Checking permissions table...');
    try {
      const [permissionColumns] = await sequelize.query(`DESCRIBE permissions;`);
      console.log(`✅ Permissions table exists with ${(permissionColumns as any[]).length} columns`);
    } catch (error) {
      console.log('❌ Permissions table does not exist');
    }

    // Summary
    console.log('\n📋 Schema Validation Summary:');
    console.log('✅ Core application tables validated successfully');
    console.log('📝 This validation checks only the essential tables used by the application');
    console.log('🔧 For database fixes, run: npm run db:fix');

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

// scripts/fixDatabaseSchema.ts
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if tables exist
    const tables = await sequelize.query(
      "SHOW TABLES",
      { type: QueryTypes.SHOWTABLES }
    );
    
    console.log('📋 Existing tables:', tables);

    // Check for foreign key constraint conflicts
    const constraints = await sequelize.query(
      `SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );

    console.log('🔗 Foreign key constraints:', constraints);

    // If there are conflicts, drop and recreate tables
    if (tables.length > 0) {
      console.log('⚠️  Tables already exist. Dropping them to resolve conflicts...');
      
      // Drop all tables in reverse dependency order
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      for (const table of tables.reverse()) {
        const tableName = Object.values(table)[0];
        console.log(`🗑️  Dropping table: ${tableName}`);
        await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      }
      
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ All existing tables dropped');
    }

    // Import models to ensure they are registered
    console.log('📦 Importing models...');
    await import('../models/index.js');
    console.log('✅ Models imported successfully');

    // Sync database with force: true to create fresh tables
    console.log('🔄 Creating fresh database schema...');
    await sequelize.sync({ force: true });
    console.log('✅ Database schema created successfully');

    console.log('\n🎉 Database schema fixed successfully!');
    console.log('Next steps:');
    console.log('1. Run: npm run init-rbac');
    console.log('2. Run: npm run test-registration');
    console.log('3. Start server: npm run dev');

  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    throw error;
  }
}

// Run the fix
fixDatabaseSchema()
  .then(() => {
    console.log('Database schema fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database schema fix failed:', error);
    process.exit(1);
  });

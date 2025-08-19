// scripts/debugRoles.ts
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function debugRoles() {
  try {
    console.log('🔍 Debugging roles table...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check what tables exist
    const tables = await sequelize.query(
      "SHOW TABLES",
      { type: QueryTypes.SHOWTABLES }
    );
    
    console.log('📋 Existing tables:', tables);

    // Check roles table specifically
    const roles = await sequelize.query(
      "SELECT * FROM roles",
      { type: QueryTypes.SELECT }
    );

    console.log('\n🔑 Roles in database:');
    if (roles.length === 0) {
      console.log('❌ No roles found in roles table');
    } else {
      roles.forEach((role: any) => {
        console.log(`- ID: ${role.id}, Name: '${role.name}', Description: ${role.description}`);
      });
    }

    // Check users table
    const users = await sequelize.query(
      "SELECT * FROM users",
      { type: QueryTypes.SELECT }
    );

    console.log('\n👥 Users in database:');
    if (users.length === 0) {
      console.log('❌ No users found in users table');
    } else {
      users.forEach((user: any) => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, RoleID: ${user.roleId}`);
      });
    }

    // Check table structure
    const rolesStructure = await sequelize.query(
      "DESCRIBE roles",
      { type: QueryTypes.DESCRIBE }
    );

    console.log('\n🏗️  Roles table structure:');
    if (Array.isArray(rolesStructure)) {
      rolesStructure.forEach((column: any) => {
        console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('Table structure query returned non-array result');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  }
}

// Run the debug
debugRoles()
  .then(() => {
    console.log('\nDebug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
  });

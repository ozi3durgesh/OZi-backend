// scripts/testRegistration.ts
import { User, Role } from '../models';

async function testRegistration() {
  try {
    console.log('Testing registration system...\n');

    // Check if system has users
    const totalUsers = await User.count();
    console.log(`Total users in system: ${totalUsers}`);

    // Check if roles exist
    const roles = await Role.findAll();
    console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);

    // Check admin role specifically
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (adminRole) {
      console.log(`Admin role found: ID ${adminRole.id}, Name: ${adminRole.name}`);
    } else {
      console.log('Admin role not found!');
    }

    // Check if any users exist
    const users = await User.findAll({
      include: [{ association: 'Role' }],
      attributes: ['id', 'email', 'roleId']
    });

    if (users.length > 0) {
      console.log('\nExisting users:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Role ID: ${user.roleId}`);
      });
    } else {
      console.log('\nNo users found in system');
    }

    console.log('\n✅ Registration test completed!');
  } catch (error) {
    console.error('❌ Registration test failed:', error);
    throw error;
  }
}

// Run the test
testRegistration()
  .then(() => {
    console.log('Registration testing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Registration testing failed:', error);
    process.exit(1);
  });

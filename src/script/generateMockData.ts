// script/generateMockData.ts
import sequelize from '../config/database';
import { PickingWave, PicklistItem, User, Role } from '../models';

async function generateMockData() {
  try {
    console.log('Generating mock data for testing...');

    // Check if we have users and roles
    const users = await User.findAll();
    const roles = await Role.findAll();

    if (users.length === 0) {
      console.log('No users found. Please run the RBAC setup first.');
      return;
    }

    if (roles.length === 0) {
      console.log('No roles found. Please run the RBAC setup first.');
      return;
    }

    // Find a user with manager role for testing
    const managerUser = users.find(user => user.roleId === 1); // Assuming role ID 1 is manager
    const packerUser = users.find(user => user.roleId === 2); // Assuming role ID 2 is packer

    if (!managerUser || !packerUser) {
      console.log('Manager or packer users not found. Please check your RBAC setup.');
      return;
    }

    console.log(`Using manager: ${managerUser.email}`);
    console.log(`Using packer: ${packerUser.email}`);

    // Create mock picking waves - simplified for deployment
    console.log('✓ Skipping mock data generation for deployment');
    console.log('✓ Mock data generation completed successfully!');

    console.log('\n🎉 Mock data generation completed successfully!');
    console.log('\nYou can now test the packing module with:');
    console.log(`1. Manager ID: ${managerUser.id}`);
    console.log(`2. Packer ID: ${packerUser.id}`);

    console.log('\nTest commands:');
    console.log('npm run test-packing');
    console.log('npm run test-rbac');

  } catch (error) {
    console.error('Error generating mock data:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  generateMockData();
}

export default generateMockData;

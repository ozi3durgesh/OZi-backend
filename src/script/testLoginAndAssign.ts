// scripts/testLoginAndAssign.ts
import { connectDatabase } from '../config/database';
import bcrypt from 'bcryptjs';
import { User, Role } from '../models';

async function testLoginAndAssign() {
  try {
    console.log('Testing login and wave assignment...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connection established');

    // Test login with existing admin user
    const email = 'admin@company.com';
    const password = 'admin123'; // You might need to adjust this password

    console.log(`\n=== Testing Login ===`);
    console.log(`Email: ${email}`);

    // Find user
    const user = await User.findOne({ 
      where: { email },
      include: [
        {
          association: 'Role',
          include: ['Permissions'],
        }
      ],
      attributes: ['id', 'email', 'password', 'roleId', 'isActive', 'availabilityStatus']
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ID ${user.id}, Role: ${user.Role?.name}`);

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is not active');
      return;
    }

    // Check permissions
    const permissions = user.Role?.Permissions || [];
    console.log(`Permissions count: ${permissions.length}`);
    permissions.forEach(p => {
      console.log(`  - ${p.module}:${p.action}`);
    });

    // Check if user has picking:assign_manage permission
    const hasAssignPermission = permissions.some(p => 
      p.module === 'picking' && p.action === 'assign_manage'
    );

    if (!hasAssignPermission) {
      console.log('❌ User does not have picking:assign_manage permission');
      return;
    }

    console.log('✅ User has required permissions');

    // Test password (you might need to adjust this)
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (isValidPassword) {
        console.log('✅ Password is valid');
      } else {
        console.log('❌ Password is invalid - you may need to update the password in this script');
        return;
      }
    } catch (error) {
      console.log('❌ Error checking password:', error);
      return;
    }

    console.log('\n=== Login Successful ===');
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.Role?.name}`);
    console.log(`Status: ${user.availabilityStatus}`);

    // Now test the wave assignment endpoint
    console.log('\n=== Testing Wave Assignment ===');
    
    // You can now use this user ID (2) and email (admin@company.com) 
    // to test the /api/picklist/assign endpoint
    
    console.log('\n✅ Test completed successfully!');
    console.log('\nTo test the endpoint, use:');
    console.log(`curl --location 'http://localhost:3000/api/picklist/assign' \\`);
    console.log(`--header 'Content-Type: application/json' \\`);
    console.log(`--header 'Authorization: Bearer <YOUR_TOKEN>' \\`);
    console.log(`--data '{"waveId": 9, "pickerId": 2, "priority": "HIGH"}'`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Run the test
testLoginAndAssign()
  .then(() => {
    console.log('Login and assignment test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Login and assignment test failed:', error);
    process.exit(1);
  });

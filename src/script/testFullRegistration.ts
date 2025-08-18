// scripts/testFullRegistration.ts
import { User, Role } from '../models';
import { connectDatabase } from '../config/database';
import bcrypt from 'bcryptjs';
import { JwtUtils } from '../utils/jwt';

async function testFullRegistration() {
  try {
    console.log('Testing full registration flow...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connection established');

    // Check if roles exist
    const roles = await Role.findAll();
    console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);

    // Check if users exist
    const totalUsers = await User.count();
    console.log(`Total users: ${totalUsers}`);

    // Test the exact registration flow
    console.log('\n=== Testing Registration Flow ===');
    
    const email = 'fulltest@example.com';
    const password = 'Password123';
    const roleName = 'wh_staff_1';

    // 1. Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('❌ User already exists');
      return;
    }

    // 2. Find role by name
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      console.log('❌ Role not found');
      return;
    }
    console.log(`✅ Role found: ${role.name} (ID: ${role.id})`);

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // 4. Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      roleId: role.id,
      isActive: true,
      availabilityStatus: 'available'
    });
    console.log('✅ User created:', { id: user.id, email: user.email, roleId: user.roleId });

    // 5. Generate JWT tokens
    try {
      const accessToken = await JwtUtils.generateAccessToken(user);
      console.log('✅ Access token generated');
      
      const refreshToken = await JwtUtils.generateRefreshToken(user);
      console.log('✅ Refresh token generated');
    } catch (jwtError) {
      console.error('❌ JWT generation failed:', jwtError);
    }

    // 6. Get user with role and permissions
    try {
      const userWithRole = await User.findByPk(user.id, {
        include: [
          {
            association: 'Role',
            include: ['Permissions'],
          }
        ],
        attributes: ['id', 'email', 'roleId', 'isActive', 'availabilityStatus', 'createdAt']
      });
      
      console.log('✅ User with role retrieved');
      console.log('Role:', userWithRole?.Role?.name);
      console.log('Permissions count:', userWithRole?.Role?.Permissions?.length || 0);
    } catch (assocError) {
      console.error('❌ Association query failed:', assocError);
    }

    // Clean up
    await user.destroy();
    console.log('✅ Test user cleaned up');

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
testFullRegistration()
  .then(() => {
    console.log('Full registration test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Full registration test failed:', error);
    process.exit(1);
  });

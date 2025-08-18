// script/createTestUser.ts
import { User, Role } from '../models';
import { connectDatabase } from '../config/database';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    console.log('Creating permanent test user...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connection established');

    // Check if roles exist
    const roles = await Role.findAll();
    console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);

    // Check if test user already exists
    const existingUser = await User.findOne({ where: { email: 'test@ozi.com' } });
    if (existingUser) {
      console.log('✅ Test user already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        roleId: existingUser.roleId
      });
      return;
    }

    // Create a permanent test user
    console.log('\nCreating permanent test user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await User.create({
      email: 'test@ozi.com',
      password: hashedPassword,
      roleId: 1, // Admin role
      isActive: true,
      availabilityStatus: 'available'
    });

    console.log('✅ Test user created successfully:', {
      id: testUser.id,
      email: testUser.email,
      roleId: testUser.roleId,
      password: 'password123'
    });

    console.log('\nYou can now login with:');
    console.log('Email: test@ozi.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  } finally {
    // Database connection is managed by Sequelize
    process.exit(0);
  }
}

// Run the script
createTestUser()
  .then(() => {
    console.log('\nTest user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test user creation failed:', error);
    process.exit(1);
  });

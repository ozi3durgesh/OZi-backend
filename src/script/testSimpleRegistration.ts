// scripts/testSimpleRegistration.ts
import { User, Role } from '../models';
import { connectDatabase } from '../config/database';
import bcrypt from 'bcryptjs';

async function testSimpleRegistration() {
  try {
    console.log('Testing simple registration...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connection established');

    // Check if roles exist
    const roles = await Role.findAll();
    console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);

    // Check if users exist
    const totalUsers = await User.count();
    console.log(`Total users: ${totalUsers}`);

    // Try to create a simple user
    console.log('\nAttempting to create a test user...');
    
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const testUser = await User.create({
      email: 'simpletest@example.com',
      password: hashedPassword,
      roleId: 3, // WH Staff 1
      isActive: true,
      availabilityStatus: 'available'
    });

    console.log('✅ Test user created successfully:', {
      id: testUser.id,
      email: testUser.email,
      roleId: testUser.roleId
    });

    // Clean up
    await testUser.destroy();
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
testSimpleRegistration()
  .then(() => {
    console.log('Simple registration test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Simple registration test failed:', error);
    process.exit(1);
  });

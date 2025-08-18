// scripts/debugPermissions.ts
import { Permission } from '../models';
import { connectDatabase } from '../config/database';

async function debugPermissions() {
  try {
    console.log('Debugging permission creation...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connection established');

    // Test creating a single permission
    console.log('\nTesting single permission creation...');
    const testPermission = await Permission.create({
      module: 'test',
      action: 'test',
      description: 'Test permission'
    } as any);

    console.log('Created permission:', {
      id: testPermission.id,
      module: testPermission.module,
      action: testPermission.action,
      description: testPermission.description
    });

    // Check if the permission was saved correctly
    const retrievedPermission = await Permission.findByPk(testPermission.id);
    console.log('Retrieved permission:', {
      id: retrievedPermission?.id,
      module: retrievedPermission?.module,
      action: retrievedPermission?.action,
      description: retrievedPermission?.description
    });

    // Test bulk create with a small array
    console.log('\nTesting bulk create...');
    const testPermissions = [
      { module: 'bulk_test', action: 'action1', description: 'Bulk test 1' },
      { module: 'bulk_test', action: 'action2', description: 'Bulk test 2' }
    ];

    const createdPermissions = await Permission.bulkCreate(testPermissions as any);
    console.log('Bulk created permissions:');
    createdPermissions.forEach((p, index) => {
      console.log(`${index + 1}:`, {
        id: p.id,
        module: p.module,
        action: p.action,
        description: p.description
      });
    });

    // Clean up test data
    await Permission.destroy({ where: { module: 'test' } });
    await Permission.destroy({ where: { module: 'bulk_test' } });
    console.log('\n✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  }
}

// Run the debug
debugPermissions()
  .then(() => {
    console.log('Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
  });

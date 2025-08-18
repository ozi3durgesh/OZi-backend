// scripts/testRBAC.ts
import { Role, Permission, RolePermission } from '../models';
import sequelize from '../config/database';

async function testRBAC() {
  try {
    console.log('Testing RBAC setup...\n');

    // 1. Check roles
    console.log('1. Checking roles...');
    const roles = await Role.findAll();
    console.log(`Found ${roles.length} roles:`);
    roles.forEach((role: any) => {
      console.log(`  - ${role.name}: ${role.description}`);
    });

    // 2. Check permissions
    console.log('\n2. Checking permissions...');
    const permissions = await Permission.findAll();
    console.log(`Found ${permissions.length} permissions:`);
    
    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    Object.keys(permissionsByModule).forEach(module => {
      console.log(`  - ${module}:`);
      permissionsByModule[module].forEach((perm: any) => {
        console.log(`    * ${perm.action}: ${perm.description}`);
      });
    });

    // 3. Check role-permission assignments
    console.log('\n3. Checking role-permission assignments...');
    const rolePermissions = await RolePermission.findAll();
    console.log(`Found ${rolePermissions.length} role-permission assignments`);

    // Count permissions per role
    const rolePermissionCounts = rolePermissions.reduce((acc: any, rp: any) => {
      acc[rp.roleId] = (acc[rp.roleId] || 0) + 1;
      return acc;
    }, {});

    console.log('Permissions per role:');
    for (const [roleId, count] of Object.entries(rolePermissionCounts)) {
      const role = roles.find((r: any) => r.id === parseInt(roleId));
      console.log(`  - ${role?.name || 'Unknown'}: ${count} permissions`);
    }

    // 4. Verify specific role permissions
    console.log('\n4. Verifying specific role permissions...');
    
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const whManagerRole = await Role.findOne({ where: { name: 'wh_manager' } });
    const storeOpsRole = await Role.findOne({ where: { name: 'store_ops' } });

    if (adminRole) {
      const adminPermissions = await RolePermission.findAll({ 
        where: { roleId: adminRole.id }
      });
      console.log(`  - Admin permissions: ${adminPermissions.length} (should have all)`);
    }

    if (whManagerRole) {
      const whManagerPermissions = await RolePermission.findAll({ 
        where: { roleId: whManagerRole.id }
      });
      console.log(`  - WH Manager permissions: ${whManagerPermissions.length} (should have 14)`);
    }

    if (storeOpsRole) {
      const storeOpsPermissions = await RolePermission.findAll({ 
        where: { roleId: storeOpsRole.id }
      });
      console.log(`  - Store Ops permissions: ${storeOpsPermissions.length} (should have 11)`);
    }

    console.log('\n✅ RBAC test completed successfully!');
    console.log('\nSummary:');
    console.log(`- Roles: ${roles.length}`);
    console.log(`- Permissions: ${permissions.length}`);
    console.log(`- Role-Permission Assignments: ${rolePermissions.length}`);

  } catch (error) {
    console.error('❌ RBAC test failed:', error);
    throw error;
  }
}

// Run the test
testRBAC()
  .then(() => {
    console.log('RBAC testing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('RBAC testing failed:', error);
    process.exit(1);
  });

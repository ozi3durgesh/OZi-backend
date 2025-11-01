// Seed script for RBAC (Roles, Permissions, Role-Permissions)
import sequelize from '../config/database';
import Role from '../models/Role';
import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';

interface PermissionData {
  id: number;
  module: string;
  action: string;
  description: string;
}

interface RoleData {
  name: string;
  description: string;
  permissionIds: number[];
}


// Define all 49 permissions
const permissions: PermissionData[] = [
  // Users module (1-4)
  { id: 1, module: 'users', action: 'create', description: 'Create new users' },
  { id: 2, module: 'users', action: 'delete', description: 'Delete users' },
  { id: 3, module: 'users', action: 'edit', description: 'Edit users' },
  { id: 4, module: 'users', action: 'view', description: 'View users' },
  
  // Roles module (5-8)
  { id: 5, module: 'roles', action: 'create', description: 'Create roles' },
  { id: 6, module: 'roles', action: 'view', description: 'View roles' },
  { id: 7, module: 'roles', action: 'edit', description: 'Edit roles' },
  { id: 8, module: 'roles', action: 'delete', description: 'Delete roles' },
  
  // Permissions module (9-12)
  { id: 9, module: 'permissions', action: 'create', description: 'Create permissions' },
  { id: 10, module: 'permissions', action: 'view', description: 'View permissions' },
  { id: 11, module: 'permissions', action: 'edit', description: 'Edit permissions' },
  { id: 12, module: 'permissions', action: 'delete', description: 'Delete permissions' },
  
  // Vendor managements (13-15)
  { id: 13, module: 'vendor_managements', action: 'create', description: 'Create vendor' },
  { id: 14, module: 'vendor_managements', action: 'view', description: 'View vendor' },
  { id: 15, module: 'vendor_managements', action: 'edit', description: 'Edit vendor' },
  
  // Products master (16-18)
  { id: 16, module: 'products_master', action: 'create', description: 'Create product master' },
  { id: 17, module: 'products_master', action: 'view', description: 'View product master' },
  { id: 18, module: 'products_master', action: 'edit', description: 'Edit product master' },
  
  // Brands (19-20)
  { id: 19, module: 'brands', action: 'create', description: 'Create brand' },
  { id: 20, module: 'brands', action: 'view', description: 'View brand' },
  
  // DC PO Raise (21-22)
  { id: 21, module: 'dc_po_raise', action: 'create', description: 'Create DC PO' },
  { id: 22, module: 'dc_po_raise', action: 'view', description: 'View DC PO' },
  
  // DC PO Approve (23-26)
  { id: 23, module: 'dc_po_approve', action: 'approve', description: 'Approve DC PO' },
  { id: 24, module: 'dc_po_approve', action: 'view', description: 'View DC PO approvals' },
  { id: 25, module: 'dc_po_approve', action: 'edit', description: 'Edit DC PO approval' },
  { id: 26, module: 'dc_po_reject', action: 'reject', description: 'Reject DC PO' },
  
  // DC PO Payments (27-28)
  { id: 27, module: 'dc_po_payments', action: 'create', description: 'Create DC PO payment' },
  { id: 28, module: 'dc_po_payments', action: 'view', description: 'View DC PO payments' },
  
  // DC GRNs (29-30)
  { id: 29, module: 'dc_grns', action: 'create', description: 'Create DC GRN' },
  { id: 30, module: 'dc_grns', action: 'view', description: 'View DC GRN' },
  
  // FC PO Raise (31-32)
  { id: 31, module: 'fc_po_raise', action: 'create', description: 'Create FC PO' },
  { id: 32, module: 'fc_po_raise', action: 'view', description: 'View FC PO' },
  
  // FC PO Approve (33-35)
  { id: 33, module: 'fc_po_approve', action: 'approve', description: 'Approve FC PO' },
  { id: 34, module: 'fc_po_approve', action: 'view', description: 'View FC PO approvals' },
  { id: 35, module: 'fc_po_reject', action: 'reject', description: 'Reject FC PO' },
  
  // FC GRNs (36-37)
  { id: 36, module: 'fc_grns', action: 'create', description: 'Create FC GRN' },
  { id: 37, module: 'fc_grns', action: 'view', description: 'View FC GRN' },
  
  // FC Putaway (38-39)
  { id: 38, module: 'fc_putaway', action: 'create', description: 'Create FC putaway' },
  { id: 39, module: 'fc_putaway', action: 'view', description: 'View FC putaway' },
  
  // Picklist (40-41)
  { id: 40, module: 'picklist', action: 'create', description: 'Create picklist' },
  { id: 41, module: 'picklist', action: 'view', description: 'View picklist' },
  
  // Dispatch (42-43)
  { id: 42, module: 'dispatch', action: 'create', description: 'Create dispatch' },
  { id: 43, module: 'dispatch', action: 'view', description: 'View dispatch' },
  
  // Handover (44-45)
  { id: 44, module: 'handover', action: 'create', description: 'Create handover' },
  { id: 45, module: 'handover', action: 'view', description: 'View handover' },
  
  // Return GRN (46-47)
  { id: 46, module: 'return_grn', action: 'create', description: 'Create return GRN' },
  { id: 47, module: 'return_grn', action: 'view', description: 'View return GRN' },
  
  // Return Putaway (48-49)
  { id: 48, module: 'return_putaway', action: 'create', description: 'Create return putaway' },
  { id: 49, module: 'return_putaway', action: 'view', description: 'View return putaway' },
];

// Define roles with their permission IDs
const roles: RoleData[] = [
  {
    name: 'super_admin',
    description: 'Super Admin with all permissions',
    permissionIds: Array.from({ length: 49 }, (_, i) => i + 1), // 1 to 49
  },
  {
    name: 'ceo',
    description: 'CEO with all permissions',
    permissionIds: Array.from({ length: 49 }, (_, i) => i + 1), // 1 to 49
  },
  {
    name: 'admin',
    description: 'Admin with all permissions',
    permissionIds: Array.from({ length: 49 }, (_, i) => i + 1), // 1 to 49
  },
  {
    name: 'category_head',
    description: 'Category Head with vendor and product permissions',
    permissionIds: [
      ...Array.from({ length: 16 }, (_, i) => i + 13), // 13 to 28
      ...Array.from({ length: 6 }, (_, i) => i + 30), // 30 to 35
      37, 39, 41, 43, 45, 47, 49, // Individual permissions
    ],
  },
  {
    name: 'category_lead',
    description: 'Category Lead with vendor and product permissions',
    permissionIds: [
      ...Array.from({ length: 16 }, (_, i) => i + 13), // 13 to 28
      ...Array.from({ length: 6 }, (_, i) => i + 30), // 30 to 35
      37, 39, 41, 43, 45, 47, 49, // Individual permissions
    ],
  },
  {
    name: 'category_team',
    description: 'Category Team with vendor and product permissions',
    permissionIds: [
      ...Array.from({ length: 16 }, (_, i) => i + 13), // 13 to 28
      ...Array.from({ length: 6 }, (_, i) => i + 30), // 30 to 35
      37, 39, 41, 43, 45, 47, 49, // Individual permissions
    ],
  },
  {
    name: 'wh_ops',
    description: 'Warehouse Operations',
    permissionIds: [
      29, 30, // DC GRNs
      ...Array.from({ length: 14 }, (_, i) => i + 36), // 36 to 49
    ],
  },
  {
    name: 'wh_picker',
    description: 'Warehouse Picker',
    permissionIds: [], // No permissions assigned yet
  },
];


async function seedRBAC() {
  console.log('🚀 Starting RBAC seed...');
  
  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create permissions
    console.log('\n📝 Creating permissions...');
    for (const permission of permissions) {
      const [permissionRecord, created] = await Permission.findOrCreate({
        where: { module: permission.module, action: permission.action },
        defaults: {
          module: permission.module,
          action: permission.action,
          description: permission.description,
        } as any,
      });
      
      if (created) {
        console.log(`  ✅ Created permission: ${permission.module}-${permission.action}`);
      } else {
        // Update existing permission with correct ID mapping if needed
        if (permissionRecord.id !== permission.id) {
          console.log(`  ⚠️  Permission ${permission.module}-${permission.action} exists with different ID (DB: ${permissionRecord.id}, Expected: ${permission.id})`);
        } else {
          console.log(`  ℹ️  Permission already exists: ${permission.module}-${permission.action}`);
        }
      }
    }

    // Create roles
    console.log('\n👥 Creating roles...');
    const roleMap = new Map<string, Role>();
    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: {
          name: roleData.name,
          description: roleData.description,
          isActive: true,
        } as any,
      });
      roleMap.set(roleData.name, role);
      
      if (created) {
        console.log(`  ✅ Created role: ${roleData.name}`);
      } else {
        console.log(`  ℹ️  Role already exists: ${roleData.name}`);
      }
    }

    // Assign permissions to roles
    console.log('\n🔗 Assigning permissions to roles...');
    for (const roleData of roles) {
      const role = roleMap.get(roleData.name);
      if (!role) {
        console.log(`  ❌ Role not found: ${roleData.name}`);
        continue;
      }

      let assignedCount = 0;
      for (const permissionId of roleData.permissionIds) {
        const permission = await Permission.findOne({
          where: { id: permissionId },
        });

        if (!permission) {
          console.log(`  ⚠️  Permission ID ${permissionId} not found, skipping...`);
          continue;
        }

        const [rolePermission, created] = await RolePermission.findOrCreate({
          where: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });

        if (created) {
          assignedCount++;
        }
      }

      console.log(`  ✅ ${roleData.name}: Assigned ${assignedCount} permissions (${roleData.permissionIds.length} total)`);
    }

    console.log('\n🎉 RBAC seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Permissions: ${permissions.length}`);
    console.log(`  - Roles: ${roles.length}`);
    console.log(`  - Role-Permission assignments: Completed`);
    console.log('\n✅ Permissions, Roles, and Role-Permissions have been seeded.');
    console.log('   Users should be created separately using the /api/auth/register endpoint.');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed if executed directly
// if (require.main === module) {
//   seedRBAC()
//     .then(() => {
//       console.log('\n✅ Seed script completed');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('❌ Seed script failed:', error);
//       process.exit(1);
//     });
// }

export { seedRBAC };


// scripts/initializeRBAC.ts
import { Role, Permission, RolePermission } from '../models';
import sequelize from '../config/database';

async function initializeRBAC() {
  try {
    console.log('Starting RBAC initialization...');

    // First, sync the database to create tables
    console.log('Creating database tables...');
    await sequelize.sync({ force: false });
    console.log('Database tables created successfully.');

    // Create permissions based on the role matrix
    const permissions = [
      // Users & Roles
      { module: 'users_roles', action: 'manage', description: 'Create/update users and roles' },
      
      // Sites (WH/Store)
      { module: 'sites', action: 'create_config', description: 'Create/configure sites' },
      { module: 'sites', action: 'view', description: 'View sites' },
      { module: 'sites', action: 'view_own', description: 'View own site' },
      
      // Orders (view/search)
      { module: 'orders', action: 'view_all', description: 'View all orders' },
      { module: 'orders', action: 'view_wh', description: 'View warehouse orders' },
      { module: 'orders', action: 'view_store', description: 'View store orders' },
      { module: 'orders', action: 'view_task', description: 'View task orders' },
      
      // Picking
      { module: 'picking', action: 'view', description: 'View picking' },
      { module: 'picking', action: 'assign_manage', description: 'Assign/manage picklists' },
      { module: 'picking', action: 'execute', description: 'Execute picking' },
      
      // Inbound (GRN/QC)
      { module: 'inbound', action: 'view', description: 'View inbound' },
      { module: 'inbound', action: 'approve_variances', description: 'Approve variances' },
      { module: 'inbound', action: 'execute', description: 'Execute GRN/QC tasks' },
      
      // Putaway
      { module: 'putaway', action: 'view', description: 'View putaway' },
      { module: 'putaway', action: 'manage', description: 'Manage putaway' },
      { module: 'putaway', action: 'execute', description: 'Execute putaway' },
      
      // Inventory Adjustments
      { module: 'inventory', action: 'approve', description: 'Approve inventory adjustments' },
      { module: 'inventory', action: 'raise', description: 'Raise inventory adjustments' },
      
      // Cycle Count / Audit
      { module: 'cycle_count', action: 'view', description: 'View cycle counts' },
      { module: 'cycle_count', action: 'schedule_approve', description: 'Schedule/approve cycle counts' },
      { module: 'cycle_count', action: 'execute', description: 'Execute cycle counts' },
      
      // Replenishment
      { module: 'replenishment', action: 'config', description: 'Configure replenishment' },
      { module: 'replenishment', action: 'approve', description: 'Approve replenishment' },
      
      // RTV (Return to Vendor)
      { module: 'rtv', action: 'config_approve', description: 'Configure/approve RTV' },
      { module: 'rtv', action: 'create_approve', description: 'Create/approve RTV' },
      { module: 'rtv', action: 'execute', description: 'Execute RTV' },
      
      // POS (Store)
      { module: 'pos', action: 'view', description: 'View POS' },
      { module: 'pos', action: 'execute', description: 'Execute POS checkout' },
      
      // Store→WH Requests
      { module: 'store_wh_requests', action: 'view', description: 'View store→WH requests' },
      { module: 'store_wh_requests', action: 'create_checkin', description: 'Create/check-in requests' },
      
      // Exception Dashboard
      { module: 'exceptions', action: 'all_actions', description: 'All exception actions' },
      { module: 'exceptions', action: 'resolve', description: 'Resolve exceptions' },
      { module: 'exceptions', action: 'raise', description: 'Raise exceptions' },
      { module: 'exceptions', action: 'raise_store', description: 'Raise store exceptions' },
      
      // Dashboards
      { module: 'dashboards', action: 'view_all', description: 'View all dashboards' },
      { module: 'dashboards', action: 'view_wh', description: 'View warehouse dashboards' },
      { module: 'dashboards', action: 'view_task', description: 'View task dashboards' },
      { module: 'dashboards', action: 'view_store', description: 'View store dashboards' },
      
      // SLA and Alerts
      { module: 'sla', action: 'configure', description: 'Configure SLA' },
      { module: 'sla', action: 'view', description: 'View SLA timers' },
      
      // Store Operations
      { module: 'store_ops', action: 'pos_checkout', description: 'POS checkout with OTP' },
      { module: 'store_ops', action: 'invoice_create', description: 'Create invoices' },
      { module: 'store_ops', action: 'store_status', description: 'Manage store status' },
      { module: 'store_ops', action: 'surge_toggle', description: 'Toggle surge mode' },
      { module: 'store_ops', action: 'stock_check', description: 'Check stock' },
    ];

    console.log('Creating permissions...');
    await Permission.bulkCreate(permissions as any, { ignoreDuplicates: true });
    console.log(`Created ${permissions.length} permissions`);

    // Create roles
    const roles = [
      { name: 'admin', description: 'System Administrator - Full system access' },
      { name: 'wh_manager', description: 'Warehouse Manager - Manage WH staff and operations' },
      { name: 'wh_staff_1', description: 'WH Staff (Inbound/QC/Putaway/Audit) - Execute inbound tasks' },
      { name: 'wh_staff_2', description: 'WH Staff (Picker/Packer) - Execute picking and packing' },
      { name: 'store_ops', description: 'Store Operations - Manage store and POS operations' },
    ];

    console.log('Creating roles...');
    await Role.bulkCreate(roles as any, { ignoreDuplicates: true });
    console.log(`Created ${roles.length} roles`);

    // Get all roles
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const whManagerRole = await Role.findOne({ where: { name: 'wh_manager' } });
    const whStaff1Role = await Role.findOne({ where: { name: 'wh_staff_1' } });
    const whStaff2Role = await Role.findOne({ where: { name: 'wh_staff_2' } });
    const storeOpsRole = await Role.findOne({ where: { name: 'store_ops' } });

    if (!adminRole || !whManagerRole || !whStaff1Role || !whStaff2Role || !storeOpsRole) {
      throw new Error('Failed to find all roles');
    }

    // Get all permissions
    const allPermissions = await Permission.findAll();
    const permissionMap = new Map();
    allPermissions.forEach(p => {
      permissionMap.set(`${p.module}:${p.action}`, p.id);
    });

    console.log('Available permissions for mapping:');
    allPermissions.forEach(p => {
      console.log(`- ${p.module}:${p.action} (ID: ${p.id})`);
    });

    console.log('\nPermission map size:', permissionMap.size);

    console.log('Assigning permissions to roles...');

    // Admin - All permissions
    const adminPermissions = allPermissions.map(p => `${p.module}:${p.action}`);

    // WH Manager permissions
    const whManagerPermissions = [
      'users_roles:create_wh_users', // Create WH staff
      'sites:view', // View sites
      'orders:view_wh', // WH scope
      'picking:assign_manage', // Assign/manage picklists
      'inbound:approve_variances', // Approve variances
      'putaway:manage', // Manage putaway
      'inventory:approve', // Approve adjustments
      'cycle_count:schedule_approve', // Schedule/approve
      'replenishment:approve', // Approve
      'rtv:create_approve', // Create/approve
      'store_wh_requests:view', // View
      'exceptions:resolve', // Resolve
      'dashboards:view_wh', // WH scope
      'sla:view', // View SLA timers
    ];

    // WH Staff 1 (Inbound/QC/Putaway/Audit) permissions
    const whStaff1Permissions = [
      'orders:view_task', // Task scope
      'inbound:execute', // Execute GRN/QC
      'putaway:execute', // Execute putaway
      'inventory:raise', // Raise adjustments
      'cycle_count:execute', // Execute
      'rtv:execute', // Execute
      'exceptions:raise', // Raise
      'dashboards:view_task', // Task scope
    ];

    // WH Staff 2 (Picker/Packer) permissions
    const whStaff2Permissions = [
      'orders:view_task', // Task scope
      'picking:execute', // Execute picking
      'exceptions:raise', // Raise
      'dashboards:view_task', // Task scope
    ];

    // Store Ops permissions
    const storeOpsPermissions = [
      'sites:view_own', // View own store
      'orders:view_store', // Store scope
      'pos:execute', // Execute POS
      'store_ops:pos_checkout', // POS checkout
      'store_ops:invoice_create', // Create invoices
      'store_ops:store_status', // Store status
      'store_ops:surge_toggle', // Surge toggle
      'store_ops:stock_check', // Stock check
      'store_wh_requests:create_checkin', // Create/check-in
      'exceptions:raise_store', // Raise store exceptions
      'dashboards:view_store', // Store scope
    ];

    // Picking permissions
    const pickingPermissions = [
      { module: 'picking', action: 'view', description: 'View picking waves and items' },
      { module: 'picking', action: 'assign_manage', description: 'Generate and assign picking waves' },
      { module: 'picking', action: 'execute', description: 'Execute picking operations' },
      { module: 'picking', action: 'monitor', description: 'Monitor SLA and expiry alerts' }
    ];

    // Create picking permissions only if they don't exist
    for (const permission of pickingPermissions) {
      const existingPermission = await Permission.findOne({
        where: { module: permission.module, action: permission.action }
      });
      
      if (!existingPermission) {
        const createdPermission = await Permission.create(permission as any);
        permissionMap.set(`${permission.module}:${permission.action}`, createdPermission.id);
      } else {
        permissionMap.set(`${permission.module}:${permission.action}`, existingPermission.id);
      }
    }

    // Add picking permissions to admin
    adminPermissions.push(...pickingPermissions.map(p => `${p.module}:${p.action}`));

    // Add picking permissions to WH Manager
    whManagerPermissions.push(
      'picking:view',
      'picking:assign_manage',
      'picking:monitor'
    );

    // Add picking permissions to WH Staff 1
    whStaff1Permissions.push(
      'picking:view',
      'picking:execute'
    );

    // Add picking permissions to WH Staff 2 (Picker/Packer)
    whStaff2Permissions.push(
      'picking:view',
      'picking:execute'
    );

    // Clear existing role permissions
    await RolePermission.destroy({ where: {} });

    // Create role-permission mappings
    const adminRolePermissions = adminPermissions.map(key => ({
      roleId: adminRole.id,
      permissionId: permissionMap.get(key)
    })).filter(p => p.permissionId);

    const whManagerRolePermissions = whManagerPermissions.map(key => ({
      roleId: whManagerRole.id,
      permissionId: permissionMap.get(key)
    })).filter(p => p.permissionId);

    const whStaff1RolePermissions = whStaff1Permissions.map(key => ({
      roleId: whStaff1Role.id,
      permissionId: permissionMap.get(key)
    })).filter(p => p.permissionId);

    const whStaff2RolePermissions = whStaff2Permissions.map(key => ({
      roleId: whStaff2Role.id,
      permissionId: permissionMap.get(key)
    })).filter(p => p.permissionId);

    const storeOpsRolePermissions = storeOpsPermissions.map(key => ({
      roleId: storeOpsRole.id,
      permissionId: permissionMap.get(key)
    })).filter(p => p.permissionId);

    // Assign all permissions
    const allRolePermissions = [
      ...adminRolePermissions,
      ...whManagerRolePermissions,
      ...whStaff1RolePermissions,
      ...whStaff2RolePermissions,
      ...storeOpsRolePermissions
    ];

    await RolePermission.bulkCreate(allRolePermissions as any, { ignoreDuplicates: true });

    console.log('Role permissions assigned:');
    console.log(`- Admin: ${adminPermissions.length} permissions`);
    console.log(`- WH Manager: ${whManagerPermissions.length} permissions`);
    console.log(`- WH Staff 1: ${whStaff1Permissions.length} permissions`);
    console.log(`- WH Staff 2: ${whStaff2Permissions.length} permissions`);
    console.log(`- Store Ops: ${storeOpsPermissions.length} permissions`);

    console.log('RBAC initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing RBAC:', error);
    throw error;
  }
}

// Run the initialization
initializeRBAC()
  .then(() => {
    console.log('RBAC setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('RBAC setup failed:', error);
    process.exit(1);
  });
// config/autoInit.ts
import sequelize from './database';
import { User, Role, Permission, RolePermission } from '../models/index.js';

// Function to check if RBAC is initialized
export const isRBACInitialized = async (): Promise<boolean> => {
  try {
    const rolesCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM roles',
      { type: 'SELECT' }
    );
    return (rolesCount as any)[0]?.count > 0;
  } catch (error) {
    return false;
  }
};

// Function to automatically initialize RBAC
export const autoInitializeRBAC = async (): Promise<void> => {
  try {
    console.log('🔄 Auto-initializing RBAC system...');
    
    // Create permissions
    const permissions = [
      { module: 'users_roles', action: 'manage', description: 'Manage users and roles' },
      { module: 'sites', action: 'create_config', description: 'Create and configure sites' },
      { module: 'sites', action: 'view', description: 'View all sites' },
      { module: 'sites', action: 'view_own', description: 'View own site' },
      { module: 'orders', action: 'view_all', description: 'View all orders' },
      { module: 'orders', action: 'view_wh', description: 'View warehouse orders' },
      { module: 'orders', action: 'view_store', description: 'View store orders' },
      { module: 'orders', action: 'view_task', description: 'View task orders' },
      { module: 'picking', action: 'view', description: 'View picking operations' },
      { module: 'picking', action: 'assign_manage', description: 'Assign and manage picking' },
      { module: 'picking', action: 'execute', description: 'Execute picking tasks' },
      { module: 'picking', action: 'monitor', description: 'Monitor SLA and expiry alerts' },
      { module: 'inbound', action: 'view', description: 'View inbound operations' },
      { module: 'inbound', action: 'approve_variances', description: 'Approve variances' },
      { module: 'inbound', action: 'execute', description: 'Execute inbound tasks' },
      { module: 'putaway', action: 'view', description: 'View putaway operations' },
      { module: 'putaway', action: 'manage', description: 'Manage putaway' },
      { module: 'putaway', action: 'execute', description: 'Execute putaway tasks' },
      { module: 'inventory', action: 'approve', description: 'Approve inventory adjustments' },
      { module: 'inventory', action: 'raise', description: 'Raise inventory adjustments' },
      { module: 'cycle_count', action: 'view', description: 'View cycle count' },
      { module: 'cycle_count', action: 'schedule_approve', description: 'Schedule and approve cycle count' },
      { module: 'cycle_count', action: 'execute', description: 'Execute cycle count' },
      { module: 'replenishment', action: 'config', description: 'Configure replenishment' },
      { module: 'replenishment', action: 'approve', description: 'Approve replenishment' },
      { module: 'rtv', action: 'config_approve', description: 'Configure and approve RTV' },
      { module: 'rtv', action: 'create_approve', description: 'Create and approve RTV' },
      { module: 'rtv', action: 'execute', description: 'Execute RTV' },
      { module: 'pos', action: 'view', description: 'View POS operations' },
      { module: 'pos', action: 'execute', description: 'Execute POS operations' },
      { module: 'store_wh_requests', action: 'view', description: 'View store-WH requests' },
      { module: 'store_wh_requests', action: 'create_checkin', description: 'Create and check in requests' },
      { module: 'exceptions', action: 'all_actions', description: 'All exception actions' },
      { module: 'exceptions', action: 'resolve', description: 'Resolve exceptions' },
      { module: 'exceptions', action: 'raise', description: 'Raise exceptions' },
      { module: 'exceptions', action: 'raise_store', description: 'Raise store exceptions' },
      { module: 'dashboards', action: 'view_all', description: 'View all dashboards' },
      { module: 'dashboards', action: 'view_wh', description: 'View warehouse dashboards' },
      { module: 'dashboards', action: 'view_task', description: 'View task dashboards' },
      { module: 'dashboards', action: 'view_store', description: 'View store dashboards' },
      { module: 'sla', action: 'configure', description: 'Configure SLA' },
      { module: 'sla', action: 'view', description: 'View SLA' },
      { module: 'store_ops', action: 'pos_checkout', description: 'POS checkout operations' },
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
      'users_roles:manage',
      'sites:view',
      'orders:view_wh',
      'picking:assign_manage',
      'inbound:approve_variances',
      'putaway:manage',
      'inventory:approve',
      'cycle_count:schedule_approve',
      'replenishment:approve',
      'rtv:create_approve',
      'store_wh_requests:view',
      'exceptions:resolve',
      'dashboards:view_wh',
      'sla:view',
    ];

    // WH Staff 1 (Inbound/QC/Putaway/Audit) permissions
    const whStaff1Permissions = [
      'orders:view_task',
      'inbound:execute',
      'putaway:execute',
      'inventory:raise',
      'cycle_count:execute',
      'rtv:execute',
      'exceptions:raise',
      'dashboards:view_task',
    ];

    // WH Staff 2 (Picker/Packer) permissions
    const whStaff2Permissions = [
      'orders:view_task',
      'picking:view',        // Allow pickers to view available picklists
      'picking:execute',     // Allow pickers to execute picking tasks
      'exceptions:raise',
      'dashboards:view_task',
    ];

    // Store Ops permissions
    const storeOpsPermissions = [
      'sites:view_own',
      'orders:view_store',
      'pos:execute',
      'store_ops:pos_checkout',
      'store_ops:invoice_create',
      'store_ops:store_status',
      'store_ops:surge_toggle',
      'store_ops:stock_check',
    ];

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

    console.log('✅ RBAC system auto-initialized successfully');
  } catch (error) {
    console.error('❌ Failed to auto-initialize RBAC:', error);
    throw error;
  }
};

// Function to create initial admin user if specified in environment
export const createInitialAdmin = async (): Promise<void> => {
  try {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.log('ℹ️  No initial admin credentials provided in environment variables');
      return;
    }
    
    console.log('👤 Creating initial admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log('ℹ️  Initial admin user already exists');
      return;
    }
    
    // Get admin role
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      console.log('⚠️  Admin role not found, skipping initial admin creation');
      return;
    }
    
    // Create admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(adminPassword, 10);
    await User.create({
      email: adminEmail,
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
      availabilityStatus: 'available'
    });
    
    console.log('✅ Initial admin user created successfully');
  } catch (error) {
    console.error('❌ Failed to create initial admin user:', error);
    // Don't throw error here as this is not critical for server startup
  }
};

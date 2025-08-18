"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const database_1 = __importDefault(require("../config/database"));
async function initializeRBAC() {
    try {
        console.log('Starting RBAC initialization...');
        console.log('Creating database tables...');
        await database_1.default.sync({ force: false });
        console.log('Database tables created successfully.');
        const permissions = [
            { module: 'users_roles', action: 'manage', description: 'Create/update users and roles' },
            { module: 'sites', action: 'create_config', description: 'Create/configure sites' },
            { module: 'sites', action: 'view', description: 'View sites' },
            { module: 'sites', action: 'view_own', description: 'View own site' },
            { module: 'orders', action: 'view_all', description: 'View all orders' },
            { module: 'orders', action: 'view_wh', description: 'View warehouse orders' },
            { module: 'orders', action: 'view_store', description: 'View store orders' },
            { module: 'orders', action: 'view_task', description: 'View task orders' },
            { module: 'picking', action: 'view', description: 'View picking' },
            { module: 'picking', action: 'assign_manage', description: 'Assign/manage picklists' },
            { module: 'picking', action: 'execute', description: 'Execute picking' },
            { module: 'inbound', action: 'view', description: 'View inbound' },
            { module: 'inbound', action: 'approve_variances', description: 'Approve variances' },
            { module: 'inbound', action: 'execute', description: 'Execute GRN/QC tasks' },
            { module: 'putaway', action: 'view', description: 'View putaway' },
            { module: 'putaway', action: 'manage', description: 'Manage putaway' },
            { module: 'putaway', action: 'execute', description: 'Execute putaway' },
            { module: 'inventory', action: 'approve', description: 'Approve inventory adjustments' },
            { module: 'inventory', action: 'raise', description: 'Raise inventory adjustments' },
            { module: 'cycle_count', action: 'view', description: 'View cycle counts' },
            { module: 'cycle_count', action: 'schedule_approve', description: 'Schedule/approve cycle counts' },
            { module: 'cycle_count', action: 'execute', description: 'Execute cycle counts' },
            { module: 'replenishment', action: 'config', description: 'Configure replenishment' },
            { module: 'replenishment', action: 'approve', description: 'Approve replenishment' },
            { module: 'rtv', action: 'config_approve', description: 'Configure/approve RTV' },
            { module: 'rtv', action: 'create_approve', description: 'Create/approve RTV' },
            { module: 'rtv', action: 'execute', description: 'Execute RTV' },
            { module: 'pos', action: 'view', description: 'View POS' },
            { module: 'pos', action: 'execute', description: 'Execute POS checkout' },
            { module: 'store_wh_requests', action: 'view', description: 'View store→WH requests' },
            { module: 'store_wh_requests', action: 'create_checkin', description: 'Create/check-in requests' },
            { module: 'exceptions', action: 'all_actions', description: 'All exception actions' },
            { module: 'exceptions', action: 'resolve', description: 'Resolve exceptions' },
            { module: 'exceptions', action: 'raise', description: 'Raise exceptions' },
            { module: 'exceptions', action: 'raise_store', description: 'Raise store exceptions' },
            { module: 'dashboards', action: 'view_all', description: 'View all dashboards' },
            { module: 'dashboards', action: 'view_wh', description: 'View warehouse dashboards' },
            { module: 'dashboards', action: 'view_task', description: 'View task dashboards' },
            { module: 'dashboards', action: 'view_store', description: 'View store dashboards' },
            { module: 'sla', action: 'configure', description: 'Configure SLA' },
            { module: 'sla', action: 'view', description: 'View SLA timers' },
            { module: 'store_ops', action: 'pos_checkout', description: 'POS checkout with OTP' },
            { module: 'store_ops', action: 'invoice_create', description: 'Create invoices' },
            { module: 'store_ops', action: 'store_status', description: 'Manage store status' },
            { module: 'store_ops', action: 'surge_toggle', description: 'Toggle surge mode' },
            { module: 'store_ops', action: 'stock_check', description: 'Check stock' },
        ];
        console.log('Creating permissions...');
        await models_1.Permission.bulkCreate(permissions, { ignoreDuplicates: true });
        console.log(`Created ${permissions.length} permissions`);
        const roles = [
            { name: 'admin', description: 'System Administrator - Full system access' },
            { name: 'wh_manager', description: 'Warehouse Manager - Manage WH staff and operations' },
            { name: 'wh_staff_1', description: 'WH Staff (Inbound/QC/Putaway/Audit) - Execute inbound tasks' },
            { name: 'wh_staff_2', description: 'WH Staff (Picker/Packer) - Execute picking and packing' },
            { name: 'store_ops', description: 'Store Operations - Manage store and POS operations' },
        ];
        console.log('Creating roles...');
        await models_1.Role.bulkCreate(roles, { ignoreDuplicates: true });
        console.log(`Created ${roles.length} roles`);
        const adminRole = await models_1.Role.findOne({ where: { name: 'admin' } });
        const whManagerRole = await models_1.Role.findOne({ where: { name: 'wh_manager' } });
        const whStaff1Role = await models_1.Role.findOne({ where: { name: 'wh_staff_1' } });
        const whStaff2Role = await models_1.Role.findOne({ where: { name: 'wh_staff_2' } });
        const storeOpsRole = await models_1.Role.findOne({ where: { name: 'store_ops' } });
        if (!adminRole || !whManagerRole || !whStaff1Role || !whStaff2Role || !storeOpsRole) {
            throw new Error('Failed to find all roles');
        }
        const allPermissions = await models_1.Permission.findAll();
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
        const adminPermissions = allPermissions.map(p => `${p.module}:${p.action}`);
        const whManagerPermissions = [
            'users_roles:create_wh_users',
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
        const whStaff2Permissions = [
            'orders:view_task',
            'picking:execute',
            'exceptions:raise',
            'dashboards:view_task',
        ];
        const storeOpsPermissions = [
            'sites:view_own',
            'orders:view_store',
            'pos:execute',
            'store_ops:pos_checkout',
            'store_ops:invoice_create',
            'store_ops:store_status',
            'store_ops:surge_toggle',
            'store_ops:stock_check',
            'store_wh_requests:create_checkin',
            'exceptions:raise_store',
            'dashboards:view_store',
        ];
        const pickingPermissions = [
            { module: 'picking', action: 'view', description: 'View picking waves and items' },
            { module: 'picking', action: 'assign_manage', description: 'Generate and assign picking waves' },
            { module: 'picking', action: 'execute', description: 'Execute picking operations' },
            { module: 'picking', action: 'monitor', description: 'Monitor SLA and expiry alerts' }
        ];
        for (const permission of pickingPermissions) {
            const existingPermission = await models_1.Permission.findOne({
                where: { module: permission.module, action: permission.action }
            });
            if (!existingPermission) {
                const createdPermission = await models_1.Permission.create(permission);
                permissionMap.set(`${permission.module}:${permission.action}`, createdPermission.id);
            }
            else {
                permissionMap.set(`${permission.module}:${permission.action}`, existingPermission.id);
            }
        }
        adminPermissions.push(...pickingPermissions.map(p => `${p.module}:${p.action}`));
        whManagerPermissions.push('picking:view', 'picking:assign_manage', 'picking:monitor');
        whStaff1Permissions.push('picking:view', 'picking:execute');
        whStaff2Permissions.push('picking:view', 'picking:execute');
        await models_1.RolePermission.destroy({ where: {} });
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
        const allRolePermissions = [
            ...adminRolePermissions,
            ...whManagerRolePermissions,
            ...whStaff1RolePermissions,
            ...whStaff2RolePermissions,
            ...storeOpsRolePermissions
        ];
        await models_1.RolePermission.bulkCreate(allRolePermissions, { ignoreDuplicates: true });
        console.log('Role permissions assigned:');
        console.log(`- Admin: ${adminPermissions.length} permissions`);
        console.log(`- WH Manager: ${whManagerPermissions.length} permissions`);
        console.log(`- WH Staff 1: ${whStaff1Permissions.length} permissions`);
        console.log(`- WH Staff 2: ${whStaff2Permissions.length} permissions`);
        console.log(`- Store Ops: ${storeOpsPermissions.length} permissions`);
        console.log('RBAC initialization completed successfully!');
    }
    catch (error) {
        console.error('Error initializing RBAC:', error);
        throw error;
    }
}
initializeRBAC()
    .then(() => {
    console.log('RBAC setup completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('RBAC setup failed:', error);
    process.exit(1);
});

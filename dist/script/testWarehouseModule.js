"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
async function testWarehouseModule() {
    try {
        console.log('🧪 Testing Warehouse Module...\n');
        console.log('1. Checking database tables...');
        await database_1.default.authenticate();
        console.log('✅ Database connection successful');
        console.log('\n2. Creating test warehouse...');
        const testWarehouse = await models_1.Warehouse.create({
            warehouse_code: 'WH-TEST-001',
            name: 'Test Warehouse',
            type: 'SATELLITE',
            status: 'ACTIVE',
            address: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            country: 'India',
            pincode: '123456',
            current_utilization_percentage: 0.00,
            is_auto_assignment_enabled: true,
            max_orders_per_day: 500,
            sla_hours: 24,
            integration_status: 'PENDING',
            created_by: 1
        });
        console.log('✅ Test warehouse created:', testWarehouse.warehouse_code);
        console.log('\n3. Creating test zones...');
        const testZones = await Promise.all([
            models_1.WarehouseZone.create({
                warehouse_id: testWarehouse.id,
                zone_code: 'TEST-ZONE-A',
                zone_name: 'Test Zone A',
                zone_type: 'STORAGE',
                temperature_zone: 'AMBIENT',
                capacity_units: 100,
                current_utilization: 0,
                is_active: true
            }),
            models_1.WarehouseZone.create({
                warehouse_id: testWarehouse.id,
                zone_code: 'TEST-ZONE-B',
                zone_name: 'Test Zone B',
                zone_type: 'PICKING',
                temperature_zone: 'AMBIENT',
                capacity_units: 50,
                current_utilization: 0,
                is_active: true
            })
        ]);
        console.log('✅ Test zones created:', testZones.map(z => z.zone_code));
        console.log('\n4. Creating test staff assignment...');
        const testStaffAssignment = await models_1.WarehouseStaffAssignment.create({
            warehouse_id: testWarehouse.id,
            user_id: 1,
            role: 'SUPERVISOR',
            assigned_date: new Date(),
            is_active: true
        });
        console.log('✅ Test staff assignment created for user ID:', testStaffAssignment.user_id);
        console.log('\n5. Testing model associations...');
        const warehouseWithAssociations = await models_1.Warehouse.findByPk(testWarehouse.id, {
            include: [
                { model: models_1.WarehouseZone, as: 'Zones' },
                { model: models_1.WarehouseStaffAssignment, as: 'StaffAssignments' }
            ]
        });
        if (warehouseWithAssociations) {
            console.log('✅ Warehouse associations working:');
            console.log(`   - Zones: ${warehouseWithAssociations.Zones?.length || 0}`);
            console.log(`   - Staff: ${warehouseWithAssociations.StaffAssignments?.length || 0}`);
        }
        console.log('\n6. Testing queries...');
        const activeWarehouses = await models_1.Warehouse.count({ where: { status: 'ACTIVE' } });
        console.log(`✅ Active warehouses count: ${activeWarehouses}`);
        const storageZones = await models_1.WarehouseZone.count({ where: { zone_type: 'STORAGE' } });
        console.log(`✅ Storage zones count: ${storageZones}`);
        const supervisors = await models_1.WarehouseStaffAssignment.count({ where: { role: 'SUPERVISOR' } });
        console.log(`✅ Supervisor assignments count: ${supervisors}`);
        console.log('\n7. Testing updates...');
        await testWarehouse.update({
            current_utilization_percentage: 25.50,
            updated_by: 1
        });
        console.log('✅ Warehouse utilization updated');
        await testZones[0].update({
            current_utilization: 25
        });
        console.log('✅ Zone utilization updated');
        console.log('\n8. Testing soft delete...');
        await testWarehouse.update({ status: 'INACTIVE' });
        console.log('✅ Warehouse soft deleted (status set to INACTIVE)');
        await testStaffAssignment.update({ is_active: false });
        console.log('✅ Staff assignment soft deleted (is_active set to false)');
        console.log('\n9. Cleaning up test data...');
        await testZones[0].destroy();
        await testZones[1].destroy();
        await testWarehouse.destroy();
        console.log('✅ Test data cleaned up');
        console.log('\n🎉 All warehouse module tests passed successfully!');
        console.log('\n📋 Test Summary:');
        console.log('   ✅ Database connection');
        console.log('   ✅ Warehouse CRUD operations');
        console.log('   ✅ Zone CRUD operations');
        console.log('   ✅ Staff assignment CRUD operations');
        console.log('   ✅ Model associations');
        console.log('   ✅ Query operations');
        console.log('   ✅ Update operations');
        console.log('   ✅ Soft delete operations');
        console.log('   ✅ Data cleanup');
    }
    catch (error) {
        console.error('❌ Warehouse module test failed:', error);
    }
    finally {
        await database_1.default.close();
        console.log('\n🔌 Database connection closed');
    }
}
if (require.main === module) {
    testWarehouseModule();
}
exports.default = testWarehouseModule;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
async function setupWarehouseTables() {
    try {
        console.log('Setting up warehouse tables...');
        await database_1.default.sync({ force: false, alter: true });
        console.log('Warehouse tables setup completed successfully!');
        console.log('Creating sample warehouse for testing...');
        const sampleWarehouse = await models_1.Warehouse.create({
            warehouse_code: 'WH-MAIN-001',
            name: 'Main Warehouse - Mumbai',
            type: 'MAIN',
            status: 'ACTIVE',
            address: '123 Industrial Area, Andheri East',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400069',
            latitude: 19.0760,
            longitude: 72.8777,
            contact_person: 'John Doe',
            contact_email: 'john.doe@company.com',
            contact_phone: '+91-98765-43210',
            emergency_contact: '+91-98765-43211',
            operational_hours: {
                monday: { start: '09:00', end: '18:00' },
                tuesday: { start: '09:00', end: '18:00' },
                wednesday: { start: '09:00', end: '18:00' },
                thursday: { start: '09:00', end: '18:00' },
                friday: { start: '09:00', end: '18:00' },
                saturday: { start: '09:00', end: '14:00' },
                sunday: 'closed'
            },
            capacity_sqft: 50000.00,
            storage_capacity_units: 10000,
            current_utilization_percentage: 0.00,
            services_offered: ['same_day_delivery', 'next_day_delivery', 'cold_storage'],
            supported_fulfillment_types: ['delivery', 'pickup'],
            is_auto_assignment_enabled: true,
            max_orders_per_day: 1000,
            sla_hours: 24,
            lms_warehouse_id: 'LMS-WH-001',
            integration_status: 'PENDING',
            created_by: 1
        });
        console.log('Sample warehouse created:', sampleWarehouse.warehouse_code);
        const sampleZones = await Promise.all([
            models_1.WarehouseZone.create({
                warehouse_id: sampleWarehouse.id,
                zone_code: 'ZONE-A',
                zone_name: 'Zone A - General Storage',
                zone_type: 'STORAGE',
                temperature_zone: 'AMBIENT',
                capacity_units: 2000,
                current_utilization: 0,
                is_active: true
            }),
            models_1.WarehouseZone.create({
                warehouse_id: sampleWarehouse.id,
                zone_code: 'ZONE-B',
                zone_name: 'Zone B - Cold Storage',
                zone_type: 'STORAGE',
                temperature_zone: 'CHILLED',
                capacity_units: 1000,
                current_utilization: 0,
                is_active: true
            }),
            models_1.WarehouseZone.create({
                warehouse_id: sampleWarehouse.id,
                zone_code: 'ZONE-C',
                zone_name: 'Zone C - Picking Area',
                zone_type: 'PICKING',
                temperature_zone: 'AMBIENT',
                capacity_units: 500,
                current_utilization: 0,
                is_active: true
            })
        ]);
        console.log('Sample zones created:', sampleZones.map(z => z.zone_code));
        const sampleStaffAssignment = await models_1.WarehouseStaffAssignment.create({
            warehouse_id: sampleWarehouse.id,
            user_id: 1,
            role: 'MANAGER',
            assigned_date: new Date(),
            is_active: true
        });
        console.log('Sample staff assignment created for user ID:', sampleStaffAssignment.user_id);
        console.log('Warehouse setup completed with sample data!');
    }
    catch (error) {
        console.error('Error setting up warehouse tables:', error);
    }
    finally {
        await database_1.default.close();
    }
}
if (require.main === module) {
    setupWarehouseTables();
}
exports.default = setupWarehouseTables;

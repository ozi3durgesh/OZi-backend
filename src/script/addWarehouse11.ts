// script/addWarehouse11.ts
import sequelize from '../config/database';
import { Warehouse } from '../models';

async function addWarehouse11() {
  try {
    console.log('Adding warehouse with ID 11...');

    // Sync Warehouse model
    await Warehouse.sync({ force: false });
    console.log('✅ Warehouse table synchronized');

    // Create the specific warehouse needed for testing
    const warehouseData = {
      id: 11, // Force ID 11
      warehouse_code: 'WH-STORE-011',
      name: 'Test Store 11',
      type: 'STOREFRONT' as const,
      status: 'ACTIVE' as const,
      address: 'Test Address, Test City',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      pincode: '123456',
      latitude: 28.402008043336746,
      longitude: 77.08577287018689,
      contact_person: 'Test Contact',
      contact_email: 'test@store.com',
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
      capacity_sqft: 5000.00,
      storage_capacity_units: 1000,
      current_utilization_percentage: 0.00,
      services_offered: ['same_day_delivery', 'next_day_delivery'],
      supported_fulfillment_types: ['delivery', 'pickup'],
      is_auto_assignment_enabled: true,
      max_orders_per_day: 500,
      sla_hours: 24,
      lms_warehouse_id: 'LMS-STORE-011',
      integration_status: 'PENDING' as const,
      created_by: 1 // Assuming user ID 1 exists
    };

    // First, try to find existing warehouse with ID 11
    let warehouse = await Warehouse.findByPk(11);
    
    if (warehouse) {
      // Update existing warehouse
      await warehouse.update(warehouseData);
      console.log(`✅ Updated existing warehouse: ${warehouse.name} (ID: ${warehouse.id})`);
    } else {
      // Create new warehouse with forced ID
      // We need to temporarily disable auto-increment to force ID 11
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Insert directly with SQL to force ID 11
      await sequelize.query(`
        INSERT INTO warehouses (id, warehouse_code, name, type, status, address, city, state, country, pincode, 
                              latitude, longitude, contact_person, contact_email, contact_phone, emergency_contact,
                              operational_hours, capacity_sqft, storage_capacity_units, current_utilization_percentage,
                              services_offered, supported_fulfillment_types, is_auto_assignment_enabled,
                              max_orders_per_day, sla_hours, lms_warehouse_id, integration_status, created_by,
                              created_at, updated_at)
        VALUES (11, '${warehouseData.warehouse_code}', '${warehouseData.name}', '${warehouseData.type}', '${warehouseData.status}',
                '${warehouseData.address}', '${warehouseData.city}', '${warehouseData.state}', '${warehouseData.country}', '${warehouseData.pincode}',
                ${warehouseData.latitude}, ${warehouseData.longitude}, '${warehouseData.contact_person}', '${warehouseData.contact_email}',
                '${warehouseData.contact_phone}', '${warehouseData.emergency_contact}', '${JSON.stringify(warehouseData.operational_hours)}',
                ${warehouseData.capacity_sqft}, ${warehouseData.storage_capacity_units}, ${warehouseData.current_utilization_percentage},
                '${JSON.stringify(warehouseData.services_offered)}', '${JSON.stringify(warehouseData.supported_fulfillment_types)}',
                ${warehouseData.is_auto_assignment_enabled}, ${warehouseData.max_orders_per_day}, ${warehouseData.sla_hours},
                '${warehouseData.lms_warehouse_id}', '${warehouseData.integration_status}', ${warehouseData.created_by},
                NOW(), NOW())
      `);
      
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      warehouse = await Warehouse.findByPk(11);
      console.log(`✅ Created new warehouse: ${warehouse?.name} (ID: ${warehouse?.id})`);
    }

    if (warehouse) {
      console.log(`✅ Warehouse verified: ID ${warehouse.id}, Name: ${warehouse.name}, Status: ${warehouse.status}`);
      console.log(`   - Type: ${warehouse.type}`);
      console.log(`   - Address: ${warehouse.address}`);
      console.log(`   - Contact: ${warehouse.contact_person} (${warehouse.contact_phone})`);
    } else {
      console.log('❌ Warehouse verification failed');
    }

    console.log('\n🎉 Warehouse setup completed successfully!');
    console.log('\nYou can now test the order placement with:');
    console.log('Store ID: 11 (Warehouse ID: 11)');
    console.log('Product SKU: 1191');

  } catch (error) {
    console.error('❌ Error adding warehouse:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  addWarehouse11()
    .then(() => {
      console.log('Warehouse setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Warehouse setup failed:', error);
      process.exit(1);
    });
}

export default addWarehouse11;

const mysql = require('mysql2/promise');

async function createSampleData() {
  const connection = await mysql.createConnection({
    host: 'ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'rLfcu9Y80S8X',
    database: 'ozi_backend'
  });

  try {
    console.log('Creating sample DCs and FCs...');

    // Create sample Distribution Centers
    const [dcResult] = await connection.execute(`
      INSERT INTO DistributionCenters (dc_code, name, type, address, city, state, country, pincode, created_by)
      VALUES 
        ('DC-MUM-001', 'Mumbai Distribution Center', 'MAIN', 'Plot No. 123, Industrial Area', 'Mumbai', 'Maharashtra', 'India', '400001', 1),
        ('DC-DEL-001', 'Delhi Distribution Center', 'REGIONAL', 'Sector 45, Industrial Zone', 'New Delhi', 'Delhi', 'India', '110001', 1),
        ('DC-BLR-001', 'Bangalore Distribution Center', 'REGIONAL', 'Electronic City Phase 1', 'Bangalore', 'Karnataka', 'India', '560100', 1)
    `);
    console.log('✅ Created sample Distribution Centers');

    // Get the created DC IDs
    const [dcs] = await connection.execute('SELECT id, dc_code FROM DistributionCenters ORDER BY id');
    console.log('Distribution Centers:', dcs);

    // Create sample Fulfillment Centers
    const [fcResult] = await connection.execute(`
      INSERT INTO FulfillmentCenters (fc_code, name, dc_id, type, address, city, state, country, pincode, created_by)
      VALUES 
        ('FC-MUM-001', 'Mumbai Main FC', 1, 'MAIN', 'Warehouse Complex A, Mumbai', 'Mumbai', 'Maharashtra', 'India', '400001', 1),
        ('FC-MUM-002', 'Mumbai Satellite FC', 1, 'SATELLITE', 'Warehouse Complex B, Mumbai', 'Mumbai', 'Maharashtra', 'India', '400002', 1),
        ('FC-DEL-001', 'Delhi Main FC', 2, 'MAIN', 'Warehouse Complex C, Delhi', 'New Delhi', 'Delhi', 'India', '110001', 1),
        ('FC-BLR-001', 'Bangalore Main FC', 3, 'MAIN', 'Warehouse Complex D, Bangalore', 'Bangalore', 'Karnataka', 'India', '560100', 1),
        ('FC-BLR-002', 'Bangalore Storefront FC', 3, 'STOREFRONT', 'Storefront Location, Bangalore', 'Bangalore', 'Karnataka', 'India', '560102', 1)
    `);
    console.log('✅ Created sample Fulfillment Centers');

    // Get the created FC IDs
    const [fcs] = await connection.execute('SELECT id, fc_code, name FROM FulfillmentCenters ORDER BY id');
    console.log('Fulfillment Centers:', fcs);

    // Assign admin user to all FCs
    const [userFcResult] = await connection.execute(`
      INSERT INTO UserFulfillmentCenters (user_id, fc_id, role, is_default, created_by)
      VALUES 
        (1, 1, 'MANAGER', true, 1),
        (1, 2, 'MANAGER', false, 1),
        (1, 3, 'MANAGER', false, 1),
        (1, 4, 'MANAGER', false, 1),
        (1, 5, 'MANAGER', false, 1)
    `);
    console.log('✅ Assigned admin user to all FCs');

    console.log('🎉 Sample data created successfully!');
    console.log('\n📋 Summary:');
    console.log('- 3 Distribution Centers created');
    console.log('- 5 Fulfillment Centers created');
    console.log('- Admin user assigned to all FCs with MANAGER role');
    console.log('- Mumbai Main FC set as default for admin user');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  } finally {
    await connection.end();
  }
}

createSampleData();

const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize({
  host: 'ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com',
  database: 'ozi_backend',
  username: 'admin',
  password: 'rLfcu9Y80S8X',
  port: 3306,
  dialect: 'mysql',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function createFulfillmentCenter() {
  try {
    console.log('🚀 Creating fulfillment center...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Check if fulfillment centers exist
    console.log('📊 Checking fulfillment centers:');
    const fcData = await sequelize.query('SELECT * FROM fulfillment_centers LIMIT 5', { type: Sequelize.QueryTypes.SELECT });
    console.table(fcData);

    if (fcData.length === 0) {
      console.log('🔧 Creating fulfillment center...');
      await sequelize.query(`
        INSERT INTO fulfillment_centers (
          fc_code, name, type, status, address, city, state, country, pincode,
          contact_person, contact_email, contact_phone, operational_hours,
          capacity_sqft, storage_capacity_units, current_utilization_percentage,
          services_offered, supported_fulfillment_types, is_auto_assignment_enabled,
          max_orders_per_day, sla_hours, integration_status, created_by, updated_by,
          created_at, updated_at
        ) VALUES (
          'FC001', 'Mumbai Fulfillment Center', 'MAIN', 'ACTIVE', 
          '123 Industrial Area, Andheri East', 'Mumbai', 'Maharashtra', 'India', '400069',
          'John Doe', 'john.doe@company.com', '+91-9876543210', '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-14:00", "sunday": "closed"}',
          50000, 10000, 0.00,
          '["storage", "distribution", "cross_docking"]', '["standard", "express", "same_day"]', 1,
          5000, 24, 'COMPLETED', 1, 1,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Fulfillment center created successfully');
    } else {
      console.log('ℹ️ Fulfillment centers already exist');
    }

    // Verify the creation
    console.log('🔍 Verifying fulfillment centers:');
    const updatedFcData = await sequelize.query('SELECT * FROM fulfillment_centers LIMIT 5', { type: Sequelize.QueryTypes.SELECT });
    console.table(updatedFcData);

    console.log('✅ Fulfillment center setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
createFulfillmentCenter()
  .then(() => {
    console.log('🎉 Fulfillment center setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

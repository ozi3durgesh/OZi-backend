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

async function checkFCStructure() {
  try {
    console.log('🚀 Checking fulfillment_centers table structure...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Check table structure
    console.log('📊 Fulfillment centers table structure:');
    const structure = await sequelize.query('DESCRIBE fulfillment_centers', { type: Sequelize.QueryTypes.SELECT });
    console.table(structure);

    // Check if any records exist
    console.log('📊 Existing fulfillment centers:');
    const existing = await sequelize.query('SELECT * FROM fulfillment_centers LIMIT 5', { type: Sequelize.QueryTypes.SELECT });
    console.table(existing);

    console.log('✅ Structure check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the check
checkFCStructure()
  .then(() => {
    console.log('🎉 Structure check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });

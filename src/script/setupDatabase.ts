// scripts/setupDatabase.ts
import sequelize from '../config/database';
import { 
  User, 
  Role, 
  Permission, 
  RolePermission,
  Order,
  Coupon,
  CouponTranslation,
  PickingWave,
  PicklistItem,
  PickingException,
  PackingJob,
  PackingItem,
  PhotoEvidence,
  Seal,
  Rider,
  Handover,
  LMSShipment,
  PackingEvent,
  Warehouse,
  WarehouseZone,
  WarehouseStaffAssignment
} from '../models';

async function setupDatabase() {
  try {
    console.log('Setting up database...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Drop all tables if they exist (for clean setup)
    console.log('🗑️  Dropping existing tables...');
    await sequelize.drop();
    console.log('✅ Tables dropped');

    // Create tables in the correct order (no foreign key constraints first)
    console.log('🏗️  Creating base tables...');
    
    // 1. Create tables without foreign keys first
    await Role.sync({ force: true });
    console.log('✅ Role table created');
    
    await Permission.sync({ force: true });
    console.log('✅ Permission table created');
    
    await User.sync({ force: true });
    console.log('✅ User table created');
    
    await Order.sync({ force: true });
    console.log('✅ Order table created');
    
    await Coupon.sync({ force: true });
    console.log('✅ Coupon table created');
    
    await CouponTranslation.sync({ force: true });
    console.log('✅ CouponTranslation table created');
    
    await Warehouse.sync({ force: true });
    console.log('✅ Warehouse table created');
    
    await WarehouseZone.sync({ force: true });
    console.log('✅ WarehouseZone table created');
    
    await Rider.sync({ force: true });
    console.log('✅ Rider table created');

    // 2. Create tables with foreign keys
    await RolePermission.sync({ force: true });
    console.log('✅ RolePermission table created');
    
    await PickingWave.sync({ force: true });
    console.log('✅ PickingWave table created');
    
    await PicklistItem.sync({ force: true });
    console.log('✅ PicklistItem table created');
    
    await PickingException.sync({ force: true });
    console.log('✅ PickingException table created');
    
    await PackingJob.sync({ force: true });
    console.log('✅ PackingJob table created');
    
    await PackingItem.sync({ force: true });
    console.log('✅ PackingItem table created');
    
    await PhotoEvidence.sync({ force: true });
    console.log('✅ PhotoEvidence table created');
    
    await Seal.sync({ force: true });
    console.log('✅ Seal table created');
    
    await PackingEvent.sync({ force: true });
    console.log('✅ PackingEvent table created');
    
    await Handover.sync({ force: true });
    console.log('✅ Handover table created');
    
    await LMSShipment.sync({ force: true });
    console.log('✅ LMSShipment table created');
    
    await WarehouseStaffAssignment.sync({ force: true });
    console.log('✅ WarehouseStaffAssignment table created');

    console.log('\n✅ Database setup completed successfully!');
    console.log('Next steps:');
    console.log('1. Run: npm run init-rbac');
    console.log('2. Run: npm run test-registration');
    console.log('3. Start server: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Database setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });

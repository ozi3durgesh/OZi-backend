// script/setupPackingTables.ts
import sequelize from '../config/database';
import {
  PackingJob,
  PackingItem,
  PhotoEvidence,
  Seal,
  Rider,
  Handover,
  LMSShipment,
  PackingEvent
} from '../models';

async function setupPackingTables() {
  try {
    console.log('Setting up packing and handover tables...');

    // First, try to drop existing tables in correct order to avoid FK constraints
    console.log('Cleaning up existing tables...');
    try {
      await sequelize.query('DROP TABLE IF EXISTS packing_events');
      await sequelize.query('DROP TABLE IF EXISTS lms_shipments');
      await sequelize.query('DROP TABLE IF EXISTS handovers');
      await sequelize.query('DROP TABLE IF EXISTS seals');
      await sequelize.query('DROP TABLE IF EXISTS photo_evidence');
      await sequelize.query('DROP TABLE IF EXISTS packing_items');
      await sequelize.query('DROP TABLE IF EXISTS packing_jobs');
      await sequelize.query('DROP TABLE IF EXISTS riders');
      console.log('✓ Existing tables dropped successfully');
    } catch (dropError) {
      console.log('⚠ Some tables may not exist, continuing...');
    }

    // Create tables in dependency order
    console.log('Creating tables...');
    
    await PackingJob.sync({ force: true });
    console.log('✓ PackingJob table created');

    await PackingItem.sync({ force: true });
    console.log('✓ PackingItem table created');

    await PhotoEvidence.sync({ force: true });
    console.log('✓ PhotoEvidence table created');

    await Seal.sync({ force: true });
    console.log('✓ Seal table created');

    await Rider.sync({ force: true });
    console.log('✓ Rider table created');

    await Handover.sync({ force: true });
    console.log('✓ Handover table created');

    await LMSShipment.sync({ force: true });
    console.log('✓ LMSShipment table created');

    await PackingEvent.sync({ force: true });
    console.log('✓ PackingEvent table created');

    // Create additional indexes for performance
    console.log('Creating additional indexes...');

    try {
      // Composite indexes for common queries
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_packing_jobs_status_priority ON packing_jobs(status, priority);
        CREATE INDEX IF NOT EXISTS idx_packing_jobs_wave_packer ON packing_jobs(waveId, packerId);
        CREATE INDEX IF NOT EXISTS idx_packing_jobs_sla_priority ON packing_jobs(slaDeadline, priority);
        CREATE INDEX IF NOT EXISTS idx_packing_items_job_order ON packing_items(jobId, orderId);
        CREATE INDEX IF NOT EXISTS idx_packing_items_sku_status ON packing_items(sku, status);
        CREATE INDEX IF NOT EXISTS idx_photo_evidence_job_type ON photo_evidence(jobId, photoType);
        CREATE INDEX IF NOT EXISTS idx_seals_job_type ON seals(jobId, sealType);
        CREATE INDEX IF NOT EXISTS idx_handovers_job_rider ON handovers(jobId, riderId);
        CREATE INDEX IF NOT EXISTS idx_handovers_status_sync ON handovers(status, lmsSyncStatus);
        CREATE INDEX IF NOT EXISTS idx_handovers_assigned_at ON handovers(assignedAt);
        CREATE INDEX IF NOT EXISTS idx_riders_availability_rating ON riders(availabilityStatus, rating);
        CREATE INDEX IF NOT EXISTS idx_riders_vehicle_active ON riders(vehicleType, isActive);
        CREATE INDEX IF NOT EXISTS idx_packing_events_job_type_time ON packing_events(jobId, eventType, timestamp);
        CREATE INDEX IF NOT EXISTS idx_lms_shipments_handover_status ON lms_shipments(handoverId, status);
      `);
      console.log('✓ Additional indexes created');
    } catch (indexError) {
      console.log('⚠ Some indexes may already exist, continuing...');
    }

    // Insert sample data for testing
    console.log('Inserting sample data...');

    // Sample riders
    const sampleRiders = await Rider.bulkCreate([
      {
        riderCode: 'R001',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john.doe@example.com',
        vehicleType: 'BIKE',
        vehicleNumber: 'BIKE001',
        availabilityStatus: 'AVAILABLE',
        currentLocation: { lat: 40.7128, lng: -74.0060 },
        rating: 4.8,
        totalDeliveries: 150,
        isActive: true,
      },
      {
        riderCode: 'R002',
        name: 'Jane Smith',
        phone: '+1234567891',
        email: 'jane.smith@example.com',
        vehicleType: 'SCOOTER',
        vehicleNumber: 'SCOOTER001',
        availabilityStatus: 'AVAILABLE',
        currentLocation: { lat: 40.7128, lng: -74.0060 },
        rating: 4.9,
        totalDeliveries: 200,
        isActive: true,
      },
      {
        riderCode: 'R003',
        name: 'Mike Johnson',
        phone: '+1234567892',
        email: 'mike.johnson@example.com',
        vehicleType: 'CAR',
        vehicleNumber: 'CAR001',
        availabilityStatus: 'BUSY',
        currentLocation: { lat: 40.7128, lng: -74.0060 },
        rating: 4.7,
        totalDeliveries: 180,
        isActive: true,
      },
    ], { ignoreDuplicates: true });

    console.log(`✓ ${sampleRiders.length} sample riders created`);

    // Sample packing jobs (these will need valid wave IDs from existing data)
    console.log('Note: Sample packing jobs require existing picking waves to be created');

    console.log('\n🎉 Packing and handover tables setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Ensure you have existing picking waves in the system');
    console.log('2. Create packing jobs from completed picking waves');
    console.log('3. Test the packing workflow');
    console.log('4. Test rider assignment and handover process');

  } catch (error) {
    console.error('Error setting up packing tables:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupPackingTables();
}

export default setupPackingTables;

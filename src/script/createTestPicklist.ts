// script/createTestPicklist.ts
import sequelize from '../config/database';
import { PickingWave, PicklistItem, User } from '../models';

async function createTestPicklist() {
  try {
    console.log('Creating test picklist data...');

    // Sync models
    await PickingWave.sync({ force: false });
    await PicklistItem.sync({ force: false });
    await User.sync({ force: false });
    console.log('✅ Models synchronized');

    // Create a test user if it doesn't exist
    let testUser = await User.findByPk(1);
    if (!testUser) {
      testUser = await User.create({
        email: 'test@company.com',
        password: 'hashedpassword',
        roleId: 1,
        isActive: true,
        availabilityStatus: 'available'
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Test user already exists');
    }

    // Create a test picking wave with forced ID 7
    let wave = await PickingWave.findByPk(7);
    if (!wave) {
      // Insert directly with SQL to force ID 7
      await sequelize.query(`
        INSERT INTO picking_waves (id, waveNumber, status, priority, totalOrders, totalItems, estimatedDuration, 
                                  slaDeadline, routeOptimization, fefoRequired, tagsAndBags, pickerId, assignedAt, startedAt, createdAt, updatedAt)
        VALUES (7, 'WAVE-007', 'PICKING', 'HIGH', 3, 3, 30, 
                '${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}', true, false, false, 
                ${testUser.id}, NOW(), NOW(), NOW(), NOW())
      `);
      wave = await PickingWave.findByPk(7);
      console.log('✅ Created test picking wave:', wave?.waveNumber);
    } else {
      console.log('✅ Test picking wave already exists');
    }



    // Create test picklist items (using only existing order ID 1)
    const testItems = [
      {
        waveId: 7,
        orderId: 1,
        sku: '122',
        productName: 'Product-122',
        binLocation: 'A1-B2-C3',
        quantity: 1,
        pickedQuantity: 0,
        status: 'PENDING' as const,
        scanSequence: 1,
        fefoBatch: 'BATCH-001',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        waveId: 7,
        orderId: 1,
        sku: '123',
        productName: 'Product-123',
        binLocation: 'A1-B2-C4',
        quantity: 2,
        pickedQuantity: 0,
        status: 'PENDING' as const,
        scanSequence: 2,
        fefoBatch: 'BATCH-002',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        waveId: 7,
        orderId: 1,
        sku: '124',
        productName: 'Product-124',
        binLocation: 'A1-B3-C1',
        quantity: 1,
        pickedQuantity: 0,
        status: 'PENDING' as const,
        scanSequence: 3,
        fefoBatch: 'BATCH-003',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const itemData of testItems) {
      // Check if item already exists
      const existingItem = await PicklistItem.findOne({
        where: { 
          waveId: itemData.waveId,
          orderId: itemData.orderId,
          sku: itemData.sku
        }
      });

      if (!existingItem) {
        // Insert directly with SQL
        await sequelize.query(`
          INSERT INTO picklist_items (waveId, orderId, sku, productName, binLocation, quantity, pickedQuantity, 
                                    status, scanSequence, fefoBatch, expiryDate, createdAt, updatedAt)
          VALUES (${itemData.waveId}, ${itemData.orderId}, '${itemData.sku}', '${itemData.productName}', 
                  '${itemData.binLocation}', ${itemData.quantity}, ${itemData.pickedQuantity}, 
                  '${itemData.status}', ${itemData.scanSequence}, '${itemData.fefoBatch}', 
                  '${itemData.expiryDate.toISOString()}', NOW(), NOW())
        `);
        console.log(`✅ Created picklist item: SKU ${itemData.sku} at ${itemData.binLocation}`);
      } else {
        console.log(`ℹ️  Picklist item already exists: SKU ${itemData.sku} at ${itemData.binLocation}`);
      }
    }

    console.log('\n🎉 Test picklist data created successfully!');
    console.log('\nYou can now test the scanning APIs:');
    console.log('1. Bin Location Scan: POST /api/picklist/7/scan/binLocation');
    console.log('   Body: {"scannedId": "A1-B2-C3"}');
    console.log('2. SKU Scan: POST /api/picklist/7/scan/sku');
    console.log('   Body: {"scannedId": "122"}');
    console.log('\nTest Data:');
    console.log('- Wave ID: 7');
    console.log('- Bin Locations: A1-B2-C3, A1-B2-C4, A1-B3-C1');
    console.log('- SKUs: 122, 123, 124');

  } catch (error) {
    console.error('❌ Error creating test picklist:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  createTestPicklist()
    .then(() => {
      console.log('Test picklist creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test picklist creation failed:', error);
      process.exit(1);
    });
}

export default createTestPicklist;

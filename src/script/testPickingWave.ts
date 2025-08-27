// Test script for picking wave generation
import sequelize from '../config/database';
import { Order, PickingWave, PicklistItem } from '../models';
import { PickingController } from '../controllers/pickingController';

async function testPickingWaveGeneration() {
  try {
    console.log('🔍 Testing picking wave generation...');
    
    // Find the latest order
    const latestOrder = await Order.findOne({
      order: [['created_at', 'DESC']],
      raw: true
    });
    
    if (!latestOrder) {
      console.log('❌ No orders found in database');
      return;
    }
    
    console.log(`📦 Found order: ${(latestOrder as any).order_id}`);
    console.log(`📋 Cart data:`, JSON.stringify((latestOrder as any).cart, null, 2));
    
    // Check if cart data exists
    if (!(latestOrder as any).cart) {
      console.log('❌ Cart data is missing from order');
      return;
    }
    
    if (!Array.isArray((latestOrder as any).cart)) {
      console.log('❌ Cart data is not an array');
      return;
    }
    
    console.log(`✅ Cart has ${(latestOrder as any).cart.length} items`);
    
    // Calculate expected total items
    const expectedTotalItems = (latestOrder as any).cart.reduce((sum: number, item: any) => {
      return sum + (item.quantity || 1);
    }, 0);
    
    console.log(`📊 Expected total items: ${expectedTotalItems}`);
    
    // Check if order is already in a picking wave
    const existingPicklistItem = await PicklistItem.findOne({
      where: { orderId: (latestOrder as any).id },
      raw: true
    });
    
    if (existingPicklistItem) {
      console.log('⚠️  Order is already in a picking wave');
      
      // Find the wave
      const wave = await PickingWave.findOne({
        where: { id: existingPicklistItem.waveId },
        raw: true
      });
      
      if (wave) {
        console.log(`📋 Wave ID: ${wave.id}`);
        console.log(`📊 Wave totalItems: ${wave.totalItems}`);
        console.log(`📦 Wave totalOrders: ${wave.totalOrders}`);
      }
      
      return;
    }
    
    console.log('✅ Order is not in any picking wave yet');
    
    // Test the cart parsing logic from PickingController
    const orderData = latestOrder as any;
    let totalItems = 0;
    
    if (orderData.cart && Array.isArray(orderData.cart)) {
      totalItems = orderData.cart.reduce((sum: number, item: any) => {
        return sum + (item.quantity || 1);
      }, 0);
    }
    
    console.log(`🧮 Calculated totalItems: ${totalItems}`);
    
    // Test creating a wave manually
    console.log('\n🚀 Testing manual wave creation...');
    
    const waveNumber = `W${Date.now()}-${orderData.order_id}`;
    const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const wave = await PickingWave.create({
      waveNumber,
      status: 'GENERATED',
      priority: 'MEDIUM',
      totalOrders: 1,
      totalItems: totalItems,
      estimatedDuration: 2,
      slaDeadline,
      routeOptimization: true,
      fefoRequired: false,
      tagsAndBags: false
    } as any);
    
    console.log(`✅ Created wave with ID: ${wave.id}`);
    console.log(`📊 Wave totalItems: ${wave.totalItems}`);
    
    // Create picklist items
    let actualTotalItems = 0;
    let createdItems = 0;
    
    if (orderData.cart && Array.isArray(orderData.cart)) {
      for (const item of orderData.cart) {
        if (item && item.sku !== undefined && item.sku !== null) {
          const quantity = item.quantity || 1;
          
          const picklistItem = await PicklistItem.create({
            waveId: wave.id,
            orderId: orderData.id,
            sku: item.sku.toString(),
            productName: `Product-${item.sku}`,
            binLocation: `A${Math.floor(Math.random() * 10) + 1}-B${Math.floor(Math.random() * 10) + 1}-C${Math.floor(Math.random() * 10) + 1}`,
            quantity: quantity,
            scanSequence: Math.floor(Math.random() * 100) + 1,
            pickedQuantity: 0,
            status: 'PENDING'
          } as any);
          
          console.log(`✅ Created picklist item: ${picklistItem.id} for SKU ${item.sku}`);
          createdItems++;
          actualTotalItems += quantity;
        }
      }
    }
    
    console.log(`\n📊 Final Summary:`);
    console.log(`Expected total items: ${totalItems}`);
    console.log(`Actual created items: ${createdItems}`);
    console.log(`Actual total quantity: ${actualTotalItems}`);
    
    // Update wave with actual counts
    await wave.update({
      totalItems: actualTotalItems
    });
    
    console.log(`✅ Updated wave totalItems to: ${actualTotalItems}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testPickingWaveGeneration();

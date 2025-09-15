import sequelize from '../config/database';
import Order from '../models/Order';
import OrderDetail from '../models/OrderDetail';

async function testOrderUpdate() {
  try {
    console.log('🔄 Testing Order and OrderDetail updates...');
    
    // Test finding the order
    const order = await Order.findOne({ 
      where: { order_id: 'ozi17579182057130001' } 
    });
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('✅ Order found:', {
      id: order.id,
      order_id: order.order_id,
      user_id: order.user_id
    });
    
    // Test updating the order
    const updateResult = await Order.update(
      { return_item_id: 'ozi17579182057130001-PD' } as any,
      { where: { order_id: 'ozi17579182057130001' } }
    );
    
    console.log('✅ Order update result:', updateResult);
    
    // Test finding order details
    const orderDetails = await OrderDetail.findAll({
      where: { order_id: order.id }
    });
    
    console.log('✅ Order details found:', orderDetails.length);
    
    // Test updating order details
    for (const detail of orderDetails) {
      const detailUpdateResult = await OrderDetail.update(
        { return_item_id: 'ozi17579182057130001-PD' } as any,
        { where: { id: detail.id } }
      );
      console.log(`✅ OrderDetail ${detail.id} update result:`, detailUpdateResult);
    }
    
    // Verify the updates
    const updatedOrder = await Order.findOne({ 
      where: { order_id: 'ozi17579182057130001' } 
    });
    
    console.log('✅ Updated order return_item_id:', updatedOrder?.return_item_id);
    
    const updatedDetails = await OrderDetail.findAll({
      where: { order_id: order.id }
    });
    
    console.log('✅ Updated order details:');
    updatedDetails.forEach(detail => {
      console.log(`  - Detail ${detail.id}: return_item_id = ${detail.return_item_id}`);
    });
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testOrderUpdate()
  .then(() => {
    console.log('✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });

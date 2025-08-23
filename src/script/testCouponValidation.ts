import sequelize from '../config/database';
import Coupon from '../models/Coupon';
import CouponTranslation from '../models/CouponTranslation';

async function testCouponValidation() {
  try {
    console.log('🧪 Testing Enhanced Coupon Validation System...\n');

    // Test 1: Create a test coupon with phone number restrictions
    console.log('📱 Test 1: Creating test coupon with phone number restrictions...');
    
    const testCoupon = await Coupon.create({
      title: 'Test Phone Coupon',
      code: 'PHONE123',
      start_date: new Date().toISOString().split('T')[0],
      expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      min_purchase: 50.00,
      max_discount: 20.00,
      discount: 15.00,
      discount_type: 'percentage',
      coupon_type: 'store_wise',
      limit: 100,
      status: 1,
      data: JSON.stringify([1, 2, 3]), // Eligible stores
      total_uses: 0,
      module_id: 1,
      created_by: 'test_user',
      customer_id: JSON.stringify(['+1234567890', '+9876543210', '+1122334455']), // Eligible phone numbers
      slug: 'test-phone-coupon',
      store_id: 1
    });

    console.log(`✅ Created test coupon: ${testCoupon.code} (ID: ${testCoupon.id})`);

    // Test 2: Create a test coupon for all customers
    console.log('\n🌍 Test 2: Creating test coupon for all customers...');
    
    const allCustomersCoupon = await Coupon.create({
      title: 'All Customers Coupon',
      code: 'ALL123',
      start_date: new Date().toISOString().split('T')[0],
      expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      min_purchase: 25.00,
      max_discount: 10.00,
      discount: 8.00,
      discount_type: 'amount',
      coupon_type: 'store_wise',
      limit: 50,
      status: 1,
      data: JSON.stringify([1, 2, 3]),
      total_uses: 0,
      module_id: 1,
      created_by: 'test_user',
      customer_id: '["all"]', // All customers eligible
      slug: 'all-customers-coupon',
      store_id: 1
    });

    console.log(`✅ Created all customers coupon: ${allCustomersCoupon.code} (ID: ${allCustomersCoupon.id})`);

    // Test 3: Create a test coupon with usage limit reached
    console.log('\n🚫 Test 3: Creating test coupon with usage limit reached...');
    
    const limitReachedCoupon = await Coupon.create({
      title: 'Limit Reached Coupon',
      code: 'LIMIT123',
      start_date: new Date().toISOString().split('T')[0],
      expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      min_purchase: 30.00,
      max_discount: 15.00,
      discount: 12.00,
      discount_type: 'percentage',
      coupon_type: 'store_wise',
      limit: 5,
      status: 1,
      data: JSON.stringify([1, 2, 3]),
      total_uses: 5, // Limit reached
      module_id: 1,
      created_by: 'test_user',
      customer_id: '["all"]',
      slug: 'limit-reached-coupon',
      store_id: 1
    });

    console.log(`✅ Created limit reached coupon: ${limitReachedCoupon.code} (ID: ${limitReachedCoupon.id})`);

    // Test 4: Create a test coupon with high minimum purchase
    console.log('\n💰 Test 4: Creating test coupon with high minimum purchase...');
    
    const highMinPurchaseCoupon = await Coupon.create({
      title: 'High Min Purchase Coupon',
      code: 'HIGH123',
      start_date: new Date().toISOString().split('T')[0],
      expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      min_purchase: 200.00,
      max_discount: 50.00,
      discount: 25.00,
      discount_type: 'percentage',
      coupon_type: 'store_wise',
      limit: 20,
      status: 1,
      data: JSON.stringify([1, 2, 3]),
      total_uses: 0,
      module_id: 1,
      created_by: 'test_user',
      customer_id: '["all"]',
      slug: 'high-min-purchase-coupon',
      store_id: 1
    });

    console.log(`✅ Created high min purchase coupon: ${highMinPurchaseCoupon.code} (ID: ${highMinPurchaseCoupon.id})`);

    // Test 5: Create an expired coupon
    console.log('\n⏰ Test 5: Creating expired test coupon...');
    
    const expiredCoupon = await Coupon.create({
      title: 'Expired Coupon',
      code: 'EXPIRED123',
      start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days ago
      expire_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      min_purchase: 20.00,
      max_discount: 10.00,
      discount: 8.00,
      discount_type: 'amount',
      coupon_type: 'store_wise',
      limit: 100,
      status: 1,
      data: JSON.stringify([1, 2, 3]),
      total_uses: 0,
      module_id: 1,
      created_by: 'test_user',
      customer_id: '["all"]',
      slug: 'expired-coupon',
      store_id: 1
    });

    console.log(`✅ Created expired coupon: ${expiredCoupon.code} (ID: ${expiredCoupon.id})`);

    // Test 6: Create a future coupon (not yet active)
    console.log('\n🔮 Test 6: Creating future test coupon...');
    
    const futureCoupon = await Coupon.create({
      title: 'Future Coupon',
      code: 'FUTURE123',
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      expire_date: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 37 days from now
      min_purchase: 40.00,
      max_discount: 20.00,
      discount: 15.00,
      discount_type: 'percentage',
      coupon_type: 'store_wise',
      limit: 75,
      status: 1,
      data: JSON.stringify([1, 2, 3]),
      total_uses: 0,
      module_id: 1,
      created_by: 'test_user',
      customer_id: '["all"]',
      slug: 'future-coupon',
      store_id: 1
    });

    console.log(`✅ Created future coupon: ${futureCoupon.code} (ID: ${futureCoupon.id})`);

    console.log('\n🎉 All test coupons created successfully!');
    console.log('\n📋 Test Coupon Summary:');
    console.log('1. PHONE123 - Phone number restricted coupon');
    console.log('2. ALL123 - All customers eligible coupon');
    console.log('3. LIMIT123 - Usage limit reached coupon');
    console.log('4. HIGH123 - High minimum purchase coupon');
    console.log('5. EXPIRED123 - Expired coupon');
    console.log('6. FUTURE123 - Future coupon (not yet active)');

    console.log('\n🧪 You can now test the coupon validation endpoints:');
    console.log('POST /api/orders/validate-coupon - Validate a coupon');
    console.log('GET /api/orders/coupon/:coupon_code - Get coupon details');

  } catch (error) {
    console.error('❌ Error creating test coupons:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testCouponValidation();

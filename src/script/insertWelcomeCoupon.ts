import sequelize from '../config/database';
import Coupon from '../models/Coupon';

async function insertWelcomeCoupon() {
  try {
    console.log('🎫 Inserting WELCOME200 coupon...');

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({
      where: { code: 'WELCOME200' }
    });

    if (existingCoupon) {
      console.log('⚠️  Coupon WELCOME200 already exists with ID:', existingCoupon.id);
      return;
    }

    // Create the WELCOME200 coupon based on the curl request parameters
    const welcomeCoupon = await Coupon.create({
      title: 'Welcome Discount',
      code: 'WELCOME200',
      start_date: new Date().toISOString().split('T')[0], // Today
      expire_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      min_purchase: 200.00, // Minimum purchase amount
      max_discount: 200.00, // Maximum discount amount
      discount: 200.00, // Discount amount
      discount_type: 'amount', // Fixed amount discount
      coupon_type: 'store_wise',
      limit: 1000, // Usage limit
      status: 1, // Active
      data: JSON.stringify([11]), // Store ID 11 from the curl
      total_uses: 0,
      module_id: 6, // From moduleid header
      created_by: 'system',
      customer_id: '["all"]', // Available for all customers
      slug: 'welcome-200-discount',
      store_id: 11 // Store ID from the curl
    });

    console.log('✅ Successfully created WELCOME200 coupon:');
    console.log(`   ID: ${welcomeCoupon.id}`);
    console.log(`   Code: ${welcomeCoupon.code}`);
    console.log(`   Title: ${welcomeCoupon.title}`);
    console.log(`   Store ID: ${welcomeCoupon.store_id}`);
    console.log(`   Module ID: ${welcomeCoupon.module_id}`);
    console.log(`   Min Purchase: ${welcomeCoupon.min_purchase}`);
    console.log(`   Discount: ${welcomeCoupon.discount}`);
    console.log(`   Discount Type: ${welcomeCoupon.discount_type}`);
    console.log(`   Usage Limit: ${welcomeCoupon.limit}`);
    console.log(`   Status: ${welcomeCoupon.status === 1 ? 'Active' : 'Inactive'}`);

  } catch (error) {
    console.error('❌ Error creating WELCOME200 coupon:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
insertWelcomeCoupon();

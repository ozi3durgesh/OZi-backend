import { Helpers } from '../utils/Helpers';
import { OrderAttributes } from '../types';

// Mock order data for testing
const mockOrder: OrderAttributes = {
  id: 1,
  order_id: 'TEST001',
  user_id: 1,
  order_amount: 150.00,
  coupon_discount_amount: 10.00,
  coupon_discount_title: 'TEST10',
  payment_status: 'paid',
  order_status: 'pending',
  total_tax_amount: 15.00,
  payment_method: 'cash_on_delivery',
  transaction_reference: 'TXN123',
  delivery_address_id: 1,
  delivery_man_id: undefined,
  coupon_code: 'TEST10',
  order_note: 'Test order',
  order_type: 'delivery',
  checked: 0,
  store_id: 1,
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
  delivery_charge: 20.00,
  schedule_at: undefined,
  callback: undefined,
  otp: undefined,
  pending: undefined,
  accepted: undefined,
  confirmed: undefined,
  processing: undefined,
  handover: undefined,
  picked_up: undefined,
  delivered: undefined,
  reached_delivery_timestamp: undefined,
  canceled: undefined,
  refund_requested: 0,
  refunded: 0,
  delivery_address: JSON.stringify({
    contact_person_name: 'John Doe',
    contact_person_number: '+1234567890',
    contact_person_email: 'john@example.com',
    house: '123',
    road: 'Main Street',
    address: 'Apt 4B',
    latitude: 40.7128,
    longitude: -74.0060
  }),
  scheduled: 0,
  store_discount_amount: 5.00,
  original_delivery_charge: 20.00,
  failed: 0,
  adjusment: 0.00,
  edited: 0,
  delivery_time: undefined,
  zone_id: undefined,
  module_id: undefined,
  order_attachment: undefined,
  parcel_category_id: undefined,
  receiver_details: undefined,
  charge_payer: 'sender',
  distance: 5.5,
  dm_tips: 2.00,
  free_delivery_by: undefined,
  refund_request_canceled: 0,
  prescription_order: 0,
  tax_status: 'included',
  dm_vehicle_id: undefined,
  cancellation_reason: undefined,
  canceled_by: undefined,
  coupon_created_by: undefined,
  discount_on_product_by: undefined,
  processing_time: undefined,
  unavailable_item_note: undefined,
  cutlery: 0,
  delivery_instruction: undefined,
  tax_percentage: 10.00,
  additional_charge: 0.00,
  order_proof: undefined,
  partially_paid_amount: 0.00,
  is_guest: 0,
  flash_admin_discount_amount: 0.00,
  flash_store_discount_amount: 0.00,
  cash_back_id: undefined,
  extra_packaging_amount: 0.00,
  ref_bonus_amount: 0.00,
  EcommInvoiceID: undefined,
  EcommOrderID: undefined,
  awb_number: undefined,
  promised_duration: undefined,
  cart: [],
  discount_amount: 0.00,
  tax_amount: 0.00,
  latitude: 40.7128,
  longitude: -74.0060,
  contact_person_name: 'John Doe',
  contact_person_number: '+1234567890',
  address_type: 'home',
  is_scheduled: 0,
  scheduled_timestamp: undefined,
  promised_delv_tat: undefined,
  partial_payment: 0.00,
  is_buy_now: 0,
  create_new_user: 0,
  guest_id: undefined,
  password: undefined
};

async function testEcommorder() {
  try {
    console.log('🧪 Testing Ecommorder function...');
    console.log('📦 Mock order data:', JSON.stringify(mockOrder, null, 2));
    
    // Test the Ecommorder function
    const result = await Helpers.Ecommorder(mockOrder);
    
    console.log('✅ Ecommorder test completed successfully!');
    console.log('📊 Result:', result);
    
  } catch (error: any) {
    console.error('❌ Ecommorder test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
if (require.main === module) {
  testEcommorder()
    .then(() => {
      console.log('🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

export { testEcommorder };

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { OrderAttributes, OrderCreationAttributes } from '../types';
import User from './User';
import { socketManager } from '../utils/socketManager';

class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  declare id: number;
  declare order_id: string;
  declare user_id: number;
  declare delivery_man_id?: number | null;
  declare return_item_id?: string | null;
  declare order_status: string;
}

Order.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  order_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0.01 } },
  coupon_discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  coupon_discount_title: { type: DataTypes.STRING(255), allowNull: true },
  payment_status: { type: DataTypes.STRING(50), defaultValue: 'unpaid', allowNull: false },
  order_status: { type: DataTypes.STRING(50), defaultValue: 'pending', allowNull: false },
  total_tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  payment_method: { type: DataTypes.STRING(50), allowNull: false },
  transaction_reference: { type: DataTypes.STRING(255), allowNull: true },
  delivery_address_id: { type: DataTypes.INTEGER, allowNull: true },
  delivery_man_id: { type: DataTypes.INTEGER, allowNull: true },
  coupon_code: { type: DataTypes.STRING(50), allowNull: true },
  order_note: { type: DataTypes.TEXT, allowNull: true },
  order_type: { type: DataTypes.STRING(50), allowNull: false },
  checked: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  store_id: { type: DataTypes.INTEGER, allowNull: false },
  fc_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'fulfillment_centers', key: 'id' } },
  created_at: { type: DataTypes.BIGINT, allowNull: false },
  updated_at: { type: DataTypes.BIGINT, allowNull: false },
  delivery_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  schedule_at: { type: DataTypes.BIGINT, allowNull: true },
  callback: { type: DataTypes.STRING(255), allowNull: true },
  otp: { type: DataTypes.INTEGER, allowNull: true },
  pending: { type: DataTypes.BIGINT, allowNull: true },
  accepted: { type: DataTypes.BIGINT, allowNull: true },
  confirmed: { type: DataTypes.BIGINT, allowNull: true },
  processing: { type: DataTypes.BIGINT, allowNull: true },
  handover: { type: DataTypes.BIGINT, allowNull: true },
  picked_up: { type: DataTypes.BIGINT, allowNull: true },
  delivered: { type: DataTypes.BIGINT, allowNull: true },
  reached_delivery_timestamp: { type: DataTypes.BIGINT, allowNull: true },
  canceled: { type: DataTypes.BIGINT, allowNull: true },
  refund_requested: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  refunded: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  delivery_address: { type: DataTypes.TEXT, allowNull: false },
  scheduled: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  store_discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  original_delivery_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  failed: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  adjusment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  edited: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  delivery_time: { type: DataTypes.STRING(50), allowNull: true },
  zone_id: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: true },
  module_id: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: true },
  order_attachment: { type: DataTypes.TEXT, allowNull: true },
  parcel_category_id: { type: DataTypes.INTEGER, allowNull: true },
  receiver_details: { type: DataTypes.JSON, allowNull: true },
  charge_payer: { type: DataTypes.STRING(50), defaultValue: 'sender', allowNull: false },
  distance: { type: DataTypes.DECIMAL(10, 6), defaultValue: 0.000000, allowNull: false },
  dm_tips: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  free_delivery_by: { type: DataTypes.STRING(50), allowNull: true },
  refund_request_canceled: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  prescription_order: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  tax_status: { type: DataTypes.STRING(50), defaultValue: 'excluded', allowNull: false },
  dm_vehicle_id: { type: DataTypes.INTEGER, allowNull: true },
  cancellation_reason: { type: DataTypes.TEXT, allowNull: true },
  canceled_by: { type: DataTypes.STRING(50), allowNull: true },
  coupon_created_by: { type: DataTypes.STRING(50), allowNull: true },
  discount_on_product_by: { type: DataTypes.STRING(50), allowNull: true },
  processing_time: { type: DataTypes.INTEGER, allowNull: true },
  unavailable_item_note: { type: DataTypes.TEXT, allowNull: true },
  cutlery: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  delivery_instruction: { type: DataTypes.TEXT, allowNull: true },
  tax_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 10.00, allowNull: false },
  additional_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  order_proof: { type: DataTypes.TEXT, allowNull: true },
  partially_paid_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  is_guest: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
  flash_admin_discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  flash_store_discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  cash_back_id: { type: DataTypes.INTEGER, allowNull: true },
  extra_packaging_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  ref_bonus_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
  EcommInvoiceID: { type: DataTypes.STRING(255), allowNull: true },
  EcommOrderID: { type: DataTypes.STRING(255), allowNull: true },
  awb_number: { type: DataTypes.STRING(255), allowNull: true },
  promised_duration: { type: DataTypes.STRING(50), allowNull: true },
  cart: { type: DataTypes.JSON, allowNull: true },
  discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: true },
  tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: true },
  latitude: { type: DataTypes.DECIMAL(15, 12), defaultValue: 0.0, allowNull: true },
  longitude: { type: DataTypes.DECIMAL(15, 12), defaultValue: 0.0, allowNull: true },
  contact_person_name: { type: DataTypes.STRING(255), defaultValue: '', allowNull: true },
  contact_person_number: { type: DataTypes.STRING(20), allowNull: true },
  address_type: { type: DataTypes.STRING(50), defaultValue: 'others', allowNull: true },
  is_scheduled: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: true },
  scheduled_timestamp: { type: DataTypes.BIGINT, defaultValue: 0, allowNull: true },
  promised_delv_tat: { type: DataTypes.STRING(10), defaultValue: '24', allowNull: true },
  partial_payment: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: true },
  is_buy_now: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: true },
  create_new_user: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: true },
  guest_id: { type: DataTypes.STRING(255), allowNull: true },
  password: { type: DataTypes.STRING(255), allowNull: true },
  return_item_id: { type: DataTypes.STRING(50), allowNull: true, comment: 'Return order ID for tracking returns' },
}, {
  sequelize,
  tableName: 'orders',
  timestamps: false,
});

// Associations
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Hook: emit socket when delivery_man_id changes
Order.afterUpdate(async (order) => {
  try {
    if (!order.changed('delivery_man_id')) return;

    const PickingWave = require('./PickingWave').default;
    const DeliveryMan = require('./DeliveryMan').default;

    const wave = await PickingWave.findOne({ where: { orderId: order.id } });

    if (!order.delivery_man_id) {
      // Delivery partner removed
      if (wave) await wave.update({ riderId: null });
      console.log(`Delivery partner removed from order ${order.id}`);
      socketManager.emit('delivery_removed', { waveId: wave?.id || null, message: 'Delivery partner removed' });
      return;
    }

    // Delivery partner assigned
    const deliveryPartner = await DeliveryMan.findByPk(order.delivery_man_id);
    if (wave && deliveryPartner) {
      await wave.update({ riderId: deliveryPartner.id });
      console.log(`Delivery partner assigned for order ${order.id}, wave ${wave.id}`);
      socketManager.emit('delivery_assigned', {
        waveId: wave.id,
        deliveryPartner: {
          id: deliveryPartner.id,
          name: `${deliveryPartner.f_name} ${deliveryPartner.l_name}`,
          vehicleId: deliveryPartner.vehicle_id,
          phone: deliveryPartner.phone,
        },
        photoPath: wave.photoPath,
      });
    }
  } catch (error) {
    console.error('Error in afterUpdate hook for delivery_man_id:', error);
  }
});

export default Order;

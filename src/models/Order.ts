import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { OrderAttributes, OrderCreationAttributes } from '../types';
import User from './User';
import { socketManager } from '../utils/socketManager';

class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  declare id: number;
  declare user_id: number | null;
  declare order_amount: number;
  declare return_amount: number;
  declare return_date: Date | null;
  declare coupon_discount_amount: number;
  declare coupon_discount_title: string | null;
  declare payment_status: string;
  declare order_status: string;
  declare is_try_and_buy: number;
  declare try_and_buy_fee: number;
  declare gift_fee: number;
  declare total_tax_amount: number;
  declare payment_method: string | null;
  declare transaction_reference: string | null;
  declare delivery_address_id: number | null;
  declare delivery_man_id: number | null;
  declare coupon_code: string | null;
  declare order_note: string | null;
  declare order_type: string;
  declare checked: number;
  declare store_id: number | null;
  declare created_at: Date | null;
  declare updated_at: Date | null;
  declare delivery_charge: number;
  declare schedule_at: Date | null;
  declare scheduled_slot: string | null;
  declare callback: string | null;
  declare otp: string | null;
  declare pending: Date | null;
  declare accepted: Date | null;
  declare confirmed: Date | null;
  declare processing: Date | null;
  declare handover: Date | null;
  declare picked_up: Date | null;
  declare delivered: Date | null;
  declare reached_delivery_timestamp: Date | null;
  declare canceled: Date | null;
  declare refund_requested: Date | null;
  declare refunded: Date | null;
  declare delivery_address: string | null;
  declare scheduled: number;
  declare store_discount_amount: number;
  declare original_delivery_charge: number;
  declare failed: Date | null;
  declare adjusment: number;
  declare edited: number;
  declare delivery_time: string | null;
  declare zone_id: number | null;
  declare module_id: number;
  declare order_attachment: string | null;
  declare parcel_category_id: number | null;
  declare receiver_details: string | null;
  declare charge_payer: string | null;
  declare distance: number;
  declare dm_tips: number;
  declare free_delivery_by: string | null;
  declare refund_request_canceled: Date | null;
  declare prescription_order: number;
  declare tax_status: string | null;
  declare dm_vehicle_id: number | null;
  declare cancellation_reason: string | null;
  declare canceled_by: string | null;
  declare coupon_created_by: string | null;
  declare discount_on_product_by: string;
  declare processing_time: string | null;
  declare unavailable_item_note: string | null;
  declare cutlery: number;
  declare delivery_instruction: string | null;
  declare tax_percentage: number | null;
  declare additional_charge: number;
  declare order_proof: string | null;
  declare partially_paid_amount: number;
  declare is_guest: number;
  declare flash_admin_discount_amount: number;
  declare flash_store_discount_amount: number;
  declare cash_back_id: number | null;
  declare extra_packaging_amount: number;
  declare ref_bonus_amount: number;
  declare EcommInvoiceID: string | null;
  declare EcommOrderID: string | null;
  declare awb_number: string | null;
  declare promised_duration: string | null;
  declare ecom_pidge_status: number;
  declare fc_id: number | null;
}

Order.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  order_amount: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  return_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
  return_date: { type: DataTypes.DATE, allowNull: true },
  coupon_discount_amount: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  coupon_discount_title: { type: DataTypes.STRING(255), allowNull: true },
  payment_status: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'unpaid' },
  order_status: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'pending' },
  is_try_and_buy: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  try_and_buy_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  gift_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  total_tax_amount: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  payment_method: { type: DataTypes.STRING(30), allowNull: true },
  transaction_reference: { type: DataTypes.STRING(30), allowNull: true },
  delivery_address_id: { type: DataTypes.BIGINT, allowNull: true },
  delivery_man_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  coupon_code: { type: DataTypes.STRING(255), allowNull: true },
  order_note: { type: DataTypes.TEXT, allowNull: true },
  order_type: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'delivery' },
  checked: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  store_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: true },
  delivery_charge: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  schedule_at: { type: DataTypes.DATE, allowNull: true },
  scheduled_slot: { type: DataTypes.STRING(255), allowNull: true },
  callback: { type: DataTypes.STRING(255), allowNull: true },
  otp: { type: DataTypes.STRING(255), allowNull: true },
  pending: { type: DataTypes.DATE, allowNull: true },
  accepted: { type: DataTypes.DATE, allowNull: true },
  confirmed: { type: DataTypes.DATE, allowNull: true },
  processing: { type: DataTypes.DATE, allowNull: true },
  handover: { type: DataTypes.DATE, allowNull: true },
  picked_up: { type: DataTypes.DATE, allowNull: true },
  delivered: { type: DataTypes.DATE, allowNull: true },
  reached_delivery_timestamp: { type: DataTypes.DATE, allowNull: true },
  canceled: { type: DataTypes.DATE, allowNull: true },
  refund_requested: { type: DataTypes.DATE, allowNull: true },
  refunded: { type: DataTypes.DATE, allowNull: true },
  delivery_address: { type: DataTypes.TEXT, allowNull: true },
  scheduled: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  store_discount_amount: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  original_delivery_charge: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  failed: { type: DataTypes.DATE, allowNull: true },
  adjusment: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  edited: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  delivery_time: { type: DataTypes.STRING(255), allowNull: true },
  zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  module_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  order_attachment: { type: DataTypes.TEXT, allowNull: true },
  parcel_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  receiver_details: { type: DataTypes.TEXT, allowNull: true },
  charge_payer: { type: DataTypes.STRING(20), allowNull: true },
  distance: { type: DataTypes.DOUBLE(16, 3), allowNull: false, defaultValue: 0.000 },
  dm_tips: { type: DataTypes.DOUBLE(24, 2), allowNull: false, defaultValue: 0.00 },
  free_delivery_by: { type: DataTypes.STRING(255), allowNull: true },
  refund_request_canceled: { type: DataTypes.DATE, allowNull: true },
  prescription_order: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  tax_status: { type: DataTypes.STRING(50), allowNull: true },
  dm_vehicle_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  cancellation_reason: { type: DataTypes.STRING(255), allowNull: true },
  canceled_by: { type: DataTypes.STRING(50), allowNull: true },
  coupon_created_by: { type: DataTypes.STRING(50), allowNull: true },
  discount_on_product_by: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'vendor' },
  processing_time: { type: DataTypes.STRING(10), allowNull: true },
  unavailable_item_note: { type: DataTypes.STRING(255), allowNull: true },
  cutlery: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  delivery_instruction: { type: DataTypes.TEXT, allowNull: true },
  tax_percentage: { type: DataTypes.DOUBLE(24, 3), allowNull: true },
  additional_charge: { type: DataTypes.DOUBLE(23, 3), allowNull: false, defaultValue: 0.000 },
  order_proof: { type: DataTypes.TEXT, allowNull: true },
  partially_paid_amount: { type: DataTypes.DOUBLE(23, 3), allowNull: false, defaultValue: 0.000 },
  is_guest: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  flash_admin_discount_amount: { type: DataTypes.DOUBLE(24, 3), allowNull: false, defaultValue: 0.000 },
  flash_store_discount_amount: { type: DataTypes.DOUBLE(24, 3), allowNull: false, defaultValue: 0.000 },
  cash_back_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  extra_packaging_amount: { type: DataTypes.DOUBLE(23, 3), allowNull: false, defaultValue: 0.000 },
  ref_bonus_amount: { type: DataTypes.DOUBLE(23, 3), allowNull: false, defaultValue: 0.000 },
  EcommInvoiceID: { type: DataTypes.STRING(255), allowNull: true },
  EcommOrderID: { type: DataTypes.STRING(255), allowNull: true },
  awb_number: { type: DataTypes.STRING(255), allowNull: true },
  promised_duration: { type: DataTypes.STRING(255), allowNull: true },
  ecom_pidge_status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  fc_id: { type: DataTypes.INTEGER, allowNull: true }
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
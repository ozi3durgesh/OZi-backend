import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { OrderAttributes, OrderCreationAttributes } from '../types';
import User from './User';

class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  public id!: number;
  public order_id!: string;
  public user_id!: number;
  public order_amount!: number;
  public coupon_discount_amount!: number;
  public coupon_discount_title?: string | null;
  public payment_status!: string;
  public order_status!: string;
  public total_tax_amount!: number;
  public payment_method!: string;
  public transaction_reference?: string | null;
  public delivery_address_id?: number | null;
  public delivery_man_id?: number | null;   // 👈 FIXED FIELD
  public coupon_code?: string | null;
  public order_note?: string | null;
  public order_type!: string;
  public checked!: number;
  public store_id!: number;
  public created_at!: number;
  public updated_at!: number;
  public delivery_charge!: number;
  public schedule_at?: number | null;
  public callback?: string | null;
  public otp?: number | null;
  public pending?: number | null;
  public accepted?: number | null;
  public confirmed?: number | null;
  public processing?: number | null;
  public handover?: number | null;
  public picked_up?: number | null;
  public delivered?: number | null;
  public reached_delivery_timestamp?: number | null;
  public canceled?: number | null;
  public refund_requested!: number;
  public refunded!: number;
  public delivery_address!: string;
  public scheduled!: number;
  public store_discount_amount!: number;
  public original_delivery_charge!: number;
  public failed!: number;
  public adjusment!: number;
  public edited!: number;
  public delivery_time?: string | null;
  public zone_id?: number | null;
  public module_id?: number | null;
  public order_attachment?: string | null;
  public parcel_category_id?: number | null;
  public receiver_details?: object | null;
  public charge_payer!: string;
  public distance!: number;
  public dm_tips!: number;
  public free_delivery_by?: string | null;
  public refund_request_canceled!: number;
  public prescription_order!: number;
  public tax_status!: string;
  public dm_vehicle_id?: number | null;
  public cancellation_reason?: string | null;
  public canceled_by?: string | null;
  public coupon_created_by?: string | null;
  public discount_on_product_by?: string | null;
  public processing_time?: number | null;
  public unavailable_item_note?: string | null;
  public cutlery!: number;
  public delivery_instruction?: string | null;
  public tax_percentage!: number;
  public additional_charge!: number;
  public order_proof?: string | null;
  public partially_paid_amount!: number;
  public is_guest!: number;
  public flash_admin_discount_amount!: number;
  public flash_store_discount_amount!: number;
  public cash_back_id?: number | null;
  public extra_packaging_amount!: number;
  public ref_bonus_amount!: number;
  public EcommInvoiceID?: string | null;
  public EcommOrderID?: string | null;
  public awb_number?: string | null;
  public promised_duration?: string | null;
  public cart?: object | null;
  public discount_amount?: number | null;
  public tax_amount?: number | null;
  public latitude?: number | null;
  public longitude?: number | null;
  public contact_person_name?: string | null;
  public contact_person_number?: string | null;
  public address_type?: string | null;
  public is_scheduled?: number | null;
  public scheduled_timestamp?: number | null;
  public promised_delv_tat?: string | null;
  public partial_payment?: number | null;
  public is_buy_now?: number | null;
  public create_new_user?: number | null;
  public guest_id?: string | null;
  public password?: string | null;
}

Order.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  coupon_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  coupon_discount_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  payment_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'unpaid',
    allowNull: false,
  },
  order_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    allowNull: false,
  },
  total_tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  transaction_reference: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  delivery_address_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  delivery_man_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  order_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  checked: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  delivery_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  schedule_at: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  callback: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  otp: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  pending: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  accepted: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  confirmed: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  processing: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  handover: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  picked_up: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  delivered: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  reached_delivery_timestamp: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  canceled: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  refund_requested: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  refunded: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  scheduled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  store_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  original_delivery_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  failed: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  adjusment: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  edited: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  delivery_time: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  zone_id: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: true,
  },
  module_id: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: true,
  },
  order_attachment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parcel_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  receiver_details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  charge_payer: {
    type: DataTypes.STRING(50),
    defaultValue: 'sender',
    allowNull: false,
  },
  distance: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0.000000,
    allowNull: false,
  },
  dm_tips: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  free_delivery_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  refund_request_canceled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  prescription_order: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  tax_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'excluded',
    allowNull: false,
  },
  dm_vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  canceled_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  coupon_created_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  discount_on_product_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  processing_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  unavailable_item_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cutlery: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  delivery_instruction: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tax_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10.00,
    allowNull: false,
  },
  additional_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  order_proof: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  partially_paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  is_guest: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  flash_admin_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  flash_store_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  cash_back_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  extra_packaging_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  ref_bonus_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  EcommInvoiceID: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  EcommOrderID: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  awb_number: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  promised_duration: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  
  // Legacy fields for backward compatibility
  cart: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(15, 12),
    defaultValue: 0.000000000000,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(15, 12),
    defaultValue: 0.000000000000,
    allowNull: true,
  },
  contact_person_name: {
    type: DataTypes.STRING(255),
    defaultValue: '',
    allowNull: true,
  },
  contact_person_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'others',
    allowNull: true,
  },
  is_scheduled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  scheduled_timestamp: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: true,
  },
  promised_delv_tat: {
    type: DataTypes.STRING(10),
    defaultValue: '24',
    allowNull: true,
  },
  partial_payment: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  is_buy_now: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  create_new_user: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  guest_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'orders',
  timestamps: false, // We're using custom timestamp fields
  indexes: [
    { fields: ['user_id'] },
    { fields: ['store_id'] },
    { fields: ['created_at'] },
    { fields: ['order_status'] },
    { fields: ['payment_status'] },
  ],
});

// Set up associations
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default Order;
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { OrderAttributes, OrderCreationAttributes } from '../types';
import User from './User';

class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  // Remove all public class field declarations to avoid Sequelize warnings
}

Order.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  cart: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isNotEmpty(value: any[]) {
        if (!value || value.length === 0) {
          throw new Error('Cart must contain at least one item');
        }
      }
    }
  },
  coupon_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  order_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  distance: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0.000000,
    allowNull: false,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(15, 12),
    defaultValue: 0.000000000000,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(15, 12),
    defaultValue: 0.000000000000,
    allowNull: false,
  },
  contact_person_name: {
    type: DataTypes.STRING(255),
    defaultValue: '',
    allowNull: false,
  },
  contact_person_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  address_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'others',
    allowNull: false,
  },
  is_scheduled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
  },
  scheduled_timestamp: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false,
  },
  promised_delv_tat: {
    type: DataTypes.STRING(10),
    defaultValue: '24',
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
  
  // Additional fields for enhanced functionality
  dm_tips: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  cutlery: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
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
  extra_packaging_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  create_new_user: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  is_guest: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  otp: {
    type: DataTypes.INTEGER,
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
  payment_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'unpaid',
    allowNull: true,
  },
  order_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    allowNull: true,
  },
  pending: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  refund_requested: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  refunded: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  failed: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  delivered: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  processing: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  picked_up: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  handover: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  reached_pickup: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  out_for_delivery: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  out_for_pickup: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  partially_paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  ref_bonus_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  flash_admin_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  flash_store_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  additional_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  store_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  tax_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10.00,
    allowNull: true,
  },
  total_tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  original_delivery_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: true,
  },
  tax_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'excluded',
    allowNull: true,
  },
  prescription_order: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  scheduled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
  },
  schedule_at: {
    type: DataTypes.BIGINT,
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
  ],
});

// Set up associations
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default Order;
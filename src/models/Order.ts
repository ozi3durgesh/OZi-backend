import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { OrderAttributes, OrderCreationAttributes } from '../types';
import User from './User';

class Order extends Model<OrderAttributes, OrderCreationAttributes> 
  implements OrderAttributes {
  public id!: number;
  public user_id!: number;
  public cart!: any[];
  public coupon_discount_amount!: number;
  public order_amount!: number;
  public order_type!: string;
  public payment_method!: string;
  public store_id!: number;
  public distance!: number;
  public discount_amount!: number;
  public tax_amount!: number;
  public address!: string;
  public latitude!: number;
  public longitude!: number;
  public contact_person_name!: string;
  public contact_person_number!: string;
  public address_type!: string;
  public is_scheduled!: number;
  public scheduled_timestamp!: number;
  public promised_delv_tat!: string;
  public created_at!: number;
  public updated_at!: number;
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
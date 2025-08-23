import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';
import Product from './Product';

export interface OrderDetailAttributes {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  price: number;
  quantity: number;
  total_price: number;
  variant: string | null;
  variation: string | null;
  add_ons: string | null;
  discount_on_item: number;
  discount_type: string;
  tax_amount: number;
  total_add_on_price: number;
  food_details: string | null;
  created_at: number;
  updated_at: number;
}

export interface OrderDetailCreationAttributes extends Omit<OrderDetailAttributes, 'id' | 'created_at' | 'updated_at'> {}

class OrderDetail extends Model<OrderDetailAttributes, OrderDetailCreationAttributes> {
  // Remove all public class field declarations to avoid Sequelize warnings
}

OrderDetail.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id',
    },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id',
    },
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  variant: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON encoded variant selections',
  },
  variation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON encoded variation details',
  },
  add_ons: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON encoded add-on selections',
  },
  discount_on_item: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  discount_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'amount',
    allowNull: false,
    validate: {
      isIn: [['amount', 'percentage']],
    },
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  total_add_on_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  food_details: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON encoded complete product snapshot',
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
  modelName: 'OrderDetail',
  tableName: 'order_details',
  timestamps: false,
  indexes: [
    {
      fields: ['order_id'],
    },
    {
      fields: ['product_id'],
    },
    {
      fields: ['sku'],
    },
  ],
});

export default OrderDetail;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';

interface OrderDetailsAttributes {
  id: number;
  item_id: number | null;
  order_id: number;
  price: number;
  item_details: string | null;
  variation: string | null;
  add_ons: string | null;
  discount_on_item: number | null;
  discount_type: string;
  quantity: number;
  tax_amount: number;
  variant: string | null;
  item_campaign_id: number | null;
  total_add_on_price: number;
  created_at: Date;
  updated_at: Date;
}

interface OrderDetailsCreationAttributes {
  item_id?: number | null;
  order_id: number;
  price: number;
  item_details?: string | null;
  variation?: string | null;
  add_ons?: string | null;
  discount_on_item?: number | null;
  discount_type?: string;
  quantity?: number;
  tax_amount?: number;
  variant?: string | null;
  item_campaign_id?: number | null;
  total_add_on_price?: number;
}

class OrderDetails extends Model<OrderDetailsAttributes, OrderDetailsCreationAttributes> {
  // Remove all public class field declarations to avoid Sequelize warnings
}

OrderDetails.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  item_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id',
    },
  },
  price: {
    type: DataTypes.DECIMAL(24, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  item_details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  variation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  add_ons: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  discount_on_item: {
    type: DataTypes.DECIMAL(24, 2),
    allowNull: true,
  },
  discount_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'amount',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(24, 2),
    allowNull: false,
    defaultValue: 1.00,
  },
  variant: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  item_campaign_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  total_add_on_price: {
    type: DataTypes.DECIMAL(24, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'OrderDetails',
  tableName: 'order_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Associations are defined in models/index.ts to avoid circular dependencies

export default OrderDetails;

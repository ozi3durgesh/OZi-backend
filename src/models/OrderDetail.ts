import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';

interface OrderDetailAttributes {
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
  created_at: number;
  updated_at: number;
  item_campaign_id: number | null;
  total_add_on_price: number;
  return_item_id: string | null;
}

interface OrderDetailCreationAttributes {
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
  created_at?: number;
  updated_at?: number;
  item_campaign_id?: number | null;
  total_add_on_price?: number;
  return_item_id?: string | null;
}

class OrderDetail extends Model<OrderDetailAttributes, OrderDetailCreationAttributes> {
  declare id: number;
  declare item_id: number | null;
  declare order_id: number;
  declare price: number;
  declare item_details: string | null;
  declare variation: string | null;
  declare add_ons: string | null;
  declare discount_on_item: number | null;
  declare discount_type: string;
  declare quantity: number;
  declare tax_amount: number;
  declare variant: string | null;
  declare created_at: number;
  declare updated_at: number;
  declare item_campaign_id: number | null;
  declare total_add_on_price: number;
  declare return_item_id: string | null;
}

OrderDetail.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  item_id: { type: DataTypes.INTEGER, allowNull: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Order, key: 'id' } },
  price: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  item_details: { type: DataTypes.TEXT, allowNull: true },
  variation: { type: DataTypes.STRING(255), allowNull: true },
  add_ons: { type: DataTypes.TEXT, allowNull: true },
  discount_on_item: { type: DataTypes.DECIMAL(24, 2), allowNull: true },
  discount_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'amount' },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  tax_amount: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 1.00 },
  variant: { type: DataTypes.STRING(255), allowNull: true },
  created_at: { type: DataTypes.BIGINT, allowNull: false },
  updated_at: { type: DataTypes.BIGINT, allowNull: false },
  item_campaign_id: { type: DataTypes.INTEGER, allowNull: true },
  total_add_on_price: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  return_item_id: { type: DataTypes.STRING(50), allowNull: true, comment: 'Return order ID for tracking returns' },
}, {
  sequelize,
  tableName: 'order_details',
  timestamps: false,
});

// Associations
Order.hasMany(OrderDetail, { foreignKey: 'order_id', as: 'orderDetails' });
OrderDetail.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

export default OrderDetail;

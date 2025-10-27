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
  is_return: number;
  return_item_status: string | null;
  return_item_date: Date | null;
  tax_amount: number;
  variant: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  item_campaign_id: number | null;
  is_gift: number;
  total_add_on_price: number;
  fc_id: number | null;
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
  is_return?: number;
  return_item_status?: string | null;
  return_item_date?: Date | null;
  tax_amount?: number;
  variant?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  item_campaign_id?: number | null;
  is_gift?: number;
  total_add_on_price?: number;
  fc_id?: number | null;
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
  declare is_return: number;
  declare return_item_status: string | null;
  declare return_item_date: Date | null;
  declare tax_amount: number;
  declare variant: string | null;
  declare created_at: Date | null;
  declare updated_at: Date | null;
  declare item_campaign_id: number | null;
  declare is_gift: number;
  declare total_add_on_price: number;
  declare fc_id: number | null;
}

OrderDetail.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  order_id: { type: DataTypes.INTEGER, allowNull: true },
  price: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  item_details: { type: DataTypes.TEXT, allowNull: true },
  variation: { type: DataTypes.TEXT, allowNull: true },
  add_ons: { type: DataTypes.TEXT, allowNull: true },
  discount_on_item: { type: DataTypes.DECIMAL(24, 2), allowNull: true },
  discount_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'amount' },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  is_return: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  return_item_status: { type: DataTypes.ENUM('pending_for_pickup','returned','return_failed','refund_processed'), allowNull: true },
  return_item_date: { type: DataTypes.DATE, allowNull: true },
  tax_amount: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 1.00 },
  variant: { type: DataTypes.STRING(255), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: true },
  item_campaign_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  is_gift: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  total_add_on_price: { type: DataTypes.DECIMAL(24, 2), allowNull: false, defaultValue: 0.00 },
  fc_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  sequelize,
  tableName: 'order_details',
  timestamps: false,
});

// Associations
Order.hasMany(OrderDetail, { foreignKey: 'order_id', as: 'orderDetails' });
OrderDetail.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

export default OrderDetail;

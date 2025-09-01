import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface ItemAttributes {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  category_id: number | null;
  category_ids: string | null;
  variations: string | null;
  add_ons: string | null;
  attributes: string | null;
  choice_options: string | null;
  price: number;
  tax: number;
  tax_type: string;
  discount: number;
  discount_type: string;
  available_time_starts: string | null;
  available_time_ends: string | null;
  set_menu: number;
  status: number;
  store_id: number;
  created_at: Date;
  updated_at: Date;
  order_count: number;
  restaurant_name: string | null;
  restaurant_discount: number;
  restaurant_opening_time: string | null;
  restaurant_closing_time: string | null;
  avg_rating: number;
  rating_count: number;
  sku: string | null;
}

interface ItemCreationAttributes {
  name: string;
  description?: string | null;
  image?: string | null;
  category_id?: number | null;
  category_ids?: string | null;
  variations?: string | null;
  add_ons?: string | null;
  attributes?: string | null;
  choice_options?: string | null;
  price: number;
  tax?: number;
  tax_type?: string;
  discount?: number;
  discount_type?: string;
  available_time_starts?: string | null;
  available_time_ends?: string | null;
  set_menu?: number;
  status?: number;
  store_id: number;
  order_count?: number;
  restaurant_name?: string | null;
  restaurant_discount?: number;
  restaurant_opening_time?: string | null;
  restaurant_closing_time?: string | null;
  avg_rating?: number;
  rating_count?: number;
  sku?: string | null;
}

class Item extends Model<ItemAttributes, ItemCreationAttributes> {
  // Remove all public class field declarations to avoid Sequelize warnings
}

Item.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  category_ids: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  variations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  add_ons: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attributes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  choice_options: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  tax_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'percent',
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  discount_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'percent',
  },
  available_time_starts: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  available_time_ends: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  set_menu: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  store_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
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
  order_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  restaurant_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  restaurant_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  restaurant_opening_time: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  restaurant_closing_time: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  avg_rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  rating_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Item',
  tableName: 'items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Item;

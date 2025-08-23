import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface ProductAttributes {
  id: number;
  sku: number;
  name: string;
  description?: string;
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  category_id?: number;
  brand_id?: number;
  status: 'active' | 'inactive' | 'discontinued';
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  weight?: number;
  dimensions?: string;
  barcode?: string;
  store_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductCreationAttributes extends Omit<ProductAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare sku: number;
  declare name: string;
  declare description?: string;
  declare base_price: number;
  declare sale_price?: number;
  declare cost_price?: number;
  declare category_id?: number;
  declare brand_id?: number;
  declare status: 'active' | 'inactive' | 'discontinued';
  declare stock_quantity: number;
  declare min_stock_level: number;
  declare max_stock_level?: number;
  declare weight?: number;
  declare dimensions?: string;
  declare barcode?: string;
  declare store_id: number;
  declare created_at: Date;
  declare updated_at: Date;
}

Product.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sku: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  sale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0.01,
    },
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0.01,
    },
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
    allowNull: false,
    defaultValue: 'active',
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  min_stock_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  max_stock_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  weight: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  dimensions: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  store_id: {
    type: DataTypes.INTEGER,
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
}, {
  sequelize,
  tableName: 'products',
  indexes: [
    { fields: ['sku'] },
    { fields: ['store_id'] },
    { fields: ['status'] },
    { fields: ['category_id'] },
    { fields: ['brand_id'] },
  ],
});

export default Product;

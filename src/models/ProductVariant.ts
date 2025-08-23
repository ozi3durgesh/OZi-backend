import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface ProductVariantAttributes {
  id: number;
  product_id: number;
  variant_name: string;
  variant_value: string;
  price_modifier: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  sku_suffix?: string;
  barcode?: string;
  weight_modifier?: number;
  dimensions_modifier?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariantCreationAttributes extends Omit<ProductVariantAttributes, 'id' | 'created_at' | 'updated_at'> {}

class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes> implements ProductVariantAttributes {
  declare id: number;
  declare product_id: number;
  declare variant_name: string;
  declare variant_value: string;
  declare price_modifier: number;
  declare stock_quantity: number;
  declare min_stock_level: number;
  declare max_stock_level?: number;
  declare sku_suffix?: string;
  declare barcode?: string;
  declare weight_modifier?: number;
  declare dimensions_modifier?: string;
  declare status: 'active' | 'inactive';
  declare created_at: Date;
  declare updated_at: Date;
}

ProductVariant.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
  },
  variant_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  variant_value: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  price_modifier: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
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
  sku_suffix: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  weight_modifier: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: true,
    defaultValue: 0.000,
  },
  dimensions_modifier: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
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
  tableName: 'product_variants',
  indexes: [
    { fields: ['product_id'] },
    { fields: ['variant_name'] },
    { fields: ['status'] },
    { fields: ['product_id', 'variant_name', 'variant_value'] },
  ],
});

export default ProductVariant;

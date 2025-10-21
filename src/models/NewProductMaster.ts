import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the interface for the product master attributes
export interface ProductMasterAttributes {
  id: number;
  status: number;
  catelogue_id: string;
  product_id: string;
  sku_id: string;
  color?: string;
  age_size?: string;
  name: string;
  category: string;
  description: string;
  image_url?: string;
  mrp: number;
  avg_cost_to_ozi?: number;
  ean_upc?: string;
  brand_id: number;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  inventory_threshold?: number;
  gst: number;
  cess: number;
  hsn: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  logs: any[];
}

// Define the interface for creation attributes (excluding auto-generated fields)
export interface ProductMasterCreationAttributes extends Optional<ProductMasterAttributes, 
  'id' | 'catelogue_id' | 'product_id' | 'sku_id' | 'avg_cost_to_ozi' | 'created_by' | 'created_at' | 'updated_at' | 'logs'> {}

// Define the interface for update attributes
export interface ProductMasterUpdateAttributes extends Partial<ProductMasterCreationAttributes> {
  logs?: any[];
}

// Define the ProductMaster model
export class ProductMaster extends Model<ProductMasterAttributes, ProductMasterCreationAttributes> 
  implements ProductMasterAttributes {
  
  // Remove public class fields to avoid shadowing Sequelize's attribute getters & setters
  // The attributes will be accessible via this.getDataValue() and this.setDataValue()
  // or directly as properties after the model is properly initialized
}

// Initialize the model
ProductMaster.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: [[0, 1]], // 0 = inactive, 1 = active
      },
    },
    catelogue_id: {
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: true,
      validate: {
        len: [7, 7], // Exactly 7 characters
        is: /^4\d{6}$/, // Must start with 4 and be 7 digits total
      },
    },
    product_id: {
      type: DataTypes.STRING(9),
      allowNull: false,
      validate: {
        len: [9, 9], // Exactly 9 characters
      },
    },
    sku_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
      validate: {
        len: [12, 12], // Exactly 12 characters
      },
    },
    color: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    age_size: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isValidUrl(value: string) {
          if (value && value.trim() !== '') {
            const urlPattern = /^https?:\/\/.+/;
            if (!urlPattern.test(value)) {
              throw new Error('Must be a valid HTTP/HTTPS URL');
            }
          }
        },
      },
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    avg_cost_to_ozi: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: 0,
      },
    },
    ean_upc: {
      type: DataTypes.STRING(14),
      allowNull: true,
      validate: {
        isValidEanUpc(value: string) {
          if (value && value.trim() !== '') {
            if (value.length < 8 || value.length > 14) {
              throw new Error('EAN/UPC must be 8-14 digits');
            }
            if (!/^\d+$/.test(value)) {
              throw new Error('EAN/UPC must contain only digits');
            }
          }
        },
      },
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Brands',
        key: 'id',
      },
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    inventory_threshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    gst: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100, // GST percentage should be between 0-100
      },
    },
    cess: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100, // CESS percentage should be between 0-100
      },
    },
    hsn: {
      type: DataTypes.STRING(8),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [4, 8], // HSN codes are typically 4-8 digits
        isNumeric: true,
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
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
    logs: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'product_master',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['catelogue_id'],
        unique: true,
      },
      {
        fields: ['sku_id'],
        unique: true,
      },
      {
        fields: ['product_id'],
      },
      {
        fields: ['brand_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['color'],
      },
      {
        fields: ['age_size'],
      },
      {
        fields: ['category'],
      },
    ],
  }
);

export default ProductMaster;

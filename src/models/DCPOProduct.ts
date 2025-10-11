import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class DCPOProduct extends Model<
  InferAttributes<DCPOProduct>,
  InferCreationAttributes<DCPOProduct>
> {
  declare id: CreationOptional<number>;
  declare dcPOId: number;
  declare productId: number;
  declare catalogue_id: string;
  declare productName: string;
  declare quantity: number;
  declare unitPrice: number;
  declare totalAmount: number;
  declare mrp: number | null;
  declare cost: number | null;
  declare description: string | null;
  declare notes: string | null;
  declare hsn: string | null;
  declare ean_upc: string | null;
  declare weight: number | null;
  declare length: number | null;
  declare height: number | null;
  declare width: number | null;
  declare inventory_threshold: number | null;
  declare gst: number | null;
  declare cess: number | null;
  declare image_url: string | null;
  declare brand_id: number | null;
  declare category_id: number | null;
  declare status: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DCPOProduct.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dcPOId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dc_purchase_orders',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'parent_product_master',
        key: 'id',
      },
    },
    catalogue_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hsn: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    ean_upc: {
      type: DataTypes.STRING(14),
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    inventory_threshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gst: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    cess: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'DCPOProduct',
    tableName: 'dc_po_products',
    timestamps: true,
  }
);

// Export helper type for creation
export type DCPOProductCreationAttributes = InferCreationAttributes<DCPOProduct>;

export default DCPOProduct;

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
  declare sku: string;
  declare productName: string;
  declare quantity: number;
  declare unitPrice: number;
  declare totalAmount: number;
  declare mrp: number | null;
  declare cost: number | null;
  declare description: string | null;
  declare notes: string | null;
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
        model: 'parent_product_master_dc',
        key: 'id',
      },
    },
    sku: {
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

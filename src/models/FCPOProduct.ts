import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

interface FCPOProductAttributes {
  id: number;
  fcPOId: number;
  productId: number;
  catalogueId: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  mrp?: number;
  notes?: string;
  skuMatrixOnCatalogueId?: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

class FCPOProduct extends Model<
  InferAttributes<FCPOProduct>,
  InferCreationAttributes<FCPOProduct>
> {
  declare id: number;
  declare fcPOId: number;
  declare productId: number;
  declare catalogueId: number;
  declare productName: string;
  declare description?: string;
  declare quantity: number;
  declare unitPrice: number;
  declare totalAmount: number;
  declare mrp?: number;
  declare notes?: string;
  declare skuMatrixOnCatalogueId?: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FCPOProduct.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fcPOId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'fc_po_id',
      references: {
        model: 'fc_purchase_orders',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'product_master',
        key: 'id',
      },
    },
    catalogueId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'catalogue_id',
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'product_name',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'total_amount',
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    skuMatrixOnCatalogueId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'sku_matrix_on_catalogue_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'FCPOProduct',
    tableName: 'fc_po_products',
    timestamps: true,
  }
);

export default FCPOProduct;

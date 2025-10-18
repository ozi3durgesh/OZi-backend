import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

interface FCSkuSplittedAttributes {
  id: number;
  fcPOId: number;
  catalogueId: number;
  sku: string;
  productName: string;
  hsn?: string;
  mrp?: number;
  eanUpc?: string;
  brand?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  gst?: number;
  cess?: number;
  sellingPrice?: number;
  rlp?: number;
  rlpWithoutTax?: number;
  gstType?: 'SGST+CGST' | 'IGST' | 'NONE';
  quantity: number;
  totalAmount: number;
  status: 'PENDING' | 'READY_FOR_GRN' | 'PROCESSED';
  createdBy: number;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

class FCSkuSplitted extends Model<
  InferAttributes<FCSkuSplitted>,
  InferCreationAttributes<FCSkuSplitted>
> {
  declare id: number;
  declare fcPOId: number;
  declare catalogueId: number;
  declare sku: string;
  declare productName: string;
  declare hsn?: string;
  declare mrp?: number;
  declare eanUpc?: string;
  declare brand?: string;
  declare weight?: number;
  declare length?: number;
  declare height?: number;
  declare width?: number;
  declare gst?: number;
  declare cess?: number;
  declare sellingPrice?: number;
  declare rlp?: number;
  declare rlpWithoutTax?: number;
  declare gstType?: 'SGST+CGST' | 'IGST' | 'NONE';
  declare quantity: number;
  declare totalAmount: number;
  declare status: 'PENDING' | 'READY_FOR_GRN' | 'PROCESSED';
  declare createdBy: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FCSkuSplitted.init(
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
    catalogueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'catalogue_id',
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'product_name',
    },
    hsn: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    eanUpc: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ean_upc',
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    length: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    height: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    width: {
      type: DataTypes.DECIMAL(8, 2),
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
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'selling_price',
    },
    rlp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rlpWithoutTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'rlp_without_tax',
    },
    gstType: {
      type: DataTypes.ENUM('SGST+CGST', 'IGST', 'NONE'),
      allowNull: true,
      field: 'gst_type',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'total_amount',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'READY_FOR_GRN', 'PROCESSED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'Users',
        key: 'id',
      },
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
    modelName: 'FCSkuSplitted',
    tableName: 'fc_sku_splitted',
    timestamps: true,
  }
);

export default FCSkuSplitted;

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class DCPOSkuMatrix extends Model<
  InferAttributes<DCPOSkuMatrix>,
  InferCreationAttributes<DCPOSkuMatrix>
> {
  declare id: CreationOptional<number>;
  declare dcPOProductId: number;
  declare quantity: number;
  declare catalogue_id: string;
  declare category: string | null;
  declare sku: string;
  declare product_name: string;
  declare description: string | null;
  declare hsn: string | null;
  declare image_url: string | null;
  declare mrp: string | null;
  declare ean_upc: string | null;
  declare color: string | null;
  declare size: string | null;
  declare brand: string | null;
  declare weight: number | null;
  declare length: number | null;
  declare height: number | null;
  declare width: number | null;
  declare inventory_threshold: number | null;
  declare gst: string | null;
  declare cess: string | null;
  declare rlp: string | null;
  declare rlp_w_o_tax: string | null;
  declare gstType: string | null;
  declare selling_price: string | null;
  declare margin: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DCPOSkuMatrix.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dcPOProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dc_po_products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    catalogue_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hsn: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mrp: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ean_upc: {
      type: DataTypes.STRING(14),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
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
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    cess: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    rlp: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rlp_w_o_tax: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gstType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    selling_price: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    margin: {
      type: DataTypes.STRING(50),
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
    modelName: 'DCPOSkuMatrix',
    tableName: 'dc_po_sku_matrix',
    timestamps: true,
  }
);

export default DCPOSkuMatrix;

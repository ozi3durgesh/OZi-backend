import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class DCSkuSplitted extends Model<
  InferAttributes<DCSkuSplitted>,
  InferCreationAttributes<DCSkuSplitted>
> {
  declare id: CreationOptional<number>;
  declare po_id: number;
  declare name: string;
  declare status: number;
  declare category_id: number;
  declare sku: string;
  declare received_quantity: number;
  declare sku_splitted_quantity: number;
  declare catalogue_id: string;
  declare description: string;
  declare hsn: string;
  declare image_url: string;
  declare mrp: number;
  declare ean_upc: string;
  declare brand_id: number;
  declare weight: number;
  declare length: number;
  declare height: number;
  declare width: number;
  declare inventory_threshold: number;
  declare gst: number;
  declare cess: number;
  declare createdBy: number;
  declare updatedBy: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DCSkuSplitted.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dc_purchase_orders',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    sku: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
      validate: {
        len: [12, 12],
        isNumeric: true,
      },
    },
    received_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    sku_splitted_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    catalogue_id: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hsn: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    ean_upc: {
      type: DataTypes.STRING(14),
      allowNull: false,
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'brands',
        key: 'id',
      },
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    inventory_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gst: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    cess: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.JSON,
      allowNull: false,
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
    modelName: 'DCSkuSplitted',
    tableName: 'dc_sku_splitted',
    timestamps: true,
  }
);

export default DCSkuSplitted;

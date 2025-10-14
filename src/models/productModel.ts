import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class Product extends Model<
  InferAttributes<Product>,
  InferCreationAttributes<Product>
> {
  declare id: CreationOptional<number>;
  declare status: number | null;
  declare catelogue_id: number | null;
  declare name: string | null;
  declare category: string | null;
  declare item_code: string | null;
  declare sku: string;
  declare description: string | null;
  declare image_url: string | null;
  declare mrp: number | null;
  declare cost: number | null;
  declare ean_upc: string | null;
  declare brand_id: number | null;
  declare weight: number | null;
  declare length: number | null;
  declare height: number | null;
  declare width: number | null;
  declare inventory_thresshold: number | null;
  declare gst: string | null;
  declare cess: number | null;
  declare hsn: string | null;
  declare dc_id: number | null;
  declare created_by: number | null;
  declare updated_by: any | null;
  declare created_at: Date | null;
  declare updated_at: Date | null;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    catelogue_id: { type: DataTypes.BIGINT, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    item_code: { type: DataTypes.STRING, allowNull: true },
    sku: { type: DataTypes.STRING, unique: true, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    mrp: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ean_upc: { type: DataTypes.STRING, allowNull: true },
    brand_id: { type: DataTypes.INTEGER, allowNull: true },
    weight: { type: DataTypes.INTEGER, allowNull: true },
    length: { type: DataTypes.INTEGER, allowNull: true },
    height: { type: DataTypes.INTEGER, allowNull: true },
    width: { type: DataTypes.INTEGER, allowNull: true },
    inventory_thresshold: { type: DataTypes.INTEGER, allowNull: true },
    gst: { type: DataTypes.STRING, allowNull: true },
    cess: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    hsn: { type: DataTypes.STRING(50), allowNull: true },
    dc_id: { type: DataTypes.INTEGER, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    updated_by: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'product_master',
    timestamps: false,
  }
);

// 👉 Export a helper type for creation
export type ProductCreationAttributes = InferCreationAttributes<Product>;

export default Product;

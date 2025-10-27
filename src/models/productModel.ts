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
  declare product_id: string | null;
  declare sku_id: string;
  declare color: string | null;
  declare age_size: string | null;
  declare name: string | null;
  declare portfolio_category: string | null;
  declare category: string | null;
  declare sub_category: string | null;
  declare description: string | null;
  declare image_url: string | null;
  declare mrp: number | null;
  declare avg_cost_to_ozi: number | null;
  declare ean_upc: string | null;
  declare brand_id: number | null;
  declare weight: number | null;
  declare length: number | null;
  declare height: number | null;
  declare width: number | null;
  declare inventory_threshold: number | null;
  declare gst: number | null;
  declare cess: number | null;
  declare hsn: string | null;
  declare fc_id: number | null;
  declare created_by: number | null;
  declare created_at: Date | null;
  declare updated_at: Date | null;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    catelogue_id: { type: DataTypes.BIGINT, allowNull: true },
    product_id: { type: DataTypes.STRING, allowNull: true },
    sku_id: { type: DataTypes.STRING, unique: true, allowNull: false },
    color: { type: DataTypes.STRING, allowNull: true },
    age_size: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    portfolio_category: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    sub_category: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    mrp: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    avg_cost_to_ozi: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ean_upc: { type: DataTypes.STRING, allowNull: true },
    brand_id: { type: DataTypes.INTEGER, allowNull: true },
    weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    length: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    height: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    width: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    inventory_threshold: { type: DataTypes.INTEGER, allowNull: true },
    gst: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    cess: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    hsn: { type: DataTypes.STRING(50), allowNull: true },
    fc_id: { type: DataTypes.INTEGER, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
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

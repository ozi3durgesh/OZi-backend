import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database';

class POProductEdit extends Model<
  InferAttributes<POProductEdit>,
  InferCreationAttributes<POProductEdit>
> {
  declare id: CreationOptional<number>;
  declare purchase_order_edit_id: number;
  declare product_id: number;
  declare catalogue_id: string;
  declare product_name: string;
  declare quantity: number;
  declare unitPrice: number;
  declare totalAmount: number;
  declare mrp: number | null;
  declare cost: number | null;
  declare hsn: string | null;
  declare ean_upc: string | null;
  declare weight: number | null;
  declare length: number | null;
  declare height: number | null;
  declare width: number | null;
  declare brand_id: number | null;
  declare category_id: number | null;
  declare sku_matrix_on_catelogue_id: string | null;
}

POProductEdit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_order_edit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'purchase_order_edits', key: 'id' },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    catalogue_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
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
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sku_matrix_on_catelogue_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'po_product_edits',
    timestamps: false,
  }
);

export default POProductEdit;

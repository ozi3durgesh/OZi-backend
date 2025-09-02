import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import PurchaseOrder from './PurchaseOrder';

interface POProductAttributes {
  id: number;
  po_id: number;
  product: string;
  sku_id: string;
  item_code: string;
  units: number;
  mrp: number;
  margin: string;
  rlp_w_o_tax: number;
  total_gst: string;
  amount: number;
}

type POProductCreationAttributes = Optional<POProductAttributes, 'id'>;

class POProduct extends Model<POProductAttributes, POProductCreationAttributes>
  implements POProductAttributes {
  public id!: number;
  public po_id!: number;
  public product!: string;
  public sku_id!: string;
  public item_code!: string;
  public units!: number;
  public mrp!: number;
  public margin!: string;
  public rlp_w_o_tax!: number;
  public total_gst!: string;
  public amount!: number;
}

POProduct.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  po_id: { type: DataTypes.INTEGER, allowNull: false },
  product: DataTypes.STRING,
  sku_id: DataTypes.STRING,
  item_code: DataTypes.STRING,
  units: DataTypes.INTEGER,
  mrp: DataTypes.DECIMAL(10, 2),
  margin: DataTypes.STRING,
  rlp_w_o_tax: DataTypes.DECIMAL(10, 2),
  total_gst: DataTypes.STRING,
  amount: DataTypes.DECIMAL(10, 2)
}, {
  sequelize,
  tableName: 'po_products',
  timestamps: false
});

// Associations
PurchaseOrder.hasMany(POProduct, { foreignKey: 'po_id', as: 'products' });
POProduct.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchaseOrder' });

export default POProduct;

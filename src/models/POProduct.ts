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
  sp: number;              // Selling Price
  margin: string;
  rlp_w_o_tax: number;
  rlp: number;
  tax_type?: string;
  gst1?: number;
  gst2?: number;
  total_gst: number;
  tax_amount?: number;
  amount: number;
  grnStatus: string;
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
  public sp!: number;
  public margin!: string;
  public rlp_w_o_tax!: number;
  public rlp!: number;
  public tax_type?: string;
  public gst1?: number;
  public gst2?: number;
  public total_gst!: number;
  public tax_amount?: number;
  public amount!: number;
  public grnStatus!: string;
}

POProduct.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.INTEGER, allowNull: false },
    product: DataTypes.STRING,
    sku_id: DataTypes.STRING,
    item_code: DataTypes.STRING,
    units: DataTypes.INTEGER,
    mrp: DataTypes.DECIMAL(10, 2),
    sp: DataTypes.DECIMAL(10, 2),
    margin: DataTypes.STRING,
    rlp_w_o_tax: DataTypes.DECIMAL(10, 2),
    rlp: DataTypes.DECIMAL(10, 2),
    tax_type: DataTypes.STRING,
    gst1: DataTypes.DECIMAL(5, 2),
    gst2: DataTypes.DECIMAL(5, 2),
    total_gst: DataTypes.DECIMAL(5, 2),
    tax_amount: DataTypes.DECIMAL(10, 2),
    amount: DataTypes.DECIMAL(10, 2),
    grnStatus: { type: DataTypes.STRING, defaultValue: 'pending' }
  },
  {
    sequelize,
    tableName: 'po_products',
    timestamps: false
  }
);

PurchaseOrder.hasMany(POProduct, { foreignKey: 'po_id', as: 'products' });
POProduct.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchaseOrder' });

export default POProduct;

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import POProduct from './POProduct';

interface PurchaseOrderAttributes {
  id: number;
  po_id: string;
  vendor_id?: string;
  vendor_name?: string;
  poc_name?: string;
  poc_phone?: string;
  vendor_tax_id?: string;
  payment_term?: string;
  payment_mode?: string;
  purchase_date?: Date;
  expected_delivery_date?: Date;
  shipping_address?: string;
  billing_address?: string;
  approval_status?: 'pending' | 'category_head' | 'admin' | 'vendor' | 'grn';
  total_amount?: number;
  total_units?: number;
  total_skus?: number;
  base_price?: number;
}

type PurchaseOrderCreationAttributes = Optional<
  PurchaseOrderAttributes,
  'id' | 'approval_status'
>;

class PurchaseOrder
  extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes>
  implements PurchaseOrderAttributes
{
  // ✅ no public field declarations here
  declare id: number;
  declare po_id: string;
  declare vendor_id?: string;
  declare vendor_name?: string;
  declare poc_name?: string;
  declare poc_phone?: string;
  declare vendor_tax_id?: string;
  declare payment_term?: string;
  declare payment_mode?: string;
  declare purchase_date?: Date;
  declare expected_delivery_date?: Date;
  declare shipping_address?: string;
  declare billing_address?: string;
  declare approval_status?: 'pending' | 'category_head' | 'admin' | 'vendor' | 'grn';
  declare total_amount?: number;
  declare total_units?: number;
  declare total_skus?: number;
  declare base_price?: number;
}

PurchaseOrder.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    vendor_id: DataTypes.STRING,
    vendor_name: DataTypes.STRING,
    poc_name: DataTypes.STRING,
    poc_phone: DataTypes.STRING,
    vendor_tax_id: DataTypes.STRING,
    payment_term: DataTypes.STRING,
    payment_mode: DataTypes.STRING,
    purchase_date: DataTypes.DATE,
    expected_delivery_date: DataTypes.DATE,
    shipping_address: DataTypes.TEXT,
    billing_address: DataTypes.TEXT,
    approval_status: {
      type: DataTypes.ENUM('pending', 'category_head', 'admin', 'vendor', 'grn'),
      defaultValue: 'pending',
    },
    total_amount: DataTypes.DECIMAL(10, 2),
    total_units: DataTypes.INTEGER,
    total_skus: DataTypes.INTEGER,
    base_price: DataTypes.DECIMAL(10, 2),
  },
  {
    sequelize,
    tableName: 'purchase_orders',
    timestamps: false,
  }
);

export default PurchaseOrder;

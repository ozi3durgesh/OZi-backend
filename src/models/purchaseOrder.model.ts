import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { POStatus } from '../types/po.js';
export interface PurchaseOrderAttrs {
  id: string;
  po_no: string;
  vendor_id: string;
  vendor_name?: string | null;
  po_date: Date;
  expected_date?: Date | null;
  currency: string;
  payment_terms?: string | null;
  site_id?: string | null;
  status: POStatus;
  locked: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}
type Creation = Optional<PurchaseOrderAttrs, 'id' | 'po_date' | 'currency' | 'status' | 'locked'>;
export class PurchaseOrder extends Model<PurchaseOrderAttrs, Creation> implements PurchaseOrderAttrs {
  public id!: string;
  public po_no!: string;
  public vendor_id!: string;
  public vendor_name!: string | null;
  public po_date!: Date;
  public expected_date!: Date | null;
  public currency!: string;
  public payment_terms!: string | null;
  public site_id!: string | null;
  public status!: POStatus;
  public locked!: boolean;
  public created_by!: string | null;
  public updated_by!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
PurchaseOrder.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    po_no: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    vendor_id: { type: DataTypes.STRING(64), allowNull: false },
    vendor_name: { type: DataTypes.STRING(255) },
    po_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    expected_date: { type: DataTypes.DATE },
    currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'INR' },
    payment_terms: { type: DataTypes.STRING(128) },
    site_id: { type: DataTypes.STRING(64) },
    status: {
      type: DataTypes.ENUM('DRAFT','OPEN','INBOUND_IN_PROGRESS','PARTIAL_GRN','CLOSED','CANCELLED'),
      allowNull: false,
      defaultValue: 'DRAFT'
    },
    locked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_by: { type: DataTypes.STRING(64) },
    updated_by: { type: DataTypes.STRING(64) },
  },
  {
    sequelize,
    tableName: 'purchase_orders',  // freezeTableName=true → table name is exactly this
    timestamps: true,
  }
);
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { POLineStatus } from '../types/po.js';
export interface PurchaseOrderLineAttrs {
  id: number;
  po_id: string;
  sku: string;
  ordered_qty: number;
  unit_cost: number;
  tax_pct: number;
  mrp?: number | null;
  received_qty: number;
  qc_pass_qty: number;
  qc_fail_qty: number;
  status: POLineStatus;
  reasons?: string[] | null; // JSON
}
type Creation = Optional<
  PurchaseOrderLineAttrs,
  'id' | 'tax_pct' | 'mrp' | 'received_qty' | 'qc_pass_qty' | 'qc_fail_qty' | 'status' | 'reasons'
>;
export class PurchaseOrderLine extends Model<PurchaseOrderLineAttrs, Creation> implements PurchaseOrderLineAttrs {
  public id!: number;
  public po_id!: string;
  public sku!: string;
  public ordered_qty!: number;
  public unit_cost!: number;
  public tax_pct!: number;
  public mrp!: number | null;
  public received_qty!: number;
  public qc_pass_qty!: number;
  public qc_fail_qty!: number;
  public status!: POLineStatus;
  public reasons!: string[] | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
PurchaseOrderLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.UUID, allowNull: false },
    sku: { type: DataTypes.STRING(64), allowNull: false },
    ordered_qty: { type: DataTypes.INTEGER, allowNull: false },
    unit_cost: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    tax_pct: { type: DataTypes.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
    mrp: { type: DataTypes.DECIMAL(12,2) },
    received_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    qc_pass_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    qc_fail_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('OPEN','PARTIAL','CLOSED'),
      allowNull: false,
      defaultValue: 'OPEN'
    },
    reasons: { type: DataTypes.JSON },
  },
  {
    sequelize,
    tableName: 'purchase_order_lines',
    indexes: [
      { fields: ['po_id'] },
      { fields: ['sku'] },
      { unique: true, fields: ['po_id', 'sku'] },
    ],
    timestamps: true,
  }
);
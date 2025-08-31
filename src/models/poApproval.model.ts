import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
export interface POApprovalAttrs {
  id: number;
  po_id: string;
  action: 'OVER_RECEIPT' | 'COST_VARIANCE' | 'FORCE_CLOSE' | 'EDIT_AFTER_LOCK';
  state: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  requested_by?: string | null;
  approved_by?: string | null;
  approved_at?: Date | null;
}
type Creation = Optional<POApprovalAttrs, 'id' | 'state' | 'notes' | 'requested_by' | 'approved_by' | 'approved_at'>;
export class POApproval extends Model<POApprovalAttrs, Creation> implements POApprovalAttrs {
  public id!: number;
  public po_id!: string;
  public action!: 'OVER_RECEIPT' | 'COST_VARIANCE' | 'FORCE_CLOSE' | 'EDIT_AFTER_LOCK';
  public state!: 'PENDING' | 'APPROVED' | 'REJECTED';
  public notes!: string | null;
  public requested_by!: string | null;
  public approved_by!: string | null;
  public approved_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}
POApproval.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.ENUM('OVER_RECEIPT','COST_VARIANCE','FORCE_CLOSE','EDIT_AFTER_LOCK'), allowNull: false },
    state: { type: DataTypes.ENUM('PENDING','APPROVED','REJECTED'), allowNull: false, defaultValue: 'PENDING' },
    notes: { type: DataTypes.TEXT },
    requested_by: { type: DataTypes.STRING(64) },
    approved_by: { type: DataTypes.STRING(64) },
    approved_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'po_approvals', timestamps: true }
);
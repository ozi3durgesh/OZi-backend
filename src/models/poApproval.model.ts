import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';
import { ApprovalStage, ApprovalStatus } from '../types/po.js';

interface POApprovalAttrs {
  id: string;
  po_id: string;
  stage: ApprovalStage;
  status: ApprovalStatus;
  approver_id: string | null;
  approver_name: string | null;
  comment: string | null;
  decided_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type POApprovalCreation = Optional<POApprovalAttrs, 'id' | 'status' | 'approver_id' | 'approver_name' | 'comment' | 'decided_at'>;

export class POApproval extends Model<POApprovalAttrs, POApprovalCreation> implements POApprovalAttrs {
  public id!: string;
  public po_id!: string;
  public stage!: ApprovalStage;
  public status!: ApprovalStatus;
  public approver_id!: string | null;
  public approver_name!: string | null;
  public comment!: string | null;
  public decided_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

POApproval.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    po_id: { type: DataTypes.UUID, allowNull: false },
    stage: { type: DataTypes.ENUM(...Object.values(ApprovalStage)), allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(ApprovalStatus)), allowNull: false, defaultValue: ApprovalStatus.PENDING },
    approver_id: { type: DataTypes.STRING, allowNull: true },
    approver_name: { type: DataTypes.STRING, allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
    decided_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'po_approvals',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['po_id'] },
      { unique: true, fields: ['po_id', 'stage'] },
    ],
  }
);

export default POApproval;
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import PutawayTask from './PutawayTask';

export interface PutawayAuditAttributes {
  id: number;
  putaway_task_id: number;
  user_id: number;
  action: 'scan_product' | 'scan_bin' | 'confirm_quantity' | 'complete_task' | 'override_bin';
  sku_id: string;
  bin_location: string | null;
  quantity: number;
  from_bin: string | null;
  to_bin: string | null;
  reason: string | null;
  created_at: Date;
}

export interface PutawayAuditCreationAttributes extends Omit<PutawayAuditAttributes, 'id' | 'created_at'> {}

class PutawayAudit extends Model<PutawayAuditAttributes, PutawayAuditCreationAttributes> implements PutawayAuditAttributes {
  public id!: number;
  public putaway_task_id!: number;
  public user_id!: number;
  public action!: 'scan_product' | 'scan_bin' | 'confirm_quantity' | 'complete_task' | 'override_bin';
  public sku_id!: string;
  public bin_location!: string | null;
  public quantity!: number;
  public from_bin!: string | null;
  public to_bin!: string | null;
  public reason!: string | null;
  public created_at!: Date;
}

PutawayAudit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    putaway_task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM('scan_product', 'scan_bin', 'confirm_quantity', 'complete_task', 'override_bin'),
      allowNull: false,
    },
    sku_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bin_location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    from_bin: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    to_bin: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'putaway_audit',
    timestamps: false,
    indexes: [
      { fields: ['putaway_task_id'] },
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['sku_id'] },
      { fields: ['created_at'] },
    ],
  }
);

// Associations are defined in models/index.ts

export default PutawayAudit;

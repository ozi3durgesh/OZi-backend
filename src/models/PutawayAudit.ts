import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface PutawayAuditAttributes {
  id: number;
  putaway_task_id: number;
  action: 'created' | 'assigned' | 'started' | 'completed' | 'cancelled' | 'updated';
  old_status?: string;
  new_status?: string;
  old_bin_location?: string;
  new_bin_location?: string;
  quantity_moved?: number;
  notes?: string;
  performed_at: Date;
  created_at: Date;
}

export interface PutawayAuditCreationAttributes {
  putaway_task_id: number;
  action: 'created' | 'assigned' | 'started' | 'completed' | 'cancelled' | 'updated';
  old_status?: string;
  new_status?: string;
  old_bin_location?: string;
  new_bin_location?: string;
  quantity_moved?: number;
  notes?: string;
  performed_at?: Date;
}

class PutawayAudit
  extends Model<PutawayAuditAttributes, PutawayAuditCreationAttributes>
  implements PutawayAuditAttributes
{
  declare id: number;
  declare putaway_task_id: number;
  declare action: 'created' | 'assigned' | 'started' | 'completed' | 'cancelled' | 'updated';
  declare old_status?: string;
  declare new_status?: string;
  declare old_bin_location?: string;
  declare new_bin_location?: string;
  declare quantity_moved?: number;
  declare notes?: string;
  declare performed_at: Date;
  declare created_at: Date;
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
    action: {
      type: DataTypes.ENUM('created', 'assigned', 'started', 'completed', 'cancelled', 'updated'),
      allowNull: false,
    },
    old_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    old_bin_location: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_bin_location: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    quantity_moved: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    performed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
      { fields: ['action'] },
      { fields: ['performed_at'] },
    ],
  }
);

export default PutawayAudit;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface FC_PutawayTaskAttributes {
  id: number;
  grn_id: number;
  grn_line_id: number;
  sku_id: string;
  quantity: number;
  bin_location_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: number;
  assigned_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  notes?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface FC_PutawayTaskCreationAttributes {
  grn_id: number;
  grn_line_id: number;
  sku_id: string;
  quantity: number;
  bin_location_id: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: number;
  assigned_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  notes?: string;
  created_by: number;
}

class FC_PutawayTask
  extends Model<FC_PutawayTaskAttributes, FC_PutawayTaskCreationAttributes>
  implements FC_PutawayTaskAttributes
{
  declare id: number;
  declare grn_id: number;
  declare grn_line_id: number;
  declare sku_id: string;
  declare quantity: number;
  declare bin_location_id: string;
  declare status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  declare priority: 'low' | 'medium' | 'high' | 'urgent';
  declare assigned_to?: number;
  declare assigned_at?: Date;
  declare started_at?: Date;
  declare completed_at?: Date;
  declare notes?: string;
  declare created_by: number;
  declare created_at: Date;
  declare updated_at: Date;
}

FC_PutawayTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    grn_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sku_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bin_location_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'fc_putaway_tasks',
    timestamps: false,
    indexes: [
      { fields: ['grn_id'] },
      { fields: ['grn_line_id'] },
      { fields: ['sku_id'] },
      { fields: ['status'] },
      { fields: ['assigned_to'] },
    ],
  }
);

export default FC_PutawayTask;

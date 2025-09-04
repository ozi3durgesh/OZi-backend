import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import GRN from './Grn.model';
import GRNLine from './GrnLine';
import User from './User';

export interface PutawayTaskAttributes {
  id: number;
  grn_id: number;
  grn_line_id: number;
  sku_id: string;
  quantity: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assigned_to: number | null;
  bin_location: string | null;
  scanned_quantity: number;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  remarks: string | null;
}

export interface PutawayTaskCreationAttributes extends Omit<PutawayTaskAttributes, 'id' | 'created_at' | 'updated_at'> {}

class PutawayTask extends Model<PutawayTaskAttributes, PutawayTaskCreationAttributes> implements PutawayTaskAttributes {
  public id!: number;
  public grn_id!: number;
  public grn_line_id!: number;
  public sku_id!: string;
  public quantity!: number;
  public status!: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  public assigned_to!: number | null;
  public bin_location!: string | null;
  public scanned_quantity!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public completed_at!: Date | null;
  public remarks!: string | null;
}

PutawayTask.init(
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
    status: {
      type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bin_location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    scanned_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'putaway_tasks',
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

// Associations are defined in models/index.ts

export default PutawayTask;

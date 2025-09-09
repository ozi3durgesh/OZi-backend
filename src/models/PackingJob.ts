// models/PackingJob.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { PackingJobAttributes, PackingJobCreationAttributes } from '../types';
import User from './User';

class PackingJob extends Model<PackingJobAttributes, PackingJobCreationAttributes> implements PackingJobAttributes {
  declare id: number;
  declare jobNumber: string;
  declare waveId: number;
  declare packerId?: number;
  declare status: 'PENDING' | 'PACKING' | 'VERIFYING' | 'COMPLETED' | 'CANCELLED' | 'AWAITING_HANDOVER' | 'HANDOVER_ASSIGNED';
  declare priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  declare assignedAt?: Date;
  declare startedAt?: Date;
  declare completedAt?: Date;
  declare handoverAt?: Date;
  declare totalItems: number;
  declare packedItems: number;
  declare verifiedItems: number;
  declare estimatedDuration: number;
  declare slaDeadline: Date;
  declare workflowType: 'PICKER_PACKS' | 'DEDICATED_PACKER';
  declare specialInstructions?: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations
  declare Packer?: any; // User instance
  declare PackingItems?: any[]; // PackingItem instances
}

PackingJob.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jobNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  waveId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'picking_waves',
      key: 'id',
    },
  },
  packerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PACKING', 'VERIFYING', 'COMPLETED', 'CANCELLED', 'AWAITING_HANDOVER', 'HANDOVER_ASSIGNED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'MEDIUM',
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  handoverAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  totalItems: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  packedItems: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  verifiedItems: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
  },
  slaDeadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  workflowType: {
    type: DataTypes.ENUM('PICKER_PACKS', 'DEDICATED_PACKER'),
    allowNull: false,
    defaultValue: 'DEDICATED_PACKER',
  },
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'packing_jobs',
  indexes: [
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['packerId'] },
    { fields: ['waveId'] },
    { fields: ['slaDeadline'] },
    { fields: ['jobNumber'] },
    { fields: ['workflowType'] },
  ],
});

export default PackingJob;

// models/Handover.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { HandoverAttributes, HandoverCreationAttributes } from '../types';
import PackingJob from './PackingJob';
import Rider from './Rider';

class Handover extends Model<HandoverAttributes, HandoverCreationAttributes> implements HandoverAttributes {
  declare id: number;
  declare jobId: number;
  declare riderId: number;
  declare status: 'ASSIGNED' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  declare assignedAt: Date;
  declare confirmedAt?: Date;
  declare pickedUpAt?: Date;
  declare deliveredAt?: Date;
  declare cancellationReason?: string;
  declare cancellationBy?: number;
  declare lmsSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'RETRY';
  declare lmsSyncAttempts: number;
  declare lmsLastSyncAt?: Date;
  declare lmsErrorMessage?: string;
  declare trackingNumber?: string;
  declare manifestNumber?: string;
  declare specialInstructions?: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations
  declare Job?: any; // PackingJob instance
  declare Rider?: any; // Rider instance
}

Handover.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'packing_jobs',
      key: 'id',
    },
  },
  riderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'riders',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'ASSIGNED',
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pickedUpAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancellationBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  lmsSyncStatus: {
    type: DataTypes.ENUM('PENDING', 'SYNCED', 'FAILED', 'RETRY'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  lmsSyncAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lmsLastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lmsErrorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  manifestNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
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
  tableName: 'handovers',
  indexes: [
    { fields: ['jobId'] },
    { fields: ['riderId'] },
    { fields: ['status'] },
    { fields: ['lmsSyncStatus'] },
    { fields: ['assignedAt'] },
    { fields: ['trackingNumber'] },
    { fields: ['manifestNumber'] },
  ],
});

export default Handover;

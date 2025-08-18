// models/PickingException.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PickingExceptionAttributes {
  id: number;
  waveId: number;
  orderId: number;
  sku: string;
  exceptionType: 'OOS' | 'DAMAGED' | 'EXPIRY' | 'WRONG_LOCATION' | 'QUANTITY_MISMATCH' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  reportedBy: number;
  reportedAt: Date;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  assignedTo?: number;
  resolution?: string;
  resolvedAt?: Date;
  resolutionPhoto?: string;
  slaDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

class PickingException extends Model<PickingExceptionAttributes> implements PickingExceptionAttributes {
  declare id: number;
  declare waveId: number;
  declare orderId: number;
  declare sku: string;
  declare exceptionType: 'OOS' | 'DAMAGED' | 'EXPIRY' | 'WRONG_LOCATION' | 'QUANTITY_MISMATCH' | 'OTHER';
  declare severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  declare description: string;
  declare reportedBy: number;
  declare reportedAt: Date;
  declare status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  declare assignedTo?: number;
  declare resolution?: string;
  declare resolvedAt?: Date;
  declare resolutionPhoto?: string;
  declare slaDeadline: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PickingException.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  waveId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'picking_waves',
      key: 'id',
    },
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  exceptionType: {
    type: DataTypes.ENUM('OOS', 'DAMAGED', 'EXPIRY', 'WRONG_LOCATION', 'QUANTITY_MISMATCH', 'OTHER'),
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'MEDIUM',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  reportedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reportedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'),
    allowNull: false,
    defaultValue: 'OPEN',
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolutionPhoto: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  slaDeadline: {
    type: DataTypes.DATE,
    allowNull: false,
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
  tableName: 'picking_exceptions',
  indexes: [
    { fields: ['waveId'] },
    { fields: ['orderId'] },
    { fields: ['status'] },
    { fields: ['severity'] },
    { fields: ['reportedBy'] },
    { fields: ['assignedTo'] },
    { fields: ['slaDeadline'] },
  ],
});

export default PickingException;

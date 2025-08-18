// models/PickingWave.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import PicklistItem from './PicklistItem';

interface PickingWaveAttributes {
  id: number;
  waveNumber: string;
  status: 'GENERATED' | 'ASSIGNED' | 'PICKING' | 'PACKING' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  pickerId?: number;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalOrders: number;
  totalItems: number;
  estimatedDuration: number; // in minutes
  slaDeadline: Date;
  routeOptimization: boolean;
  fefoRequired: boolean;
  tagsAndBags: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class PickingWave extends Model<PickingWaveAttributes> implements PickingWaveAttributes {
  declare id: number;
  declare waveNumber: string;
  declare status: 'GENERATED' | 'ASSIGNED' | 'PICKING' | 'PACKING' | 'COMPLETED' | 'CANCELLED';
  declare priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  declare pickerId?: number;
  declare assignedAt?: Date;
  declare startedAt?: Date;
  declare completedAt?: Date;
  declare totalOrders: number;
  declare totalItems: number;
  declare estimatedDuration: number;
  declare slaDeadline: Date;
  declare routeOptimization: boolean;
  declare fefoRequired: boolean;
  declare tagsAndBags: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations
  declare PicklistItems?: any[]; // PicklistItem instances
}

PickingWave.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  waveNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('GENERATED', 'ASSIGNED', 'PICKING', 'PACKING', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'GENERATED',
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'MEDIUM',
  },
  pickerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
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
  totalOrders: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  totalItems: {
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
  routeOptimization: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  fefoRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  tagsAndBags: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
  tableName: 'picking_waves',
  indexes: [
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['pickerId'] },
    { fields: ['slaDeadline'] },
    { fields: ['waveNumber'] },
  ],
});

export default PickingWave;

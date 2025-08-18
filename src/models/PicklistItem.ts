// models/PicklistItem.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PicklistItemAttributes {
  id: number;
  waveId: number;
  orderId: number;
  sku: string;
  productName: string;
  binLocation: string;
  quantity: number;
  pickedQuantity: number;
  status: 'PENDING' | 'PICKING' | 'PICKED' | 'PARTIAL' | 'OOS' | 'DAMAGED';
  fefoBatch?: string;
  expiryDate?: Date;
  scanSequence: number;
  partialReason?: string;
  partialPhoto?: string;
  pickedAt?: Date;
  pickedBy?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class PicklistItem extends Model<PicklistItemAttributes> implements PicklistItemAttributes {
  declare id: number;
  declare waveId: number;
  declare orderId: number;
  declare sku: string;
  declare productName: string;
  declare binLocation: string;
  declare quantity: number;
  declare pickedQuantity: number;
  declare status: 'PENDING' | 'PICKING' | 'PICKED' | 'PARTIAL' | 'OOS' | 'DAMAGED';
  declare fefoBatch?: string;
  declare expiryDate?: Date;
  declare scanSequence: number;
  declare partialReason?: string;
  declare partialPhoto?: string;
  declare pickedAt?: Date;
  declare pickedBy?: number;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PicklistItem.init({
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
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  binLocation: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  pickedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PICKING', 'PICKED', 'PARTIAL', 'OOS', 'DAMAGED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  fefoBatch: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  scanSequence: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  partialReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  partialPhoto: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  pickedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pickedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  notes: {
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
  tableName: 'picklist_items',
  indexes: [
    { fields: ['waveId'] },
    { fields: ['orderId'] },
    { fields: ['sku'] },
    { fields: ['binLocation'] },
    { fields: ['status'] },
    { fields: ['fefoBatch'] },
    { fields: ['expiryDate'] },
  ],
});

export default PicklistItem;

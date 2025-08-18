// models/PackingItem.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { PackingItemAttributes, PackingItemCreationAttributes } from '../types';

class PackingItem extends Model<PackingItemAttributes, PackingItemCreationAttributes> implements PackingItemAttributes {
  declare id: number;
  declare jobId: number;
  declare orderId: number;
  declare sku: string;
  declare quantity: number;
  declare pickedQuantity: number;
  declare packedQuantity: number;
  declare verifiedQuantity: number;
  declare status: 'PENDING' | 'PACKING' | 'VERIFIED' | 'COMPLETED';
  declare verificationNotes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PackingItem.init({
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  pickedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  packedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  verifiedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PACKING', 'VERIFIED', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  verificationNotes: {
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
  tableName: 'packing_items',
  indexes: [
    { fields: ['jobId'] },
    { fields: ['orderId'] },
    { fields: ['sku'] },
    { fields: ['status'] },
    { fields: ['jobId', 'orderId'] },
  ],
});

export default PackingItem;

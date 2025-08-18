// models/Seal.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { SealAttributes, SealCreationAttributes } from '../types';

class Seal extends Model<SealAttributes, SealCreationAttributes> implements SealAttributes {
  declare id: number;
  declare sealNumber: string;
  declare jobId: number;
  declare orderId?: number;
  declare sealType: 'PLASTIC' | 'PAPER' | 'METAL' | 'ELECTRONIC';
  declare appliedAt?: Date;
  declare appliedBy?: number;
  declare verificationStatus: 'PENDING' | 'VERIFIED' | 'TAMPERED';
  declare verifiedBy?: number;
  declare verifiedAt?: Date;
  declare tamperEvidence?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Seal.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sealNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
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
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  sealType: {
    type: DataTypes.ENUM('PLASTIC', 'PAPER', 'METAL', 'ELECTRONIC'),
    allowNull: false,
  },
  appliedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  appliedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  verificationStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'TAMPERED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tamperEvidence: {
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
  tableName: 'seals',
  indexes: [
    { fields: ['sealNumber'] },
    { fields: ['jobId'] },
    { fields: ['orderId'] },
    { fields: ['sealType'] },
    { fields: ['verificationStatus'] },
    { fields: ['appliedBy'] },
    { fields: ['verifiedBy'] },
  ],
});

export default Seal;

// models/ScannerSku.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface ScannerSkuAttributes {
  id: number;
  skuScanId: string;
  sku: string;
  binLocationScanId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScannerSkuCreationAttributes extends Omit<ScannerSkuAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ScannerSku extends Model<ScannerSkuAttributes, ScannerSkuCreationAttributes> implements ScannerSkuAttributes {
  declare id: number;
  declare skuScanId: string;
  declare sku: string;
  declare binLocationScanId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ScannerSku.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  skuScanId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Alphanumeric SKU scan ID',
  },
  sku: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'SKU information as JSON string or comma-separated values',
  },
  binLocationScanId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Reference to bin location scan ID',
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
  tableName: 'scanner_sku',
  indexes: [
    { fields: ['skuScanId'], unique: true },
    { fields: ['binLocationScanId'] },
  ],
});

export default ScannerSku;

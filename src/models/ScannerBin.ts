// models/ScannerBin.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface ScannerBinAttributes {
  id: number;
  binLocationScanId: string;
  sku: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScannerBinCreationAttributes extends Omit<ScannerBinAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ScannerBin extends Model<ScannerBinAttributes, ScannerBinCreationAttributes> implements ScannerBinAttributes {
  declare id: number;
  declare binLocationScanId: string;
  declare sku: string[];
  declare createdAt: Date;
  declare updatedAt: Date;
}

ScannerBin.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  binLocationScanId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Alphanumeric bin location scan ID',
  },
  sku: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'JSON array of SKU IDs',
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
  tableName: 'scanner_bin',
  indexes: [
    { fields: ['binLocationScanId'], unique: true },
  ],
});

export default ScannerBin;

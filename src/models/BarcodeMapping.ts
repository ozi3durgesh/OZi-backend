// models/BarcodeMapping.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface BarcodeMappingAttributes {
  id: number;
  barcode: string;
  barcodeType: 'BIN_LOCATION' | 'SKU' | 'HYBRID';
  binLocation?: string;
  sku?: string;
  productName?: string;
  warehouseId?: number;
  zoneId?: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// New interface for barcode items (multiple SKUs per barcode)
export interface BarcodeItemAttributes {
  id: number;
  barcodeMappingId: number;
  sku: string;
  productName: string;
  quantity?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarcodeItemCreationAttributes extends Omit<BarcodeItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface BarcodeMappingCreationAttributes extends Omit<BarcodeMappingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class BarcodeMapping extends Model<BarcodeMappingAttributes, BarcodeMappingCreationAttributes> implements BarcodeMappingAttributes {
  declare id: number;
  declare barcode: string;
  declare barcodeType: 'BIN_LOCATION' | 'SKU' | 'HYBRID';
  declare binLocation?: string;
  declare sku?: string;
  declare productName?: string;
  declare warehouseId?: number;
  declare zoneId?: number;
  declare isActive: boolean;
  declare description?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  
  // Associations
  declare Items?: BarcodeItem[];
}

BarcodeMapping.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Unique barcode/QR code value',
  },
  barcodeType: {
    type: DataTypes.ENUM('BIN_LOCATION', 'SKU', 'HYBRID'),
    allowNull: false,
    comment: 'Type of barcode - bin location only, SKU only, or both',
  },
  binLocation: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Bin location identifier (e.g., A1-B2-C3)',
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Product SKU identifier',
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Product name for reference',
  },
  warehouseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Associated warehouse ID',
  },
  zoneId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Associated zone ID',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this barcode mapping is active',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional description or notes',
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
  tableName: 'barcode_mappings',
  indexes: [
    { fields: ['barcode'], unique: true },
    { fields: ['barcodeType'] },
    { fields: ['binLocation'] },
    { fields: ['sku'] },
    { fields: ['warehouseId'] },
    { fields: ['isActive'] },
    { fields: ['barcode', 'isActive'] },
  ],
});

// BarcodeItem model for multiple SKUs per barcode
class BarcodeItem extends Model<BarcodeItemAttributes, BarcodeItemCreationAttributes> implements BarcodeItemAttributes {
  declare id: number;
  declare barcodeMappingId: number;
  declare sku: string;
  declare productName: string;
  declare quantity?: number;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

BarcodeItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  barcodeMappingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'barcode_mappings',
      key: 'id',
    },
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Product SKU identifier',
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Product name',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Expected quantity at this location',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this barcode item is active',
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
  tableName: 'barcode_items',
  indexes: [
    { fields: ['barcodeMappingId'] },
    { fields: ['sku'] },
    { fields: ['isActive'] },
    { fields: ['barcodeMappingId', 'sku'] },
  ],
});

// Set up associations
BarcodeMapping.hasMany(BarcodeItem, { 
  foreignKey: 'barcodeMappingId', 
  as: 'Items',
  onDelete: 'CASCADE'
});
BarcodeItem.belongsTo(BarcodeMapping, { 
  foreignKey: 'barcodeMappingId', 
  as: 'BarcodeMapping'
});

export { BarcodeItem };
export default BarcodeMapping;

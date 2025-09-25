import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

// Interface for column-specific error details
export interface ColumnError {
  column: string;
  value: string | null;
  error: string;
  description: string;
}

export interface ErrorDetails {
  row: number;
  errors: ColumnError[];
  sku?: string;
}

class BulkImportLog extends Model<
  InferAttributes<BulkImportLog>,
  InferCreationAttributes<BulkImportLog>
> {
  // All product_master columns (exact same structure)
  declare id: CreationOptional<number>;
  declare CPId: string | null;
  declare Status: string | null;
  declare ModelNum: string | null;
  declare ModelName: string | null;
  declare Category: string | null;
  declare SKU: string;
  declare ParentSKU: string | null;
  declare IS_MPS: string | null;
  declare ProductName: string | null;
  declare Description: string | null;
  declare ManufacturerDescription: string | null;
  declare hsn: string | null;
  declare ImageURL: string | null;
  declare MRP: number | null;
  declare COST: number | null;
  declare EAN_UPC: string | null;
  declare Color: string | null;
  declare Size: string | null;
  declare Brand: string | null;
  declare Weight: number | null;
  declare Length: number | null;
  declare Height: number | null;
  declare Width: number | null;
  declare AccountingSKU: string | null;
  declare AccountingUnit: string | null;
  declare Flammable: string | null;
  declare SPThreshold: number | null;
  declare InventoryThreshold: number | null;
  declare ERPSystemId: number | null;
  declare SyncTally: number | null;
  declare ShelfLife: string | null;
  declare ShelfLifePercentage: number | null;
  declare ProductExpiryInDays: number | null;
  declare ReverseWeight: number | null;
  declare ReverseLength: number | null;
  declare ReverseHeight: number | null;
  declare ReverseWidth: number | null;
  declare gst: string | null;
  declare CESS: number | null;
  declare CreatedDate: string | null;
  declare LastUpdatedDate: string | null;
  declare SKUType: string | null;
  declare MaterialType: string | null;
  
  // Additional logging fields
  declare CreatedBy: string;
  declare ImportStatus: 'SUCCESS' | 'FAILED';
  declare ErrorDetails: ErrorDetails[] | null;
  declare ImportDate: CreationOptional<Date>;
}

BulkImportLog.init(
  {
    // All product_master columns (exact same structure)
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    CPId: { type: DataTypes.STRING, allowNull: true },
    Status: { type: DataTypes.STRING, allowNull: true },
    ModelNum: { type: DataTypes.STRING, allowNull: true },
    ModelName: { type: DataTypes.STRING, allowNull: true },
    Category: { type: DataTypes.STRING, allowNull: true },
    SKU: { type: DataTypes.STRING, allowNull: false },
    ParentSKU: { type: DataTypes.STRING, allowNull: true },
    IS_MPS: { type: DataTypes.STRING, allowNull: true },
    ProductName: { type: DataTypes.STRING, allowNull: true },
    Description: { type: DataTypes.TEXT, allowNull: true },
    ManufacturerDescription: { type: DataTypes.TEXT, allowNull: true },
    hsn: { type: DataTypes.STRING, allowNull: true },
    ImageURL: { type: DataTypes.TEXT, allowNull: true },
    MRP: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    COST: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    EAN_UPC: { type: DataTypes.STRING, allowNull: true },
    Color: { type: DataTypes.STRING, allowNull: true },
    Size: { type: DataTypes.STRING, allowNull: true },
    Brand: { type: DataTypes.STRING, allowNull: true },
    Weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    Length: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    Height: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    Width: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    AccountingSKU: { type: DataTypes.STRING, allowNull: true },
    AccountingUnit: { type: DataTypes.STRING, allowNull: true },
    Flammable: { type: DataTypes.ENUM('Yes', 'No', 'Unknown'), allowNull: true, defaultValue: 'No' },
    SPThreshold: { type: DataTypes.INTEGER, allowNull: true },
    InventoryThreshold: { type: DataTypes.INTEGER, allowNull: true },
    ERPSystemId: { type: DataTypes.INTEGER, allowNull: true },
    SyncTally: { type: DataTypes.INTEGER, allowNull: true },
    ShelfLife: { type: DataTypes.STRING, allowNull: true },
    ShelfLifePercentage: { type: DataTypes.INTEGER, allowNull: true },
    ProductExpiryInDays: { type: DataTypes.INTEGER, allowNull: true },
    ReverseWeight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ReverseLength: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ReverseHeight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ReverseWidth: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    gst: { type: DataTypes.STRING, allowNull: true },
    CESS: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    CreatedDate: { type: DataTypes.STRING, allowNull: true },
    LastUpdatedDate: { type: DataTypes.STRING, allowNull: true },
    SKUType: { type: DataTypes.STRING, allowNull: true },
    MaterialType: { type: DataTypes.STRING, allowNull: true },
    
    // Additional logging fields
    CreatedBy: { type: DataTypes.STRING, allowNull: false },
    ImportStatus: { type: DataTypes.ENUM('SUCCESS', 'FAILED'), allowNull: false },
    ErrorDetails: { type: DataTypes.JSON, allowNull: true },
    ImportDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'BulkImportLog',
    tableName: 'bulk_import_logs',
    timestamps: false,
  }
);

// Export helper types
export type BulkImportLogCreationAttributes = InferCreationAttributes<BulkImportLog>;

export default BulkImportLog;

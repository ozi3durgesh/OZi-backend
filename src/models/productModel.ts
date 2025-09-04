import { DataTypes, Model, Optional, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database.js';

interface ProductAttributes {
  id: number;
  CPId: string;
  Status: string;
  ModelNum: string;
  Category: string;
  SKU: string;
  ParentSKU: string;
  IS_MPS: string;
  ProductName: string;
  Description: string;
  ManufacturerDescription: string;
  ProductTaxCode: string;
  ImageURL: string;
  MRP: number;
  COST: number;
  EAN_UPC: string;
  Color: string;
  Size: string;
  Brand: string;
  Weight: number;
  Length: number;
  Height: number;
  Width: number;
  AccountingSKU: string;
  AccountingUnit: string;
  SPThreshold: number;
  InventoryThreshold: number;
  ERPSystemId: number;
  SyncTally: number;
  ShelfLife: string;
  ShelfLifePercentage: number;
  ProductExpiryInDays: number;
  ReverseWeight: number;
  ReverseLength: number;
  ReverseHeight: number;
  ReverseWidth: number;
  ProductTaxRule: string;
  CESS: number;
  CreatedDate: string;
  LastUpdatedDate: string;
  SKUType: string;
  MaterialType: string;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

class Product extends Model<
  InferAttributes<Product>,
  InferCreationAttributes<Product>
> {
  declare id: CreationOptional<number>;
  declare CPId: string;
  declare Status: string;
  declare ModelNum: string;
  declare Category: string;
  declare SKU: string;
  declare ParentSKU: string;
  declare IS_MPS: string;
  declare ProductName: string;
  declare Description: string;
  declare ManufacturerDescription: string;
  declare ProductTaxCode: string;
  declare ImageURL: string;
  declare MRP: number;
  declare COST: number;
  declare EAN_UPC: string;
  declare Color: string;
  declare Size: string;
  declare Brand: string;
  declare Weight: number;
  declare Length: number;
  declare Height: number;
  declare Width: number;
  declare AccountingSKU: string;
  declare AccountingUnit: string;
  declare SPThreshold: number;
  declare InventoryThreshold: number;
  declare ERPSystemId: number;
  declare SyncTally: number;
  declare ShelfLife: string;
  declare ShelfLifePercentage: number;
  declare ProductExpiryInDays: number;
  declare ReverseWeight: number;
  declare ReverseLength: number;
  declare ReverseHeight: number;
  declare ReverseWidth: number;
  declare ProductTaxRule: string;
  declare CESS: number;
  declare CreatedDate: string;
  declare LastUpdatedDate: string;
  declare SKUType: string;
  declare MaterialType: string;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    CPId: DataTypes.STRING,
    Status: DataTypes.STRING,
    ModelNum: DataTypes.STRING,
    Category: DataTypes.STRING,
    SKU: { type: DataTypes.STRING, unique: true },
    ParentSKU: DataTypes.STRING,
    IS_MPS: DataTypes.STRING,
    ProductName: DataTypes.STRING,
    Description: DataTypes.TEXT,
    ManufacturerDescription: DataTypes.TEXT,
    ProductTaxCode: DataTypes.STRING,
    ImageURL: DataTypes.TEXT,
    MRP: DataTypes.DECIMAL(10, 2),
    COST: DataTypes.DECIMAL(10, 2),
    EAN_UPC: DataTypes.STRING,
    Color: DataTypes.STRING,
    Size: DataTypes.STRING,
    Brand: DataTypes.STRING,
    Weight: DataTypes.INTEGER,
    Length: DataTypes.INTEGER,
    Height: DataTypes.INTEGER,
    Width: DataTypes.INTEGER,
    AccountingSKU: DataTypes.STRING,
    AccountingUnit: DataTypes.STRING,
    SPThreshold: DataTypes.INTEGER,
    InventoryThreshold: DataTypes.INTEGER,
    ERPSystemId: DataTypes.INTEGER,
    SyncTally: DataTypes.INTEGER,
    ShelfLife: DataTypes.STRING,
    ShelfLifePercentage: DataTypes.INTEGER,
    ProductExpiryInDays: DataTypes.INTEGER,
    ReverseWeight: DataTypes.INTEGER,
    ReverseLength: DataTypes.INTEGER,
    ReverseHeight: DataTypes.INTEGER,
    ReverseWidth: DataTypes.INTEGER,
    ProductTaxRule: DataTypes.STRING,
    CESS: DataTypes.DECIMAL(5, 2),
    CreatedDate: DataTypes.STRING,
    LastUpdatedDate: DataTypes.STRING,
    SKUType: DataTypes.STRING,
    MaterialType: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'product_master',
    timestamps: false,
  }
);

export default Product;

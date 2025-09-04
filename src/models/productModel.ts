import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Define the interface for Product attributes
interface ProductAttributes {
  id: number;  // Required, as it is the primary key in the database
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

// Optional<ProductAttributes, 'id'> means that `id` is not required for create
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public CPId!: string;
  public Status!: string;
  public ModelNum!: string;
  public Category!: string;
  public SKU!: string;
  public ParentSKU!: string;
  public IS_MPS!: string;
  public ProductName!: string;
  public Description!: string;
  public ManufacturerDescription!: string;
  public ProductTaxCode!: string;
  public ImageURL!: string;
  public MRP!: number;
  public COST!: number;
  public EAN_UPC!: string;
  public Color!: string;
  public Size!: string;
  public Brand!: string;
  public Weight!: number;
  public Length!: number;
  public Height!: number;
  public Width!: number;
  public AccountingSKU!: string;
  public AccountingUnit!: string;
  public SPThreshold!: number;
  public InventoryThreshold!: number;
  public ERPSystemId!: number;
  public SyncTally!: number;
  public ShelfLife!: string;
  public ShelfLifePercentage!: number;
  public ProductExpiryInDays!: number;
  public ReverseWeight!: number;
  public ReverseLength!: number;
  public ReverseHeight!: number;
  public ReverseWidth!: number;
  public ProductTaxRule!: string;
  public CESS!: number;
  public CreatedDate!: string;
  public LastUpdatedDate!: string;
  public SKUType!: string;
  public MaterialType!: string;
}

// Define the model attributes using Sequelize's `init()` method
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
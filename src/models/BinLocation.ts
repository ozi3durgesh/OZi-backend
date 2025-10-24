import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface BinLocationAttributes {
  id: number;
  bin_id: string;
  bin_code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  capacity: number;
  current_quantity: number;
  sku_mapping: string[] | null;
  category_mapping: string[] | null;
  status: 'active' | 'inactive' | 'maintenance';
  bin_name: string;
  bin_type: string;
  zone_type: string;
  zone_name: string;
  bin_dimensions: string;
  preferred_product_category: string;
  no_of_categories: number;
  no_of_sku_uom: number;
  no_of_items: number;
  bin_capacity: number;
  bin_created_by: string;
  bin_status: string;
  created_at: Date;
  updated_at: Date;
  fulfillment_center_id: number;

}

export interface BinLocationCreationAttributes extends Omit<BinLocationAttributes, 'id' | 'created_at' | 'updated_at'> {}

class BinLocation extends Model<BinLocationAttributes, BinLocationCreationAttributes> implements BinLocationAttributes {
  public id!: number;
  public bin_id!: string;
  public bin_code!: string;
  public zone!: string;
  public aisle!: string;
  public rack!: string;
  public shelf!: string;
  public capacity!: number;
  public current_quantity!: number;
  public sku_mapping!: string[] | null;
  public category_mapping!: string[] | null;
  public status!: 'active' | 'inactive' | 'maintenance';
  public bin_name!: string;
  public bin_type!: string;
  public zone_type!: string;
  public zone_name!: string;
  public bin_dimensions!: string;
  public preferred_product_category!: string;
  public no_of_categories!: number;
  public no_of_sku_uom!: number;
  public no_of_items!: number;
  public bin_capacity!: number;
  public bin_created_by!: string;
  public bin_status!: string;
  public created_at!: Date;
  public updated_at!: Date;
  public fulfillment_center_id!: number;
}

BinLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fulfillment_center_id: {
     type: DataTypes.INTEGER,
     allowNull: false,
     references: {
       model: 'FulfillmentCenters',
       key: 'id',
     },
   },
    bin_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'Unique bin identifier',
    },
    bin_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    zone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    aisle: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    rack: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    shelf: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    current_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sku_mapping: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of SKU IDs that can be stored in this bin',
    },
    category_mapping: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of category IDs that can be stored in this bin',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      allowNull: false,
      defaultValue: 'active',
    },
    bin_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Human readable bin name',
    },
    bin_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of bin (Good Bin, Bad Bin, etc.)',
    },
    zone_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of zone (Each, Bulk, etc.)',
    },
    zone_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Name of the zone',
    },
    bin_dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Physical dimensions of the bin',
    },
    preferred_product_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Preferred product category for this bin',
    },
    no_of_categories: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of categories in this bin',
    },
    no_of_sku_uom: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of SKU/UOM in this bin',
    },
    no_of_items: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of items in this bin',
    },
    bin_capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Maximum capacity of the bin',
    },
    bin_created_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'User who created the bin',
    },
    bin_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Unlocked',
      comment: 'Current status of the bin',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'bin_locations',
    timestamps: false,
    indexes: [
      { fields: ['bin_id'], unique: true },
      { fields: ['bin_code'], unique: true },
      { fields: ['zone'] },
      { fields: ['aisle'] },
      { fields: ['status'] },
      { fields: ['zone_name'] },
      { fields: ['bin_status'] },
    ],
  }
);

export default BinLocation;

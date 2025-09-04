import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface BinLocationAttributes {
  id: number;
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
  created_at: Date;
  updated_at: Date;
}

export interface BinLocationCreationAttributes extends Omit<BinLocationAttributes, 'id' | 'created_at' | 'updated_at'> {}

class BinLocation extends Model<BinLocationAttributes, BinLocationCreationAttributes> implements BinLocationAttributes {
  public id!: number;
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
  public created_at!: Date;
  public updated_at!: Date;
}

BinLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
      { fields: ['bin_code'], unique: true },
      { fields: ['zone'] },
      { fields: ['aisle'] },
      { fields: ['status'] },
    ],
  }
);

export default BinLocation;

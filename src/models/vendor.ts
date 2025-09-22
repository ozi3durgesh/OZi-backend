import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface VendorAttributes {
  id: number;
  vendorId: string;
  businessName: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pocName?: string;
  pocNumber?: string;
  gstNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Fields that can be omitted when creating
type VendorCreationAttributes = Optional<VendorAttributes, 'id' | 'vendorId'>;

class Vendor extends Model<VendorAttributes, VendorCreationAttributes>
  implements VendorAttributes {
  public id!: number;
  public vendorId!: string;
  public businessName!: string;
  public businessAddress?: string;
  public city?: string;
  public state?: string;
  public pincode?: string;
  public pocName?: string;
  public pocNumber?: string;
  public gstNumber!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Vendor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'vendor_id',
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'business_name',
    },
    businessAddress: {
      type: DataTypes.STRING,
      field: 'business_address',
    },
    city: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.STRING,
    },
    pocName: {
      type: DataTypes.STRING,
      field: 'poc_name',
    },
    pocNumber: {
      type: DataTypes.STRING,
      field: 'poc_number',
    },
    gstNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'gst_number',
    },
  },
  {
    sequelize,
    tableName: 'vendors',
    underscored: true,
    timestamps: true,
  }
);

export default Vendor;

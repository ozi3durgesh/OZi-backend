import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface VendorDCAttributes {
  id: number;
  vendorId: string;
  dcId: number;
  businessName: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  pocName?: string;
  pocNumber?: string;
  pocEmail?: string;
  gstNumber: string;
  panNumber?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  vendorType: 'MANUFACTURER' | 'SUPPLIER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'OTHER';
  paymentTerms?: string;
  creditLimit?: number;
  rating?: number;
  notes?: string;
  createdBy: number;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Associations
  DistributionCenter?: any;
  CreatedByUser?: any;
  UpdatedByUser?: any;
}

type VendorDCCreationAttributes = Optional<VendorDCAttributes, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>;

class VendorDC extends Model<VendorDCAttributes, VendorDCCreationAttributes> implements VendorDCAttributes {
  public id!: number;
  public vendorId!: string;
  public dcId!: number;
  public businessName!: string;
  public businessAddress?: string;
  public city?: string;
  public state?: string;
  public country!: string;
  public pincode?: string;
  public pocName?: string;
  public pocNumber?: string;
  public pocEmail?: string;
  public gstNumber!: string;
  public panNumber?: string;
  public status!: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  public vendorType!: 'MANUFACTURER' | 'SUPPLIER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'OTHER';
  public paymentTerms?: string;
  public creditLimit?: number;
  public rating?: number;
  public notes?: string;
  public createdBy!: number;
  public updatedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Associations
  public DistributionCenter?: any;
  public CreatedByUser?: any;
  public UpdatedByUser?: any;
}

VendorDC.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'vendor_id',
    },
    dcId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dc_id',
      references: {
        model: 'DistributionCenters',
        key: 'id',
      },
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'business_name',
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'business_address',
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'India',
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    pocName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'poc_name',
    },
    pocNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'poc_number',
    },
    pocEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'poc_email',
      validate: {
        isEmail: true,
      },
    },
    gstNumber: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      field: 'gst_number',
    },
    panNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'pan_number',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    vendorType: {
      type: DataTypes.ENUM('MANUFACTURER', 'SUPPLIER', 'DISTRIBUTOR', 'WHOLESALER', 'OTHER'),
      allowNull: false,
      defaultValue: 'SUPPLIER',
      field: 'vendor_type',
    },
    paymentTerms: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'payment_terms',
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'credit_limit',
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'updated_by',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'vendor_dc',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default VendorDC;


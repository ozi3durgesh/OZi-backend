import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface VendorDCAttributes {
  id: number;
  vendorId: string;
  dcId: number;
  tradeName: string;
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
  vendorType: 'MANUFACTURER' | 'SUPPLIER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'OTHER';
  brandName?: string;
  model?: string;
  vrf?: string;
  agreementDoc?: string;
  agreement?: string;
  panDocument?: string;
  gstCertificate?: string;
  cancelledCheque?: string;
  msmeCertificate?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  stockCorrection?: boolean;
  stockCorrectionPercentage?: string;
  creditTerms?: string;
  creditDays?: string;
  deliveryTAT?: string;
  margin?: string;
  marginOn?: string;
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
  public tradeName!: string;
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
  public vendorType!: 'MANUFACTURER' | 'SUPPLIER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'OTHER';
  public brandName?: string;
  public model?: string;
  public vrf?: string;
  public agreementDoc?: string;
  public agreement?: string;
  public panDocument?: string;
  public gstCertificate?: string;
  public cancelledCheque?: string;
  public msmeCertificate?: string;
  public bankAccountNumber?: string;
  public ifscCode?: string;
  public stockCorrection?: boolean;
  public stockCorrectionPercentage?: string;
  public creditTerms?: string;
  public creditDays?: string;
  public deliveryTAT?: string;
  public margin?: string;
  public marginOn?: string;
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
    tradeName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'trade_name',
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
        isValidEmailList(value: string) {
          if (!value) return;
          const emails = value.split(',').map(email => email.trim());
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          for (const email of emails) {
            if (!emailRegex.test(email)) {
              throw new Error('Invalid email format in POC email list');
            }
          }
        },
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
    vendorType: {
      type: DataTypes.ENUM('MANUFACTURER', 'SUPPLIER', 'DISTRIBUTOR', 'WHOLESALER', 'OTHER'),
      allowNull: false,
      defaultValue: 'SUPPLIER',
      field: 'vendor_type',
    },
    brandName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'brand_name',
    },
    model: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    vrf: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    agreementDoc: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'agreement_doc',
    },
    agreement: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    panDocument: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'pan_document',
    },
    gstCertificate: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'gst_certificate',
    },
    cancelledCheque: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'cancelled_cheque',
    },
    msmeCertificate: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'msme_certificate',
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'bank_account_number',
    },
    ifscCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'ifsc_code',
    },
    stockCorrection: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'stock_correction',
    },
    stockCorrectionPercentage: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'stock_correction_percentage',
    },
    creditTerms: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'credit_terms',
    },
    creditDays: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'credit_days',
    },
    deliveryTAT: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'delivery_tat',
    },
    margin: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    marginOn: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'margin_on',
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


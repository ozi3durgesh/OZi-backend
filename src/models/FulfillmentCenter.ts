import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface FulfillmentCenterAttributes {
  id: number;
  fc_code: string;
  name: string;
  dc_id: number; // Foreign key to DistributionCenter
  type: 'MAIN' | 'SATELLITE' | 'STOREFRONT' | 'DISTRIBUTION';
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
  
  // Location Information
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  
  // Contact Information
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  emergency_contact?: string;
  
  // Operational Details
  operational_hours?: any;
  capacity_sqft?: number;
  storage_capacity_units?: number;
  current_utilization_percentage: number;
  
  // Services & Capabilities
  services_offered?: any;
  supported_fulfillment_types?: any;
  
  // Configuration
  is_auto_assignment_enabled: boolean;
  max_orders_per_day: number;
  sla_hours: number;
  
  // Integration Details
  lms_fc_id?: string;
  integration_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  
  // Audit Fields
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
  
  // Associations
  DistributionCenter?: any;
  Zones?: any[];
  StaffAssignments?: any[];
  CreatedBy?: any;
  UpdatedBy?: any;
}

export interface FulfillmentCenterCreationAttributes
  extends Omit<FulfillmentCenterAttributes, 'id' | 'created_at' | 'updated_at'> {}

interface FulfillmentCenterInstance
  extends Model<FulfillmentCenterAttributes, FulfillmentCenterCreationAttributes>,
    FulfillmentCenterAttributes {}

const FulfillmentCenter = sequelize.define<FulfillmentCenterInstance>('FulfillmentCenter', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fc_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  dc_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'DistributionCenters',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('MAIN', 'SATELLITE', 'STOREFRONT', 'DISTRIBUTION'),
    allowNull: false,
    defaultValue: 'MAIN',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
  
  // Location Information
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'India',
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  
  // Contact Information
  contact_person: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  emergency_contact: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  
  // Operational Details
  operational_hours: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  capacity_sqft: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  storage_capacity_units: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  current_utilization_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  
  // Services & Capabilities
  services_offered: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  supported_fulfillment_types: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  
  // Configuration
  is_auto_assignment_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  max_orders_per_day: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000,
  },
  sla_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 24,
  },
  
  // Integration Details
  lms_fc_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  integration_status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  
  // Audit Fields
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
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
}, {
  tableName: 'FulfillmentCenters',
  timestamps: false, // Disable automatic timestamps since we use created_at/updated_at
  indexes: [
    {
      unique: true,
      fields: ['fc_code']
    },
    {
      fields: ['dc_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['city', 'state']
    }
  ]
});

export default FulfillmentCenter;

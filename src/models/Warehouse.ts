import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface WarehouseAttributes {
  id: number;
  warehouse_code: string;
  name: string;
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
  lms_warehouse_id?: string;
  integration_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  
  // FC mapping
  fc_id?: number;
  
  // Audit Fields
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
  
  // Associations
  Zones?: any[];
  StaffAssignments?: any[];
  CreatedBy?: any;
  UpdatedBy?: any;
}

export interface WarehouseCreationAttributes extends Omit<WarehouseAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
  public id!: number;
  public warehouse_code!: string;
  public name!: string;
  public type!: 'MAIN' | 'SATELLITE' | 'STOREFRONT' | 'DISTRIBUTION';
  public status!: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
  
  // Location Information
  public address!: string;
  public city!: string;
  public state!: string;
  public country!: string;
  public pincode!: string;
  public latitude?: number;
  public longitude?: number;
  
  // Contact Information
  public contact_person?: string;
  public contact_email?: string;
  public contact_phone?: string;
  public emergency_contact?: string;
  
  // Operational Details
  public operational_hours?: any;
  public capacity_sqft?: number;
  public storage_capacity_units?: number;
  public current_utilization_percentage!: number;
  
  // Services & Capabilities
  public services_offered?: any;
  public supported_fulfillment_types?: any;
  
  // Configuration
  public is_auto_assignment_enabled!: boolean;
  public max_orders_per_day!: number;
  public sla_hours!: number;
  
  // Integration Details
  public lms_warehouse_id?: string;
  public integration_status!: 'PENDING' | 'COMPLETED' | 'FAILED';
  
  // FC mapping
  public fc_id?: number;
  
  // Audit Fields
  public created_by!: number;
  public updated_by?: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Warehouse.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    warehouse_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
      type: DataTypes.STRING(20),
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
    contact_person: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    operational_hours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    capacity_sqft: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    storage_capacity_units: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    current_utilization_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    services_offered: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    supported_fulfillment_types: {
      type: DataTypes.JSON,
      allowNull: true,
    },
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
    lms_warehouse_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    integration_status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    fc_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fulfillment_centers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: 'warehouses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_warehouse_code',
        fields: ['warehouse_code'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_location',
        fields: ['city', 'state'],
      },
      {
        name: 'idx_capacity',
        fields: ['current_utilization_percentage'],
      },
    ],
  }
);

export default Warehouse;

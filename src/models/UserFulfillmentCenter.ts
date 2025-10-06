import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface UserFulfillmentCenterAttributes {
  id: number;
  user_id: number;
  fc_id: number;
  role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER' | 'VIEWER';
  assigned_date: Date;
  end_date?: Date;
  is_active: boolean;
  is_default: boolean; // Default FC for the user
  
  // Audit Fields
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
  
  // Associations
  User?: any;
  FulfillmentCenter?: any;
  CreatedBy?: any;
  UpdatedBy?: any;
}

export interface UserFulfillmentCenterCreationAttributes
  extends Omit<UserFulfillmentCenterAttributes, 'id' | 'created_at' | 'updated_at'> {}

interface UserFulfillmentCenterInstance
  extends Model<UserFulfillmentCenterAttributes, UserFulfillmentCenterCreationAttributes>,
    UserFulfillmentCenterAttributes {}

const UserFulfillmentCenter = sequelize.define<UserFulfillmentCenterInstance>('UserFulfillmentCenter', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  fc_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'FulfillmentCenters',
      key: 'id',
    },
  },
  role: {
    type: DataTypes.ENUM('MANAGER', 'SUPERVISOR', 'OPERATOR', 'PICKER', 'PACKER', 'VIEWER'),
    allowNull: false,
    defaultValue: 'OPERATOR',
  },
  assigned_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
  tableName: 'UserFulfillmentCenters',
  timestamps: false, // Disable automatic timestamps since we use created_at/updated_at
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'fc_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['fc_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_default']
    }
  ]
});

export default UserFulfillmentCenter;

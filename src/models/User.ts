// models/User.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { UserAttributes, UserCreationAttributes } from '../types';
import Role from './Role';

interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
  Role?: any; // Add Role association
}

const User = sequelize.define<UserInstance>('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
    defaultValue: 3, // Default to WH Staff 1
    field: 'roleId',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  availabilityStatus: {
    type: DataTypes.ENUM('available', 'break', 'off-shift'),
    allowNull: false,
    defaultValue: 'available',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Users',
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

// Associations are set up in models/index.ts

export default User;
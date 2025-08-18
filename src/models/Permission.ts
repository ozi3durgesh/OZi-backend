// models/Permission.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PermissionAttributes {
  id: number;
  module: string;
  action: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
  // Remove public class fields - they shadow Sequelize attributes
  declare id: number;
  declare module: string;
  declare action: string;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Permission.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  description: {
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
  sequelize,
  tableName: 'permissions',
  indexes: [
    { fields: ['module'] },
    { unique: true, fields: ['module', 'action'] },
  ],
});

export default Permission;
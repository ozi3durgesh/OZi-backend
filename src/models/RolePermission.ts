// models/RolePermission.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt: Date;
  updatedAt: Date;
}

class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  // Remove public class fields - they shadow Sequelize attributes
  declare id: number;
  declare roleId: number;
  declare permissionId: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

RolePermission.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id',
    },
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
  tableName: 'role_permissions',
  indexes: [
    { unique: true, fields: ['roleId', 'permissionId'] },
  ],
});

export default RolePermission;
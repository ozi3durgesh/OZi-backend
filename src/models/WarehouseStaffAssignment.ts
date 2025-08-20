import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface WarehouseStaffAssignmentAttributes {
  id: number;
  warehouse_id: number;
  user_id: number;
  role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER';
  assigned_date: Date;
  end_date?: Date;
  is_active: boolean;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseStaffAssignmentCreationAttributes extends Omit<WarehouseStaffAssignmentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class WarehouseStaffAssignment extends Model<WarehouseStaffAssignmentAttributes, WarehouseStaffAssignmentCreationAttributes> implements WarehouseStaffAssignmentAttributes {
  public id!: number;
  public warehouse_id!: number;
  public user_id!: number;
  public role!: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER';
  public assigned_date!: Date;
  public end_date?: Date;
  public is_active!: boolean;
  
  // Audit Fields
  public created_at!: Date;
  public updated_at!: Date;
}

WarehouseStaffAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('MANAGER', 'SUPERVISOR', 'OPERATOR', 'PICKER', 'PACKER'),
      allowNull: false,
    },
    assigned_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'warehouse_staff_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'unique_staff_assignment',
        unique: true,
        fields: ['warehouse_id', 'user_id', 'role'],
      },
    ],
  }
);

export default WarehouseStaffAssignment;

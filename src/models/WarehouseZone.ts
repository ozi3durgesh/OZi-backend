import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface WarehouseZoneAttributes {
  id: number;
  warehouse_id: number;
  zone_code: string;
  zone_name: string;
  zone_type: 'PICKING' | 'STORAGE' | 'RECEIVING' | 'PACKING' | 'SHIPPING' | 'RETURNS';
  temperature_zone: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
  capacity_units?: number;
  current_utilization: number;
  is_active: boolean;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseZoneCreationAttributes extends Omit<WarehouseZoneAttributes, 'id' | 'created_at' | 'updated_at'> {}

class WarehouseZone extends Model<WarehouseZoneAttributes, WarehouseZoneCreationAttributes> implements WarehouseZoneAttributes {
  public id!: number;
  public warehouse_id!: number;
  public zone_code!: string;
  public zone_name!: string;
  public zone_type!: 'PICKING' | 'STORAGE' | 'RECEIVING' | 'PACKING' | 'SHIPPING' | 'RETURNS';
  public temperature_zone!: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
  public capacity_units?: number;
  public current_utilization!: number;
  public is_active!: boolean;
  
  // Audit Fields
  public created_at!: Date;
  public updated_at!: Date;
}

WarehouseZone.init(
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
    zone_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    zone_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    zone_type: {
      type: DataTypes.ENUM('PICKING', 'STORAGE', 'RECEIVING', 'PACKING', 'SHIPPING', 'RETURNS'),
      allowNull: false,
      defaultValue: 'STORAGE',
    },
    temperature_zone: {
      type: DataTypes.ENUM('AMBIENT', 'CHILLED', 'FROZEN', 'CONTROLLED'),
      allowNull: false,
      defaultValue: 'AMBIENT',
    },
    capacity_units: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    current_utilization: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'warehouse_zones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'unique_zone_code',
        unique: true,
        fields: ['warehouse_id', 'zone_code'],
      },
    ],
  }
);

export default WarehouseZone;

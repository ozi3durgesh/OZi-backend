// models/Rider.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { RiderAttributes, RiderCreationAttributes } from '../types';

class Rider extends Model<RiderAttributes, RiderCreationAttributes> implements RiderAttributes {
  declare id: number;
  declare riderCode: string;
  declare name: string;
  declare phone: string;
  declare email?: string;
  declare vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN';
  declare vehicleNumber?: string;
  declare availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'BREAK';
  declare currentLocation?: { lat: number; lng: number };
  declare rating: number;
  declare totalDeliveries: number;
  declare isActive: boolean;
  declare lastActiveAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Rider.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  riderCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  vehicleType: {
    type: DataTypes.ENUM('BIKE', 'SCOOTER', 'CAR', 'VAN'),
    allowNull: false,
  },
  vehicleNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  availabilityStatus: {
    type: DataTypes.ENUM('AVAILABLE', 'BUSY', 'OFFLINE', 'BREAK'),
    allowNull: false,
    defaultValue: 'AVAILABLE',
  },
  currentLocation: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 5.00,
    validate: {
      min: 0,
      max: 5,
    },
  },
  totalDeliveries: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  lastActiveAt: {
    type: DataTypes.DATE,
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
  tableName: 'riders',
  indexes: [
    { fields: ['riderCode'] },
    { fields: ['phone'] },
    { fields: ['email'] },
    { fields: ['availabilityStatus'] },
    { fields: ['vehicleType'] },
    { fields: ['isActive'] },
    { fields: ['rating'] },
  ],
});

export default Rider;

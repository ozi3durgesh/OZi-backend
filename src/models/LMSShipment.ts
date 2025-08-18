// models/LMSShipment.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { LMSShipmentAttributes, LMSShipmentCreationAttributes } from '../types';

class LMSShipment extends Model<LMSShipmentAttributes, LMSShipmentCreationAttributes> implements LMSShipmentAttributes {
  declare id: number;
  declare handoverId: number;
  declare lmsReference: string;
  declare status: 'PENDING' | 'CREATED' | 'MANIFESTED' | 'IN_TRANSIT' | 'DELIVERED';
  declare lmsResponse: any;
  declare retryCount: number;
  declare lastRetryAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

LMSShipment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  handoverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'handovers',
      key: 'id',
    },
  },
  lmsReference: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CREATED', 'MANIFESTED', 'IN_TRANSIT', 'DELIVERED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  lmsResponse: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lastRetryAt: {
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
  tableName: 'lms_shipments',
  indexes: [
    { fields: ['handoverId'] },
    { fields: ['lmsReference'] },
    { fields: ['status'] },
    { fields: ['retryCount'] },
  ],
});

export default LMSShipment;

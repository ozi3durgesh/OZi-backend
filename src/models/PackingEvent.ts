// models/PackingEvent.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { PackingEventAttributes, PackingEventCreationAttributes } from '../types';

class PackingEvent extends Model<PackingEventAttributes, PackingEventCreationAttributes> implements PackingEventAttributes {
  declare id: number;
  declare jobId: number;
  declare eventType: 'PACKING_STARTED' | 'ITEM_PACKED' | 'ITEM_VERIFIED' | 'PACKING_COMPLETED' | 'HANDOVER_ASSIGNED' | 'HANDOVER_CONFIRMED' | 'LMS_SYNCED';
  declare eventData: any;
  declare userId?: number;
  declare timestamp: Date;
  declare createdAt: Date;
}

PackingEvent.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'packing_jobs',
      key: 'id',
    },
  },
  eventType: {
    type: DataTypes.ENUM('PACKING_STARTED', 'ITEM_PACKED', 'ITEM_VERIFIED', 'PACKING_COMPLETED', 'HANDOVER_ASSIGNED', 'HANDOVER_CONFIRMED', 'LMS_SYNCED'),
    allowNull: false,
  },
  eventData: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'packing_events',
  indexes: [
    { fields: ['jobId'] },
    { fields: ['eventType'] },
    { fields: ['userId'] },
    { fields: ['timestamp'] },
    { fields: ['jobId', 'eventType'] },
    { fields: ['jobId', 'timestamp'] },
  ],
});

export default PackingEvent;

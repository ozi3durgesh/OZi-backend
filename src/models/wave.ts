// models/Wave.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Rider from './Rider';

class Wave extends Model {
  declare id: number;
  declare name: string;
  declare riderId: number;
  declare status: 'CREATED' | 'PICKED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED';
  declare handoverBy?: number;
  declare handoverAt?: Date;
  declare handoverPhoto?: string;
  declare dispatchNotes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare rider?: Rider;
}

Wave.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    riderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'riders',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('CREATED', 'PICKED', 'PACKED', 'DISPATCHED', 'DELIVERED'),
      allowNull: false,
      defaultValue: 'CREATED',
    },
    handoverBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    handoverAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    handoverPhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dispatchNotes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'waves',
  }
);

// Associations
Wave.belongsTo(Rider, { as: 'rider', foreignKey: 'riderId' });

export default Wave;
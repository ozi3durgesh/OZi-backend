import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface EcomLogAttributes {
  id: number;
  order_id: number;
  action: string;
  payload: string;
  response: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface EcomLogCreationAttributes {
  order_id: number;
  action: string;
  payload: string;
  response: string;
  status: string;
}

class EcomLog extends Model<EcomLogAttributes, EcomLogCreationAttributes> {
  // Remove all public class field declarations to avoid Sequelize warnings
}

EcomLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
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
  sequelize,
  modelName: 'EcomLog',
  tableName: 'ecom_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default EcomLog;

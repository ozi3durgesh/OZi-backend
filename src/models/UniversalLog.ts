import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface UniversalLogAttributes {
  id: number;
  url: string;
  method: string;
  req: any;
  res: any;
  status_code: number;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  execution_time_ms: number;
  created_at: number;
  endpoint_name?: string;
  module?: string;
  error_message?: string;
  request_size_bytes?: number;
  response_size_bytes?: number;
}

interface UniversalLogCreationAttributes extends Omit<UniversalLogAttributes, 'id'> {}

class UniversalLog extends Model<UniversalLogAttributes, UniversalLogCreationAttributes> {
  // Remove all public class field declarations to avoid Sequelize warnings
}

UniversalLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    comment: 'Full URL that was hit'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'HTTP method (GET, POST, PUT, DELETE, etc.)'
  },
  req: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Complete request data (body, headers, params, query)'
  },
  res: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Complete response data (body, headers, status)'
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'HTTP status code of the response'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID if authenticated'
  },
  ip_address: {
    type: DataTypes.STRING(45), // IPv6 compatible
    allowNull: true,
    comment: 'Client IP address'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Browser/client information'
  },
  execution_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Request execution time in milliseconds'
  },
  created_at: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Unix timestamp when request was processed'
  },
  endpoint_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Human readable endpoint name (e.g., "place_order", "user_login")'
  },
  module: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Module/controller name (e.g., "order", "auth", "user")'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if request failed'
  },
  request_size_bytes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Size of request in bytes'
  },
  response_size_bytes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Size of response in bytes'
  }
}, {
  sequelize,
  tableName: 'universal_log',
  timestamps: false, // We're using custom timestamp fields
  indexes: [
    { fields: ['user_id'] },
    { fields: ['created_at'] },
    { fields: ['method'] },
    { fields: ['status_code'] },
    { fields: ['endpoint_name'] },
    { fields: ['module'] },
    { fields: ['url'] }, // Index on URL field
  ],
  comment: 'Universal logging table for all API requests and responses'
});

export default UniversalLog;

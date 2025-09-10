// models/TokenBlacklist.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface TokenBlacklistAttributes {
  id: number;
  token: string;
  userId: number;
  tokenType: 'access' | 'refresh';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TokenBlacklistCreationAttributes {
  token: string;
  userId: number;
  tokenType: 'access' | 'refresh';
  expiresAt: Date;
}

interface TokenBlacklistInstance
  extends Model<TokenBlacklistAttributes, TokenBlacklistCreationAttributes>,
    TokenBlacklistAttributes {}

const TokenBlacklist = sequelize.define<TokenBlacklistInstance>('TokenBlacklist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  token: {
    type: DataTypes.STRING(767),
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  tokenType: {
    type: DataTypes.ENUM('access', 'refresh'),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
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
  tableName: 'TokenBlacklist',
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

export default TokenBlacklist;

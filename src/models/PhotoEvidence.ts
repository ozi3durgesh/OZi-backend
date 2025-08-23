// models/PhotoEvidence.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { PhotoEvidenceAttributes, PhotoEvidenceCreationAttributes } from '../types';

class PhotoEvidence extends Model<PhotoEvidenceAttributes, PhotoEvidenceCreationAttributes> implements PhotoEvidenceAttributes {
  declare id: number;
  declare jobId: number;
  declare orderId?: number;
  declare photoType: 'PRE_PACK' | 'POST_PACK' | 'SEALED' | 'HANDOVER';
  declare photoUrl: string;
  declare thumbnailUrl?: string;
  declare metadata: {
    timestamp: Date;
    location?: string;
    device?: string;
    coordinates?: { lat: number; lng: number };
  };
  declare verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  declare verifiedBy?: number;
  declare verifiedAt?: Date;
  declare rejectionReason?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PhotoEvidence.init({
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
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  photoType: {
    type: DataTypes.ENUM('PRE_PACK', 'POST_PACK', 'SEALED', 'HANDOVER'),
    allowNull: false,
  },
  photoUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  verificationStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
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
  tableName: 'photo_evidence',
  indexes: [
    { fields: ['jobId'] },
    { fields: ['orderId'] },
    { fields: ['photoType'] },
    { fields: ['verificationStatus'] },
    { fields: ['verifiedBy'] },
    { fields: ['jobId', 'photoType'] },
  ],
});

export default PhotoEvidence;

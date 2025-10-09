import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface DCGrnPhotoAttributes {
  id: number;
  sku_id: string;
  dc_grn_id: number;
  dc_po_id: number;
  url: string;
  reason: string;
  created_at: Date;
  updated_at: Date;
}

export interface DCGrnPhotoCreationAttributes {
  sku_id: string;
  dc_grn_id: number;
  dc_po_id: number;
  url: string;
  reason?: string;
}

class DCGrnPhoto extends Model<DCGrnPhotoAttributes, DCGrnPhotoCreationAttributes> implements DCGrnPhotoAttributes {
  declare id: number;
  declare sku_id: string;
  declare dc_grn_id: number;
  declare dc_po_id: number;
  declare url: string;
  declare reason: string;
  declare created_at: Date;
  declare updated_at: Date;
}

DCGrnPhoto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sku_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    dc_grn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dc_po_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    reason: { 
      type: DataTypes.STRING(100), 
      allowNull: true,
      defaultValue: 'sku-level-photo'
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
  },
  {
    sequelize,
    tableName: 'dc_grn_photos',
    timestamps: false,
    indexes: [
      { fields: ['sku_id'] },
      { fields: ['dc_grn_id'] },
      { fields: ['dc_po_id'] },
      { fields: ['created_at'] }
    ],
  }
);

export default DCGrnPhoto;

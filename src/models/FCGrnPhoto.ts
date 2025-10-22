import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { GRNPhotoAttributes, GRNPhotoCreationAttributes } from '../types';

class GRNPhoto
  extends Model<GRNPhotoAttributes, GRNPhotoCreationAttributes>
  implements GRNPhotoAttributes
{
  public id!: number;
  public sku_id!: string;
  public grn_id!: number;
  public po_id!: number;
  public url!: string;
  public reason!: string;
  public created_at?: Date;
  public updated_at?: Date;
}

GRNPhoto.init(
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
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    po_id: {
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
  },
  {
    sequelize,
    tableName: 'fc_grn_photos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['sku_id'] },
      { fields: ['grn_id'] },
      { fields: ['po_id'] },
      { fields: ['created_at'] }
    ],
  }
);
// Associations are defined in models/index.ts to avoid conflicts
export default GRNPhoto;

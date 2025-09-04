import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { GRNPhotoAttributes, GRNPhotoCreationAttributes } from '../types';
import GRNLine from './GrnLine';
import GRNBatch from './GrnBatch';

class GRNPhoto
  extends Model<GRNPhotoAttributes, GRNPhotoCreationAttributes>
  implements GRNPhotoAttributes
{
  public id!: number;
  public grn_line_id!: number;
  public grn_batch_id!: number;
  public url!: string;
  public reason!: string;
}

GRNPhoto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    grn_batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    reason: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    sequelize,
    tableName: 'grn_photos',
    timestamps: false,
    indexes: [{ fields: ['grn_line_id'] }],
  }
);
// Associations are defined in models/index.ts to avoid conflicts
export default GRNPhoto;

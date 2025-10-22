import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { GRNBatchAttributes, GRNBatchCreationAttributes } from '../types';
import FCGrnLine from './FCGrnLine';

class GRNBatch
  extends Model<GRNBatchAttributes, GRNBatchCreationAttributes>
  implements GRNBatchAttributes
{
  public id!: number;
  public grn_line_id!: number;
  public batch_no!: string;
  public expiry_date!: Date;
  public qty!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

GRNBatch.init(
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
    batch_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    qty: {
      type: DataTypes.INTEGER,
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
  },
  {
    sequelize,
    tableName: 'fc_grn_batches',
    timestamps: false,
    indexes: [{ fields: ['grn_line_id'] }],
  }
);
// Associations are defined in models/index.ts to avoid conflicts

export default GRNBatch;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import DCGrnLine from './DCGrnLine';

export interface DCGrnBatchAttributes {
  id: number;
  dc_grn_line_id: number;
  batch_no: string;
  expiry_date: Date;
  qty: number;
  created_at: Date;
  updated_at: Date;
}

export interface DCGrnBatchCreationAttributes {
  dc_grn_line_id: number;
  batch_no: string;
  expiry_date: Date;
  qty: number;
}

class DCGrnBatch extends Model<DCGrnBatchAttributes, DCGrnBatchCreationAttributes> implements DCGrnBatchAttributes {
  declare id: number;
  declare dc_grn_line_id: number;
  declare batch_no: string;
  declare expiry_date: Date;
  declare qty: number;
  declare created_at: Date;
  declare updated_at: Date;
}

DCGrnBatch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dc_grn_line_id: {
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
    tableName: 'dc_grn_batches',
    timestamps: false,
    indexes: [{ fields: ['dc_grn_line_id'] }],
  }
);

export default DCGrnBatch;

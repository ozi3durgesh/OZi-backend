import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { GRNLineAttributes, GRNLineCreationAttributes } from '../types';
import GRN from './Grn.model';

class GRNLine
  extends Model<GRNLineAttributes, GRNLineCreationAttributes>
  implements GRNLineAttributes
{
  declare id: number;
  declare grn_id: number;
  declare sku_id: string;
  declare ean: string;
  declare ordered_qty: number;
  declare received_qty: number;
  declare rejected_qty: number;
  declare qc_pass_qty: number;
  declare qc_fail_qty: number;
  declare rtv_qty: number;
  declare held_qty: number;
  declare line_status: string;
  declare variance_reason: any | null;
  declare remarks: string | null;
  // public expected_date!: Date;
  // public received_date!: Date;
  // public qc_date!: Date;
  declare created_at: Date;
  declare updated_at: Date;
}

GRNLine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sku_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    ean: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    ordered_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    received_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    rejected_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    qc_pass_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    qc_fail_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    held_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    rtv_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    line_status: {
      type: DataTypes.ENUM('completed', 'partial', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },

    variance_reason: {
      type: DataTypes.ENUM('short', 'excess', 'damage', 'wrong', 'near-expiry'),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    tableName: 'grn_lines',
    timestamps: false,
    indexes: [{ fields: ['grn_id'] }, { fields: ['sku_id'] }],
  }
);

// Associations are defined in models/index.ts to avoid conflicts

export default GRNLine;

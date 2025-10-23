import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import DCGrn from './DCGrn.model';

export interface DCGrnLineAttributes {
  id: number;
  dc_grn_id: number;
  sku_id: string;
  ean?: string;
  ordered_qty: number;
  received_qty: number;
  pending_qty: number;
  rejected_qty: number;
  qc_pass_qty: number;
  qc_fail_qty: number;
  rtv_qty: number;
  held_qty: number;
  line_status: 'completed' | 'partial' | 'pending' | 'rejected';
  putaway_status: string;
  variance_reason?: 'short' | 'excess' | 'damage' | 'wrong' | 'near-expiry' | null;
  remarks?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DCGrnLineCreationAttributes {
  dc_grn_id: number;
  sku_id: string;
  ean?: string;
  ordered_qty: number;
  received_qty: number;
  pending_qty?: number;
  rejected_qty?: number;
  qc_pass_qty?: number;
  qc_fail_qty?: number;
  rtv_qty?: number;
  held_qty?: number;
  line_status?: 'completed' | 'partial' | 'pending' | 'rejected';
  putaway_status?: string;
  variance_reason?: 'short' | 'excess' | 'damage' | 'wrong' | 'near-expiry' | null;
  remarks?: string | null;
}

class DCGrnLine extends Model<DCGrnLineAttributes, DCGrnLineCreationAttributes> implements DCGrnLineAttributes {
  declare id: number;
  declare dc_grn_id: number;
  declare sku_id: string;
  declare ean: string;
  declare ordered_qty: number;
  declare received_qty: number;
  declare pending_qty: number;
  declare rejected_qty: number;
  declare qc_pass_qty: number;
  declare qc_fail_qty: number;
  declare rtv_qty: number;
  declare held_qty: number;
  declare line_status: 'completed' | 'partial' | 'pending';
  declare putaway_status: string;
  declare variance_reason: 'short' | 'excess' | 'damage' | 'wrong' | 'near-expiry' | null;
  declare remarks: string | null;
  declare created_at: Date;
  declare updated_at: Date;
}

DCGrnLine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dc_grn_id: {
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
    pending_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
      type: DataTypes.ENUM('completed', 'partial', 'pending', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    putaway_status: {
      type: DataTypes.STRING(50),
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
    tableName: 'dc_grn_lines',
    timestamps: false,
    indexes: [{ fields: ['dc_grn_id'] }, { fields: ['sku_id'] }],
  }
);

export default DCGrnLine;

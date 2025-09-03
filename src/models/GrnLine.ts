import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { GRNLineAttributes, GRNLineCreationAttributes } from '../types';
import GRN from './Grn.model';

class GRNLine
  extends Model<GRNLineAttributes, GRNLineCreationAttributes>
  implements GRNLineAttributes
{
  public id!: number;
  public grn_id!: number;
  public sku_id!: string;
  public ean!: string;
  public ordered_qty!: number;
  public received_qty!: number;
  public qc_pass_qty!: number;
  public qc_fail_qty!: number;
  public rtv_qty!: number;
  public held_qty!: number;
  public line_status!: string;
  public variance_reason!: any | null;
  public remarks!: string | null;
  // public expected_date!: Date;
  // public received_date!: Date;
  // public qc_date!: Date;
  public created_at!: Date;
  public updated_at!: Date;
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
      type: DataTypes.STRING(13),
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
      type: DataTypes.ENUM('completed', 'variance', 'pending'),
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

GRNLine.belongsTo(GRN, { foreignKey: 'grn_id', as: 'GrnId' });
GRN.hasMany(GRNLine, { foreignKey: 'grn_id', as: 'Line' });

export default GRNLine;

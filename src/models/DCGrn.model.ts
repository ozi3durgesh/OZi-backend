import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import DCPurchaseOrder from './DCPurchaseOrder';

export interface DCGrnAttributes {
  id: number;
  dc_po_id: number;
  status: 'partial' | 'completed' | 'closed' | 'pending-qc' | 'variance-review' | 'rtv-initiated';
  closeReason?: string | null;
  created_by: number;
  approved_by?: number | null;
  created_at: Date;
  updated_at: Date;
  dc_id?: number;
}

export interface DCGrnCreationAttributes {
  dc_po_id: number;
  status?: 'partial' | 'completed' | 'closed' | 'pending-qc' | 'variance-review' | 'rtv-initiated';
  closeReason?: string | null;
  created_by: number;
  approved_by?: number | null;
  dc_id?: number;
}

class DCGrn extends Model<DCGrnAttributes, DCGrnCreationAttributes> implements DCGrnAttributes {
  declare id: number;
  declare dc_po_id: number;
  declare status: 'partial' | 'completed' | 'closed' | 'pending-qc' | 'variance-review' | 'rtv-initiated';
  declare closeReason: string | null;
  declare created_by: number;
  declare approved_by: number | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare dc_id: number;
}

DCGrn.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    dc_po_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        'partial',
        'completed',
        'closed',
        'pending-qc',
        'variance-review',
        'rtv-initiated'
      ),
      defaultValue: 'partial',
    },
    closeReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'close_reason',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    approved_by: {
      type: DataTypes.INTEGER,
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
    dc_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'distribution_centers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
  },
  {
    sequelize,
    tableName: 'dc_grns',
    timestamps: false,
    indexes: [{ fields: ['dc_po_id'] }, { fields: ['status'] }, { fields: ['dc_id'] }],
  }
);

export default DCGrn;

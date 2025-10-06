import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import { GRNAttributes, GRNCreationAttributes } from '../types/index';
import PurchaseOrder from './PurchaseOrder';

class GRN
  extends Model<GRNAttributes, GRNCreationAttributes>
  implements GRNAttributes
{
  declare id: number;
  declare po_id: number;

  declare status:
    | 'partial'
    | 'completed'
    | 'closed'
    | 'pending-qc'
    | 'variance-review'
    | 'rtv-initiated';
  declare created_by: number;
  public closeReason!: string | null;
  declare approved_by: number | null;
  declare created_at: Date;
  declare updated_at: Date;
  
  // FC mapping
  declare fc_id?: number;
}

GRN.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.INTEGER, allowNull: false },
    // vendor: { type: DataTypes.STRING(100), allowNull: false },

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
    },

    // expected_date: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   defaultValue: DataTypes.NOW,
    // },
    // received_date: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   defaultValue: DataTypes.NOW,
    // },
    // qc_date: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   defaultValue: DataTypes.NOW,
    // },
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
    
    // FC mapping
    fc_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fulfillment_centers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
  },
  {
    sequelize,
    tableName: 'grns',
    timestamps: false,
    indexes: [{ fields: ['po_id'] }, { fields: ['status'] }],
  }
);
// Associations are defined in models/index.ts to avoid conflicts
export default GRN;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import { GRNAttributes, GRNCreationAttributes } from '../types/index';

class GRN
  extends Model<GRNAttributes, GRNCreationAttributes>
  implements GRNAttributes
{
  public id!: number;
  public po_id!: number;
  public vendor!: string;
  public status!:
    | 'partial'
    | 'completed'
    | 'closed'
    | 'pending-qc'
    | 'variance-review'
    | 'rtv-initiated';
  public created_by!: number;
  public approved_by!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

GRN.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.INTEGER, allowNull: false },
    vendor: { type: DataTypes.STRING(100), allowNull: false },
    status: {
      type: DataTypes.ENUM('in-progress', 'completed', 'closed'),
      defaultValue: 'in-progress',
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
  },
  {
    sequelize,
    tableName: 'grns',
    timestamps: false,
    indexes: [{ fields: ['po_id'] }, { fields: ['status'] }],
  }
);

GRN.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedBy' });
GRN.belongsTo(User, { foreignKey: 'approved_by', as: 'ApprovedBy' });
User.hasMany(GRN, { foreignKey: 'created_by', as: 'CreatedGrns' });
User.hasMany(GRN, { foreignKey: 'approved_by', as: 'ApprovedGrns' });
export default GRN;

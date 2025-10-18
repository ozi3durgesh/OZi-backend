import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

interface FCPOApprovalAttributes {
  id: CreationOptional<number>;
  fcPOId: number;
  approverId: number;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  comments?: string;
  approvedAt?: Date;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

class FCPOApproval extends Model<
  InferAttributes<FCPOApproval>,
  InferCreationAttributes<FCPOApproval>
> {
  declare id: CreationOptional<number>;
  declare fcPOId: number;
  declare approverId: number;
  declare status: 'APPROVED' | 'REJECTED' | 'PENDING';
  declare comments?: string;
  declare approvedAt?: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FCPOApproval.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fcPOId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'fc_po_id',
      references: {
        model: 'fc_purchase_orders',
        key: 'id',
      },
    },
    approverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'approver_id',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('APPROVED', 'REJECTED', 'PENDING'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'FCPOApproval',
    tableName: 'fc_po_approvals',
    timestamps: true,
  }
);

export default FCPOApproval;

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class DCPOApproval extends Model<
  InferAttributes<DCPOApproval>,
  InferCreationAttributes<DCPOApproval>
> {
  declare id: CreationOptional<number>;
  declare dcPOId: number;
  declare approverRole: string;
  declare approverId: number | null;
  declare approverEmail: string | null;
  declare action: string; // 'APPROVED', 'REJECTED', 'PENDING'
  declare comments: string | null;
  declare approvedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DCPOApproval.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dcPOId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dc_purchase_orders',
        key: 'id',
      },
    },
    approverRole: {
      type: DataTypes.ENUM('creator', 'category_head', 'admin', 'founder', 'direct_approval'),
      allowNull: false,
    },
    approverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    approverEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    action: {
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
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'DCPOApproval',
    tableName: 'dc_po_approvals',
    timestamps: true,
  }
);

// Export helper type for creation
export type DCPOApprovalCreationAttributes = InferCreationAttributes<DCPOApproval>;

export default DCPOApproval;

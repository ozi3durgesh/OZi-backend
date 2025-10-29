import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';
import FCPOSkuMatrix from './FCPOSkuMatrix';
import FCPOApproval from './FCPOApproval';
import User from './User';
import FulfillmentCenter from './FulfillmentCenter';
import DistributionCenter from './DistributionCenter';

interface FCPurchaseOrderAttributes {
  id: CreationOptional<number>;
  poId: string;
  fcId: number;
  dcId: number;
  totalAmount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description?: string;
  notes?: string;
  approvedBy?: number;
  rejectedBy?: number;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdBy: number;
  updatedBy?: number;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

class FCPurchaseOrder extends Model<
  InferAttributes<FCPurchaseOrder>,
  InferCreationAttributes<FCPurchaseOrder>
> {
  declare id: CreationOptional<number>;
  declare poId: string;
  declare fcId: number;
  declare dcId: number;
  declare totalAmount: number;
  declare status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  declare priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  declare description?: string;
  declare notes?: string;
  declare approvedBy?: number;
  declare rejectedBy?: number;
  declare approvedAt?: Date;
  declare rejectedAt?: Date;
  declare rejectionReason?: string;
  declare createdBy: number;
  declare updatedBy?: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Association properties
  declare SkuMatrix?: FCPOSkuMatrix[];
  declare Approvals?: FCPOApproval[];
  declare CreatedBy?: typeof User;
  declare UpdatedBy?: typeof User;
  declare ApprovedBy?: typeof User;
  declare RejectedBy?: typeof User;
  declare FulfillmentCenter?: typeof FulfillmentCenter;
  declare DistributionCenter?: typeof DistributionCenter;
}

FCPurchaseOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    poId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'po_id',
    },
    fcId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'fc_id',
      references: {
        model: 'FulfillmentCenters',
        key: 'id',
      },
    },
    dcId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dc_id',
      references: {
        model: 'DistributionCenters',
        key: 'id',
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'total_amount',
    },
    status: {
      type: DataTypes.ENUM(
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'rejected_by',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rejected_at',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'updated_by',
      references: {
        model: 'Users',
        key: 'id',
      },
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
    modelName: 'FCPurchaseOrder',
    tableName: 'fc_purchase_orders',
    timestamps: true,
  }
);

export default FCPurchaseOrder;

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class DCPurchaseOrder extends Model<
  InferAttributes<DCPurchaseOrder>,
  InferCreationAttributes<DCPurchaseOrder>
> {
  declare id: CreationOptional<number>;
  declare poId: string;
  declare vendorId: number;
  declare dcId: number;
  declare totalAmount: number;
  declare status: string;
  declare priority: string;
  declare description: string | null;
  declare notes: string | null;
  declare approvedBy: number | null;
  declare rejectedBy: number | null;
  declare approvedAt: Date | null;
  declare rejectedAt: Date | null;
  declare rejectionReason: string | null;
  declare final_delivery_date: Date | null;
  declare pi_notes: string | null;
  declare pi_file_url: string | null;
  declare createdBy: number;
  declare updatedBy: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare isEdited: boolean | false;
}

DCPurchaseOrder.init(
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
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendor_dc',
        key: 'id',
      },
    },
    dcId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DistributionCenters',
        key: 'id',
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    status: {
      type: DataTypes.ENUM(
        'DRAFT',
        'PENDING_CATEGORY_HEAD',
        'PENDING_ADMIN',
        'PENDING_CREATOR_REVIEW',
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
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    final_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pi_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pi_file_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
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
    isEdited:{
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false

    }
  },
  {
    sequelize,
    modelName: 'DCPurchaseOrder',
    tableName: 'dc_purchase_orders',
    timestamps: true,
  }
);

// Export helper type for creation
export type DCPurchaseOrderCreationAttributes = InferCreationAttributes<DCPurchaseOrder>;

export default DCPurchaseOrder;

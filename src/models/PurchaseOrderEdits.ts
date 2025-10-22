import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class PurchaseOrderEdit extends Model<
  InferAttributes<PurchaseOrderEdit>,
  InferCreationAttributes<PurchaseOrderEdit>
> {
  declare id: CreationOptional<number>;
  declare purchase_order_id: number;
  declare poId: string;
  declare vendor_id: number;
  declare dc_id: number;
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
}

PurchaseOrderEdit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'dc_purchase_orders', key: 'id' },
      onDelete: 'CASCADE',
    },
    poId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      defaultValue: 'PENDING_CATEGORY_HEAD',
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
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    },
    updatedBy: {
      type: DataTypes.INTEGER,
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
    tableName: 'purchase_order_edits',
    timestamps: true,
  }
);

export default PurchaseOrderEdit;

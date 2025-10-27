// models/credit_note.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class CreditNote extends Model {
  declare id: number;
  declare vendorId: number;
  declare dcPurchaseOrderId: number | null;
  declare paymentTransactionId: number | null;
  declare creditNoteNumber: string;
  declare creditAmount: number;
  declare reason: string | null;
  declare status: "PENDING" | "APPROVED" | "APPLIED" | "CANCELLED";
  declare appliedToFuturePOId: number | null;
  declare createdBy: number | null;
  declare approvedBy: number | null;
}

CreditNote.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "vendor_id",
    },
    dcPurchaseOrderId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "dc_purchase_order_id",
      references: { model: "dc_purchase_orders", key: "id" },
      onDelete: "SET NULL",
    },
    paymentTransactionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "payment_transaction_id",
      references: { model: "payment_transaction", key: "id" },
      onDelete: "SET NULL",
    },
    creditNoteNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "credit_note_number",
    },
    creditAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "credit_amount",
      get() {
        const val = this.getDataValue("creditAmount");
        return val ? Number(val) : 0;
      },
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "reason",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "APPLIED", "CANCELLED"),
      defaultValue: "APPROVED",
      field: "status",
    },
    appliedToFuturePOId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "applied_to_future_po_id",
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "created_by",
    },
    approvedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "approved_by",
    },
  },
  {
    sequelize,
    tableName: "credit_note",
    timestamps: true,
    underscored: true, // ✅ makes created_at, updated_at snake_case
  }
);

export default CreditNote;

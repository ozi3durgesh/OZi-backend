// models/CreditNote.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class CreditNote extends Model {
    declare amount: Number
}

CreditNote.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    vendorId: { type: DataTypes.BIGINT, allowNull: false },
    purchaseOrderId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "purchase_order", key: "id" },
    },
    paymentTransactionId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "payment_transaction", key: "id" },
    },

    creditNoteNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: true },

    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "APPLIED", "CANCELLED"),
      defaultValue: "APPROVED",
    },

    appliedToFuturePOId: { type: DataTypes.BIGINT, allowNull: true },

    createdBy: { type: DataTypes.BIGINT, allowNull: true },
    approvedBy: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    sequelize,
    tableName: "credit_note",
    timestamps: true,
  }
);

export default CreditNote;

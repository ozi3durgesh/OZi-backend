// models/PaymentTransaction.js
import { CreationOptional, DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class PaymentTransaction extends Model {
    declare id: CreationOptional<number>
}

PaymentTransaction.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    purchaseOrderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "purchase_order", key: "id" },
    },
    vendorId: { type: DataTypes.BIGINT, allowNull: false },

    paymentMode: {
      type: DataTypes.ENUM("CASH", "UPI", "BANK_TRANSFER", "CHEQUE"),
      allowNull: false,
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    utrNumber: { type: DataTypes.STRING, allowNull: true },
    receiptUrl: { type: DataTypes.STRING, allowNull: true },

    status: {
      type: DataTypes.ENUM("INITIATED", "SUCCESS", "FAILED", "REVERSED"),
      defaultValue: "INITIATED",
    },

    remarks: { type: DataTypes.STRING, allowNull: true },
    transactionDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    createdBy: { type: DataTypes.BIGINT, allowNull: true },
    updatedBy: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    sequelize,
    tableName: "payment_transaction",
    timestamps: true,
  }
);

export default PaymentTransaction;

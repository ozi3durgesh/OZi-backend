// models/payment_transaction.ts
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database.js";

class PaymentTransaction extends Model<
  InferAttributes<PaymentTransaction>,
  InferCreationAttributes<PaymentTransaction>
> {
  declare id: CreationOptional<number>;
  declare dcPurchaseOrderId: number;
  declare vendorId: number;
  declare paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
  declare amount: number;
  declare utrNumber: string | null;
  declare receiptUrl: string | null;
  declare status: "INITIATED" | "SUCCESS" | "FAILED" | "REVERSED";
  declare remarks: string | null;
  declare transactionDate?: Date;
  declare createdBy: number | null;
  declare updatedBy: number | null;
}

PaymentTransaction.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    dcPurchaseOrderId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "dc_purchase_order_id", // 👈 maps camelCase → snake_case
      references: { model: "dc_purchase_orders", key: "id" },
      onDelete: "CASCADE",
    },
    vendorId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "vendor_id",
    },
    paymentMode: {
      type: DataTypes.ENUM("CASH", "UPI", "BANK_TRANSFER", "CHEQUE"),
      allowNull: false,
      field: "payment_mode",
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue("amount");
        return val === null ? 0 : Number(val);
      },
    },
    utrNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "utr_number",
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "receipt_url",
    },
    status: {
      type: DataTypes.ENUM("INITIATED", "SUCCESS", "FAILED", "REVERSED"),
      defaultValue: "INITIATED",
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "transaction_date",
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "created_by",
    },
    updatedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "updated_by",
    },
  },
  {
    sequelize,
    tableName: "payment_transaction",
    timestamps: true,
    underscored: true, // ✅ created_at / updated_at in DB
    // 🧠 Override JSON output to always be camelCase
    defaultScope: {
      attributes: { exclude: ["created_by", "updated_by"] },
    },
  }
);

export default PaymentTransaction;

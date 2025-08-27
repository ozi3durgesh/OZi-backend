import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface OrderTransactionAttributes {
  id: number;
  order_id: number;
  payment_for?: string;
  payer_id?: number;
  payment_receiver_id?: number;
  payment_status?: string;
  payment_method?: string;
  amount: number;
  transaction_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderTransactionCreationAttributes extends Omit<OrderTransactionAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: number;
}

class OrderTransaction extends Model<OrderTransactionAttributes, OrderTransactionCreationAttributes> implements OrderTransactionAttributes {
  public id!: number;
  public order_id!: number;
  public payment_for!: string;
  public payer_id!: number;
  public payment_receiver_id!: number;
  public payment_status!: string;
  public payment_method!: string;
  public amount!: number;
  public transaction_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrderTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    payment_for: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    payment_receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'order_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default OrderTransaction;

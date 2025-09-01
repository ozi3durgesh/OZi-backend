import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface OrderPaymentAttributes {
  id: number;
  order_id: number;
  transaction_ref?: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderPaymentCreationAttributes extends Omit<OrderPaymentAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: number;
}

class OrderPayment extends Model<OrderPaymentAttributes, OrderPaymentCreationAttributes> implements OrderPaymentAttributes {
  public id!: number;
  public order_id!: number;
  public transaction_ref!: string;
  public amount!: number;
  public payment_status!: string;
  public payment_method!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrderPayment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    transaction_ref: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    tableName: 'order_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default OrderPayment;

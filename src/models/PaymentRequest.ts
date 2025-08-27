import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

export interface PaymentRequestAttributes {
  id: string;
  payment_order_id?: string;
  payer_id?: string;
  receiver_id?: string;
  payment_amount: number;
  gateway_callback_url?: string;
  success_hook?: string;
  failure_hook?: string;
  transaction_id?: string;
  currency_code: string;
  payment_method?: string;
  additional_data?: any;
  is_paid: boolean;
  payer_information?: any;
  external_redirect_link?: string;
  receiver_information?: any;
  attribute_id?: string;
  attribute?: string;
  payment_platform?: string;
  order_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface PaymentRequestCreationAttributes extends Omit<PaymentRequestAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

class PaymentRequest extends Model<PaymentRequestAttributes, PaymentRequestCreationAttributes> implements PaymentRequestAttributes {
  declare id: string;
  declare payment_order_id?: string;
  declare payer_id?: string;
  declare receiver_id?: string;
  declare payment_amount: number;
  declare gateway_callback_url?: string;
  declare success_hook?: string;
  declare failure_hook?: string;
  declare transaction_id?: string;
  declare currency_code: string;
  declare payment_method?: string;
  declare additional_data?: any;
  declare is_paid: boolean;
  declare payer_information?: any;
  declare external_redirect_link?: string;
  declare receiver_information?: any;
  declare attribute_id?: string;
  declare attribute?: string;
  declare payment_platform?: string;
  declare order_id?: number;
  declare created_at?: Date;
  declare updated_at?: Date;
}

PaymentRequest.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    payment_order_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payer_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    receiver_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    payment_amount: {
      type: DataTypes.DECIMAL(24, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    gateway_callback_url: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    success_hook: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    failure_hook: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    currency_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'USD',
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    additional_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    payer_information: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    external_redirect_link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    receiver_information: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    attribute_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    attribute: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_platform: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
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
    tableName: 'payment_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default PaymentRequest;

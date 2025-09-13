import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class DeliveryMan extends Model {
  declare id: number;
  declare f_name: string | null;
  declare l_name: string | null;
  declare phone: string;
  declare email: string | null;
  declare identity_number: string | null;
  declare identity_type: string | null;
  declare identity_image: string | null;
  declare image: string | null;
  declare password: string;
  declare auth_token: string | null;
  declare fcm_token: string | null;
  declare zone_id: number | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare status: boolean;
  declare active: boolean;
  declare earning: boolean;
  declare current_orders: number;
  declare type: string;
  declare store_id: number | null;
  declare application_status: 'approved' | 'denied' | 'pending';
  declare order_count: number;
  declare assigned_order_count: number;
  declare vehicle_id: number | null;
}

DeliveryMan.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    f_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    l_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    identity_number: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    identity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    identity_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    auth_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fcm_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    zone_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    earning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    current_orders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    type: {
      type: DataTypes.STRING(191),
      allowNull: false,
      defaultValue: 'zone_wise',
    },
    store_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    application_status: {
      type: DataTypes.ENUM('approved', 'denied', 'pending'),
      allowNull: false,
      defaultValue: 'approved',
    },
    order_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    assigned_order_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    vehicle_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'DeliveryMan',
    tableName: 'delivery_men',
    timestamps: false,
    underscored: true,
  }
);

export default DeliveryMan;

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database'; // Assuming you have a sequelize instance

class DeliveryMan extends Model {
  public id!: number;
  public f_name!: string;
  public l_name!: string;
  public phone!: string;
  public email!: string;
  public identity_number!: string;
  public identity_type!: string;
  public identity_image!: string;
  public image!: string;
  public password!: string;
  public auth_token!: string;
  public fcm_token!: string;
  public zone_id!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public status!: boolean;
  public active!: boolean;
  public earning!: boolean;
  public current_orders!: number;
  public type!: string;
  public store_id!: number | null;
  public application_status!: 'approved' | 'denied' | 'pending';
  public order_count!: number;
  public assigned_order_count!: number;
  public vehicle_id!: number | null;
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
    sequelize,  // Pass in your sequelize instance
    modelName: 'DeliveryMan',
    tableName: 'delivery_men',  // Name of the table in your DB
    timestamps: false,  // Disable automatic `createdAt` and `updatedAt` fields
    underscored: true,  // To use snake_case for column names
  }
);

export default DeliveryMan;

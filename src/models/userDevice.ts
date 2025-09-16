// models/userDevice.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface UserDeviceAttributes {
  id: number;
  userId: number;
  deviceToken: string;
  snsEndpointArn: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDeviceCreationAttributes
  extends Optional<UserDeviceAttributes, "id"> {}

export interface UserDeviceInstance
  extends Model<UserDeviceAttributes, UserDeviceCreationAttributes>,
    UserDeviceAttributes {} // 👈 this is already exported

const UserDevice = sequelize.define<UserDeviceInstance>("UserDevice", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deviceToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  snsEndpointArn: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: "user_device",
});

export default UserDevice;

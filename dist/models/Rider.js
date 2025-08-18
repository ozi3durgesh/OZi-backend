"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Rider extends sequelize_1.Model {
}
Rider.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    riderCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    vehicleType: {
        type: sequelize_1.DataTypes.ENUM('BIKE', 'SCOOTER', 'CAR', 'VAN'),
        allowNull: false,
    },
    vehicleNumber: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    availabilityStatus: {
        type: sequelize_1.DataTypes.ENUM('AVAILABLE', 'BUSY', 'OFFLINE', 'BREAK'),
        allowNull: false,
        defaultValue: 'AVAILABLE',
    },
    currentLocation: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    rating: {
        type: sequelize_1.DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 5.00,
        validate: {
            min: 0,
            max: 5,
        },
    },
    totalDeliveries: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    lastActiveAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default,
    tableName: 'riders',
    indexes: [
        { fields: ['riderCode'] },
        { fields: ['phone'] },
        { fields: ['email'] },
        { fields: ['availabilityStatus'] },
        { fields: ['vehicleType'] },
        { fields: ['isActive'] },
        { fields: ['rating'] },
    ],
});
exports.default = Rider;

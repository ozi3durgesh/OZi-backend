"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Role_1 = __importDefault(require("./Role"));
const User = database_1.default.define('User', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    roleId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Role_1.default,
            key: 'id',
        },
        defaultValue: 3,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    availabilityStatus: {
        type: sequelize_1.DataTypes.ENUM('available', 'break', 'off-shift'),
        allowNull: false,
        defaultValue: 'available',
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
});
exports.default = User;

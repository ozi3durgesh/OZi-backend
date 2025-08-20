"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PickingWave extends sequelize_1.Model {
}
PickingWave.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    waveNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('GENERATED', 'ASSIGNED', 'PICKING', 'PACKING', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'GENERATED',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM',
    },
    pickerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    assignedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    startedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    totalOrders: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalItems: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    estimatedDuration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
    },
    slaDeadline: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    routeOptimization: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    fefoRequired: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    tagsAndBags: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    tableName: 'picking_waves',
    indexes: [
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['pickerId'] },
        { fields: ['slaDeadline'] },
        { fields: ['waveNumber'] },
    ],
});
exports.default = PickingWave;

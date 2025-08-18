"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PickingException extends sequelize_1.Model {
}
PickingException.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    waveId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'picking_waves',
            key: 'id',
        },
    },
    orderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id',
        },
    },
    sku: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    exceptionType: {
        type: sequelize_1.DataTypes.ENUM('OOS', 'DAMAGED', 'EXPIRY', 'WRONG_LOCATION', 'QUANTITY_MISMATCH', 'OTHER'),
        allowNull: false,
    },
    severity: {
        type: sequelize_1.DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        allowNull: false,
        defaultValue: 'MEDIUM',
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    reportedBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    reportedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'),
        allowNull: false,
        defaultValue: 'OPEN',
    },
    assignedTo: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    resolution: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    resolvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    resolutionPhoto: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    slaDeadline: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
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
    tableName: 'picking_exceptions',
    indexes: [
        { fields: ['waveId'] },
        { fields: ['orderId'] },
        { fields: ['status'] },
        { fields: ['severity'] },
        { fields: ['reportedBy'] },
        { fields: ['assignedTo'] },
        { fields: ['slaDeadline'] },
    ],
});
exports.default = PickingException;

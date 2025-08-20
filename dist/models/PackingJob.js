"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PackingJob extends sequelize_1.Model {
}
PackingJob.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    jobNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    waveId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'picking_waves',
            key: 'id',
        },
    },
    packerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'PACKING', 'VERIFYING', 'COMPLETED', 'CANCELLED', 'AWAITING_HANDOVER', 'HANDOVER_ASSIGNED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM',
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
    handoverAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    totalItems: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    packedItems: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    verifiedItems: {
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
    workflowType: {
        type: sequelize_1.DataTypes.ENUM('PICKER_PACKS', 'DEDICATED_PACKER'),
        allowNull: false,
        defaultValue: 'DEDICATED_PACKER',
    },
    specialInstructions: {
        type: sequelize_1.DataTypes.TEXT,
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
    tableName: 'packing_jobs',
    indexes: [
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['packerId'] },
        { fields: ['waveId'] },
        { fields: ['slaDeadline'] },
        { fields: ['jobNumber'] },
        { fields: ['workflowType'] },
    ],
});
exports.default = PackingJob;

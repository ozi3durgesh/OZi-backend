"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Handover extends sequelize_1.Model {
}
Handover.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    jobId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'packing_jobs',
            key: 'id',
        },
    },
    riderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'riders',
            key: 'id',
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'ASSIGNED',
    },
    assignedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    confirmedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    pickedUpAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    deliveredAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    cancellationReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    cancellationBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    lmsSyncStatus: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'SYNCED', 'FAILED', 'RETRY'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    lmsSyncAttempts: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    lmsLastSyncAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lmsErrorMessage: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    trackingNumber: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    manifestNumber: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
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
    tableName: 'handovers',
    indexes: [
        { fields: ['jobId'] },
        { fields: ['riderId'] },
        { fields: ['status'] },
        { fields: ['lmsSyncStatus'] },
        { fields: ['assignedAt'] },
        { fields: ['trackingNumber'] },
        { fields: ['manifestNumber'] },
    ],
});
exports.default = Handover;

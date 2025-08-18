"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PackingEvent extends sequelize_1.Model {
}
PackingEvent.init({
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
    eventType: {
        type: sequelize_1.DataTypes.ENUM('PACKING_STARTED', 'ITEM_PACKED', 'ITEM_VERIFIED', 'PACKING_COMPLETED', 'HANDOVER_ASSIGNED', 'HANDOVER_CONFIRMED', 'LMS_SYNCED'),
        allowNull: false,
    },
    eventData: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default,
    tableName: 'packing_events',
    indexes: [
        { fields: ['jobId'] },
        { fields: ['eventType'] },
        { fields: ['userId'] },
        { fields: ['timestamp'] },
        { fields: ['jobId', 'eventType'] },
        { fields: ['jobId', 'timestamp'] },
    ],
});
exports.default = PackingEvent;

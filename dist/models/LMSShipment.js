"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class LMSShipment extends sequelize_1.Model {
}
LMSShipment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    handoverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'handovers',
            key: 'id',
        },
    },
    lmsReference: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'CREATED', 'MANIFESTED', 'IN_TRANSIT', 'DELIVERED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    lmsResponse: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    retryCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    lastRetryAt: {
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
    tableName: 'lms_shipments',
    indexes: [
        { fields: ['handoverId'] },
        { fields: ['lmsReference'] },
        { fields: ['status'] },
        { fields: ['retryCount'] },
    ],
});
exports.default = LMSShipment;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PicklistItem extends sequelize_1.Model {
}
PicklistItem.init({
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
    productName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    binLocation: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    pickedQuantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'PICKING', 'PICKED', 'PARTIAL', 'OOS', 'DAMAGED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    fefoBatch: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    expiryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    scanSequence: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    partialReason: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    partialPhoto: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    pickedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    pickedBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    notes: {
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
    tableName: 'picklist_items',
    indexes: [
        { fields: ['waveId'] },
        { fields: ['orderId'] },
        { fields: ['sku'] },
        { fields: ['binLocation'] },
        { fields: ['status'] },
        { fields: ['fefoBatch'] },
        { fields: ['expiryDate'] },
    ],
});
exports.default = PicklistItem;

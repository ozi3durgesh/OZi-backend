"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Seal extends sequelize_1.Model {
}
Seal.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sealNumber: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    jobId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'packing_jobs',
            key: 'id',
        },
    },
    orderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'orders',
            key: 'id',
        },
    },
    sealType: {
        type: sequelize_1.DataTypes.ENUM('PLASTIC', 'PAPER', 'METAL', 'ELECTRONIC'),
        allowNull: false,
    },
    appliedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    appliedBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    verificationStatus: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'VERIFIED', 'TAMPERED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    verifiedBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    tamperEvidence: {
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
    tableName: 'seals',
    indexes: [
        { fields: ['sealNumber'] },
        { fields: ['jobId'] },
        { fields: ['orderId'] },
        { fields: ['sealType'] },
        { fields: ['verificationStatus'] },
        { fields: ['appliedBy'] },
        { fields: ['verifiedBy'] },
    ],
});
exports.default = Seal;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PhotoEvidence extends sequelize_1.Model {
}
PhotoEvidence.init({
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
    orderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'orders',
            key: 'id',
        },
    },
    photoType: {
        type: sequelize_1.DataTypes.ENUM('PRE_PACK', 'POST_PACK', 'SEALED', 'HANDOVER'),
        allowNull: false,
    },
    photoUrl: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    thumbnailUrl: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    verificationStatus: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
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
    rejectionReason: {
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
    tableName: 'photo_evidence',
    indexes: [
        { fields: ['jobId'] },
        { fields: ['orderId'] },
        { fields: ['photoType'] },
        { fields: ['verificationStatus'] },
        { fields: ['verifiedBy'] },
        { fields: ['jobId', 'photoType'] },
    ],
});
exports.default = PhotoEvidence;

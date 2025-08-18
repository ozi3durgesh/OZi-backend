"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Permission extends sequelize_1.Model {
}
Permission.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    module: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    action: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.STRING(255),
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
    tableName: 'permissions',
    indexes: [
        { fields: ['module'] },
        { unique: true, fields: ['module', 'action'] },
    ],
});
exports.default = Permission;

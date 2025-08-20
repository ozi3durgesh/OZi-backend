"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class WarehouseStaffAssignment extends sequelize_1.Model {
    id;
    warehouse_id;
    user_id;
    role;
    assigned_date;
    end_date;
    is_active;
    created_at;
    updated_at;
}
WarehouseStaffAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    warehouse_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('MANAGER', 'SUPERVISOR', 'OPERATOR', 'PICKER', 'PACKER'),
        allowNull: false,
    },
    assigned_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    end_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.Sequelize.literal('CURRENT_TIMESTAMP'),
    },
}, {
    sequelize: database_1.default,
    tableName: 'warehouse_staff_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'unique_staff_assignment',
            unique: true,
            fields: ['warehouse_id', 'user_id', 'role'],
        },
    ],
});
exports.default = WarehouseStaffAssignment;

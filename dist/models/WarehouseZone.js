"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class WarehouseZone extends sequelize_1.Model {
    id;
    warehouse_id;
    zone_code;
    zone_name;
    zone_type;
    temperature_zone;
    capacity_units;
    current_utilization;
    is_active;
    created_at;
    updated_at;
}
WarehouseZone.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    warehouse_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    zone_code: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    zone_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    zone_type: {
        type: sequelize_1.DataTypes.ENUM('PICKING', 'STORAGE', 'RECEIVING', 'PACKING', 'SHIPPING', 'RETURNS'),
        allowNull: false,
        defaultValue: 'STORAGE',
    },
    temperature_zone: {
        type: sequelize_1.DataTypes.ENUM('AMBIENT', 'CHILLED', 'FROZEN', 'CONTROLLED'),
        allowNull: false,
        defaultValue: 'AMBIENT',
    },
    capacity_units: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    current_utilization: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    tableName: 'warehouse_zones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'unique_zone_code',
            unique: true,
            fields: ['warehouse_id', 'zone_code'],
        },
    ],
});
exports.default = WarehouseZone;

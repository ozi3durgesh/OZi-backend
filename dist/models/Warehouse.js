"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Warehouse extends sequelize_1.Model {
    id;
    warehouse_code;
    name;
    type;
    status;
    address;
    city;
    state;
    country;
    pincode;
    latitude;
    longitude;
    contact_person;
    contact_email;
    contact_phone;
    emergency_contact;
    operational_hours;
    capacity_sqft;
    storage_capacity_units;
    current_utilization_percentage;
    services_offered;
    supported_fulfillment_types;
    is_auto_assignment_enabled;
    max_orders_per_day;
    sla_hours;
    lms_warehouse_id;
    integration_status;
    created_by;
    updated_by;
    created_at;
    updated_at;
}
Warehouse.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    warehouse_code: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('MAIN', 'SATELLITE', 'STOREFRONT', 'DISTRIBUTION'),
        allowNull: false,
        defaultValue: 'MAIN',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
    },
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    state: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    country: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
    },
    pincode: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    contact_person: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    contact_email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    contact_phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    emergency_contact: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    operational_hours: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    capacity_sqft: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    storage_capacity_units: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    current_utilization_percentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    services_offered: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    supported_fulfillment_types: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    is_auto_assignment_enabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    max_orders_per_day: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1000,
    },
    sla_hours: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 24,
    },
    lms_warehouse_id: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    integration_status: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    created_by: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    updated_by: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
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
    tableName: 'warehouses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'idx_warehouse_code',
            fields: ['warehouse_code'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
        {
            name: 'idx_location',
            fields: ['city', 'state'],
        },
        {
            name: 'idx_capacity',
            fields: ['current_utilization_percentage'],
        },
    ],
});
exports.default = Warehouse;

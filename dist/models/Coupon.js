"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Coupon extends sequelize_1.Model {
    id;
    title;
    code;
    start_date;
    expire_date;
    min_purchase;
    max_discount;
    discount;
    discount_type;
    coupon_type;
    limit;
    status;
    created_at;
    updated_at;
    data;
    total_uses;
    module_id;
    created_by;
    customer_id;
    slug;
    store_id;
}
Coupon.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    start_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    expire_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    min_purchase: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
    },
    max_discount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
    },
    discount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    discount_type: {
        type: sequelize_1.DataTypes.ENUM('amount', 'percentage'),
        allowNull: false,
        defaultValue: 'amount',
    },
    coupon_type: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'store_wise',
    },
    limit: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 1,
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    data: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    total_uses: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    module_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    created_by: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    customer_id: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    slug: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    store_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'coupons',
    timestamps: false,
    indexes: [
        { fields: ['code'] },
        { fields: ['store_id'] },
        { fields: ['status'] },
        { fields: ['expire_date'] },
    ],
});
exports.default = Coupon;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class Order extends sequelize_1.Model {
    id;
    user_id;
    cart;
    coupon_discount_amount;
    order_amount;
    order_type;
    payment_method;
    store_id;
    distance;
    discount_amount;
    tax_amount;
    address;
    latitude;
    longitude;
    contact_person_name;
    contact_person_number;
    address_type;
    is_scheduled;
    scheduled_timestamp;
    promised_delv_tat;
    created_at;
    updated_at;
}
Order.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User_1.default,
            key: 'id',
        },
    },
    cart: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        validate: {
            isNotEmpty(value) {
                if (!value || value.length === 0) {
                    throw new Error('Cart must contain at least one item');
                }
            }
        }
    },
    coupon_discount_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
    },
    order_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01,
        },
    },
    order_type: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    payment_method: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    store_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    distance: {
        type: sequelize_1.DataTypes.DECIMAL(10, 6),
        defaultValue: 0.000000,
        allowNull: false,
    },
    discount_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
    },
    tax_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
    },
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(15, 12),
        defaultValue: 0.000000000000,
        allowNull: false,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(15, 12),
        defaultValue: 0.000000000000,
        allowNull: false,
    },
    contact_person_name: {
        type: sequelize_1.DataTypes.STRING(255),
        defaultValue: '',
        allowNull: false,
    },
    contact_person_number: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    address_type: {
        type: sequelize_1.DataTypes.STRING(50),
        defaultValue: 'others',
        allowNull: false,
    },
    is_scheduled: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: false,
    },
    scheduled_timestamp: {
        type: sequelize_1.DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
    },
    promised_delv_tat: {
        type: sequelize_1.DataTypes.STRING(10),
        defaultValue: '24',
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    updated_at: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'orders',
    timestamps: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['store_id'] },
        { fields: ['created_at'] },
    ],
});
User_1.default.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
exports.default = Order;

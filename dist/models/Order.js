"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class Order extends sequelize_1.Model {
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
    order_note: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    delivery_instruction: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    unavailable_item_note: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    dm_tips: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    cutlery: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    partial_payment: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    is_buy_now: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    extra_packaging_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    create_new_user: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    is_guest: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    otp: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    zone_id: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
    },
    module_id: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
    },
    parcel_category_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    receiver_details: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    charge_payer: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    order_attachment: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    payment_status: {
        type: sequelize_1.DataTypes.STRING(50),
        defaultValue: 'unpaid',
        allowNull: true,
    },
    order_status: {
        type: sequelize_1.DataTypes.STRING(50),
        defaultValue: 'pending',
        allowNull: true,
    },
    transaction_reference: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    confirmed: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    pending: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    canceled: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    canceled_by: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    cancellation_reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    refund_requested: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    refunded: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    failed: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    delivered: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    processing: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    picked_up: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    handover: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    reached_pickup: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    out_for_delivery: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    out_for_pickup: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    dm_vehicle_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    awb_number: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    delivery_man_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    partially_paid_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    ref_bonus_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    flash_admin_discount_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    flash_store_discount_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    additional_charge: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    coupon_created_by: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    coupon_discount_title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    store_discount_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    tax_percentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        defaultValue: 10.00,
        allowNull: true,
    },
    total_tax_amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    original_delivery_charge: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true,
    },
    free_delivery_by: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    tax_status: {
        type: sequelize_1.DataTypes.STRING(50),
        defaultValue: 'excluded',
        allowNull: true,
    },
    prescription_order: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    scheduled: {
        type: sequelize_1.DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: true,
    },
    schedule_at: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
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

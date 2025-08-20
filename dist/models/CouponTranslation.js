"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class CouponTranslation extends sequelize_1.Model {
    id;
    translationable_type;
    translationable_id;
    locale;
    key;
    value;
    created_at;
    updated_at;
}
CouponTranslation.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    translationable_type: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    translationable_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    locale: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
    },
    key: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    value: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    tableName: 'coupon_translations',
    timestamps: false,
    indexes: [
        { fields: ['translationable_type', 'translationable_id'] },
        { fields: ['locale'] },
    ],
});
exports.default = CouponTranslation;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { CouponAttributes, CouponCreationAttributes } from '../types';

class Coupon extends Model<CouponAttributes, CouponCreationAttributes> 
  implements CouponAttributes {
  public id!: number;
  public title!: string;
  public code!: string;
  public start_date!: string;
  public expire_date!: string;
  public min_purchase!: number;
  public max_discount!: number;
  public discount!: number;
  public discount_type!: string;
  public coupon_type!: string;
  public limit!: number;
  public status!: number;
  public created_at!: string;
  public updated_at!: string;
  public data!: string;
  public total_uses!: number;
  public module_id!: number;
  public created_by!: string;
  public customer_id!: string;
  public slug!: string | null;
  public store_id!: number;
}

Coupon.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  expire_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  min_purchase: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount_type: {
    type: DataTypes.ENUM('amount', 'percentage'),
    allowNull: false,
    defaultValue: 'amount',
  },
  coupon_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'store_wise',
  },
  limit: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_uses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  module_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'coupons',
  timestamps: false,
  indexes: [
    { fields: ['code'] },
    { fields: ['store_id'] },
    { fields: ['status'] },
    { fields: ['expire_date'] },
  ],
});

export default Coupon;
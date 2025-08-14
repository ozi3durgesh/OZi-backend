import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { CouponTranslationAttributes, CouponTranslationCreationAttributes } from '../types';

class CouponTranslation extends Model<CouponTranslationAttributes, CouponTranslationCreationAttributes> 
  implements CouponTranslationAttributes {
  public id!: number;
  public translationable_type!: string;
  public translationable_id!: number;
  public locale!: string;
  public key!: string;
  public value!: string;
  public created_at!: string | null;
  public updated_at!: string | null;
}

CouponTranslation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  translationable_type: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  translationable_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  locale: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'coupon_translations',
  timestamps: false,
  indexes: [
    { fields: ['translationable_type', 'translationable_id'] },
    { fields: ['locale'] },
  ],
});

export default CouponTranslation;
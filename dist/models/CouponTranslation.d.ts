import { Model } from 'sequelize';
import { CouponTranslationAttributes, CouponTranslationCreationAttributes } from '../types';
declare class CouponTranslation extends Model<CouponTranslationAttributes, CouponTranslationCreationAttributes> implements CouponTranslationAttributes {
    id: number;
    translationable_type: string;
    translationable_id: number;
    locale: string;
    key: string;
    value: string;
    created_at: string | null;
    updated_at: string | null;
}
export default CouponTranslation;

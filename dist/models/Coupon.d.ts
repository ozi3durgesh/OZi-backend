import { Model } from 'sequelize';
import { CouponAttributes, CouponCreationAttributes } from '../types';
declare class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
    id: number;
    title: string;
    code: string;
    start_date: string;
    expire_date: string;
    min_purchase: number;
    max_discount: number;
    discount: number;
    discount_type: string;
    coupon_type: string;
    limit: number;
    status: number;
    created_at: string;
    updated_at: string;
    data: string;
    total_uses: number;
    module_id: number;
    created_by: string;
    customer_id: string;
    slug: string | null;
    store_id: number;
}
export default Coupon;

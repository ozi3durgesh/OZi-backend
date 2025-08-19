import { Model } from 'sequelize';
import { OrderAttributes, OrderCreationAttributes } from '../types';
declare class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
    id: number;
    user_id: number;
    cart: any[];
    coupon_discount_amount: number;
    order_amount: number;
    order_type: string;
    payment_method: string;
    store_id: number;
    distance: number;
    discount_amount: number;
    tax_amount: number;
    address: string;
    latitude: number;
    longitude: number;
    contact_person_name: string;
    contact_person_number: string;
    address_type: string;
    is_scheduled: number;
    scheduled_timestamp: number;
    promised_delv_tat: string;
    created_at: number;
    updated_at: number;
}
export default Order;

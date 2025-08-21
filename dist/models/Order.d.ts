import { Model } from 'sequelize';
import { OrderAttributes, OrderCreationAttributes } from '../types';
declare class Order extends Model<OrderAttributes, OrderCreationAttributes> {
}
export default Order;

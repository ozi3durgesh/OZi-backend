import { Model } from 'sequelize';
import { LMSShipmentAttributes, LMSShipmentCreationAttributes } from '../types';
declare class LMSShipment extends Model<LMSShipmentAttributes, LMSShipmentCreationAttributes> implements LMSShipmentAttributes {
    id: number;
    handoverId: number;
    lmsReference: string;
    status: 'PENDING' | 'CREATED' | 'MANIFESTED' | 'IN_TRANSIT' | 'DELIVERED';
    lmsResponse: any;
    retryCount: number;
    lastRetryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export default LMSShipment;

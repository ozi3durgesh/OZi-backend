import { Model } from 'sequelize';
import { PackingEventAttributes, PackingEventCreationAttributes } from '../types';
declare class PackingEvent extends Model<PackingEventAttributes, PackingEventCreationAttributes> implements PackingEventAttributes {
    id: number;
    jobId: number;
    eventType: 'PACKING_STARTED' | 'ITEM_PACKED' | 'ITEM_VERIFIED' | 'PACKING_COMPLETED' | 'HANDOVER_ASSIGNED' | 'HANDOVER_CONFIRMED' | 'LMS_SYNCED';
    eventData: any;
    userId?: number;
    timestamp: Date;
    createdAt: Date;
}
export default PackingEvent;

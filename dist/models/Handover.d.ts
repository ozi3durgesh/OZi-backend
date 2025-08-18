import { Model } from 'sequelize';
import { HandoverAttributes, HandoverCreationAttributes } from '../types';
declare class Handover extends Model<HandoverAttributes, HandoverCreationAttributes> implements HandoverAttributes {
    id: number;
    jobId: number;
    riderId: number;
    status: 'ASSIGNED' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    assignedAt: Date;
    confirmedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    cancellationReason?: string;
    cancellationBy?: number;
    lmsSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'RETRY';
    lmsSyncAttempts: number;
    lmsLastSyncAt?: Date;
    lmsErrorMessage?: string;
    trackingNumber?: string;
    manifestNumber?: string;
    specialInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
    Job?: any;
    Rider?: any;
}
export default Handover;

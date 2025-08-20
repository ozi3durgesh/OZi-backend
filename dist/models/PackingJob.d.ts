import { Model } from 'sequelize';
import { PackingJobAttributes, PackingJobCreationAttributes } from '../types';
declare class PackingJob extends Model<PackingJobAttributes, PackingJobCreationAttributes> implements PackingJobAttributes {
    id: number;
    jobNumber: string;
    waveId: number;
    packerId?: number;
    status: 'PENDING' | 'PACKING' | 'VERIFYING' | 'COMPLETED' | 'CANCELLED' | 'AWAITING_HANDOVER' | 'HANDOVER_ASSIGNED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    handoverAt?: Date;
    totalItems: number;
    packedItems: number;
    verifiedItems: number;
    estimatedDuration: number;
    slaDeadline: Date;
    workflowType: 'PICKER_PACKS' | 'DEDICATED_PACKER';
    specialInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
    Packer?: any;
    PackingItems?: any[];
}
export default PackingJob;

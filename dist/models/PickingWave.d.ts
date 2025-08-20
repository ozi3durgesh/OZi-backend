import { Model } from 'sequelize';
interface PickingWaveAttributes {
    id: number;
    waveNumber: string;
    status: 'GENERATED' | 'ASSIGNED' | 'PICKING' | 'PACKING' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    pickerId?: number;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    totalOrders: number;
    totalItems: number;
    estimatedDuration: number;
    slaDeadline: Date;
    routeOptimization: boolean;
    fefoRequired: boolean;
    tagsAndBags: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare class PickingWave extends Model<PickingWaveAttributes> implements PickingWaveAttributes {
    id: number;
    waveNumber: string;
    status: 'GENERATED' | 'ASSIGNED' | 'PICKING' | 'PACKING' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    pickerId?: number;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    totalOrders: number;
    totalItems: number;
    estimatedDuration: number;
    slaDeadline: Date;
    routeOptimization: boolean;
    fefoRequired: boolean;
    tagsAndBags: boolean;
    createdAt: Date;
    updatedAt: Date;
    PicklistItems?: any[];
}
export default PickingWave;

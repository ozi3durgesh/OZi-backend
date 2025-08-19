import { Model } from 'sequelize';
interface PickingExceptionAttributes {
    id: number;
    waveId: number;
    orderId: number;
    sku: string;
    exceptionType: 'OOS' | 'DAMAGED' | 'EXPIRY' | 'WRONG_LOCATION' | 'QUANTITY_MISMATCH' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    reportedBy: number;
    reportedAt: Date;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
    assignedTo?: number;
    resolution?: string;
    resolvedAt?: Date;
    resolutionPhoto?: string;
    slaDeadline: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare class PickingException extends Model<PickingExceptionAttributes> implements PickingExceptionAttributes {
    id: number;
    waveId: number;
    orderId: number;
    sku: string;
    exceptionType: 'OOS' | 'DAMAGED' | 'EXPIRY' | 'WRONG_LOCATION' | 'QUANTITY_MISMATCH' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    reportedBy: number;
    reportedAt: Date;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
    assignedTo?: number;
    resolution?: string;
    resolvedAt?: Date;
    resolutionPhoto?: string;
    slaDeadline: Date;
    createdAt: Date;
    updatedAt: Date;
}
export default PickingException;

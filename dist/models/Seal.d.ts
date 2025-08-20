import { Model } from 'sequelize';
import { SealAttributes, SealCreationAttributes } from '../types';
declare class Seal extends Model<SealAttributes, SealCreationAttributes> implements SealAttributes {
    id: number;
    sealNumber: string;
    jobId: number;
    orderId?: number;
    sealType: 'PLASTIC' | 'PAPER' | 'METAL' | 'ELECTRONIC';
    appliedAt?: Date;
    appliedBy?: number;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'TAMPERED';
    verifiedBy?: number;
    verifiedAt?: Date;
    tamperEvidence?: string;
    createdAt: Date;
    updatedAt: Date;
}
export default Seal;

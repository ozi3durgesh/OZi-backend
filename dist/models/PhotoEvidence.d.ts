import { Model } from 'sequelize';
import { PhotoEvidenceAttributes, PhotoEvidenceCreationAttributes } from '../types';
declare class PhotoEvidence extends Model<PhotoEvidenceAttributes, PhotoEvidenceCreationAttributes> implements PhotoEvidenceAttributes {
    id: number;
    jobId: number;
    orderId?: number;
    photoType: 'PRE_PACK' | 'POST_PACK' | 'SEALED' | 'HANDOVER';
    photoUrl: string;
    thumbnailUrl?: string;
    metadata: {
        timestamp: Date;
        location?: string;
        device?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedBy?: number;
    verifiedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export default PhotoEvidence;

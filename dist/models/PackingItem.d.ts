import { Model } from 'sequelize';
import { PackingItemAttributes, PackingItemCreationAttributes } from '../types';
declare class PackingItem extends Model<PackingItemAttributes, PackingItemCreationAttributes> implements PackingItemAttributes {
    id: number;
    jobId: number;
    orderId: number;
    sku: string;
    quantity: number;
    pickedQuantity: number;
    packedQuantity: number;
    verifiedQuantity: number;
    status: 'PENDING' | 'PACKING' | 'VERIFIED' | 'COMPLETED';
    verificationNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export default PackingItem;

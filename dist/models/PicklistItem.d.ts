import { Model } from 'sequelize';
interface PicklistItemAttributes {
    id: number;
    waveId: number;
    orderId: number;
    sku: string;
    productName: string;
    binLocation: string;
    quantity: number;
    pickedQuantity: number;
    status: 'PENDING' | 'PICKING' | 'PICKED' | 'PARTIAL' | 'OOS' | 'DAMAGED';
    fefoBatch?: string;
    expiryDate?: Date;
    scanSequence: number;
    partialReason?: string;
    partialPhoto?: string;
    pickedAt?: Date;
    pickedBy?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare class PicklistItem extends Model<PicklistItemAttributes> implements PicklistItemAttributes {
    id: number;
    waveId: number;
    orderId: number;
    sku: string;
    productName: string;
    binLocation: string;
    quantity: number;
    pickedQuantity: number;
    status: 'PENDING' | 'PICKING' | 'PICKED' | 'PARTIAL' | 'OOS' | 'DAMAGED';
    fefoBatch?: string;
    expiryDate?: Date;
    scanSequence: number;
    partialReason?: string;
    partialPhoto?: string;
    pickedAt?: Date;
    pickedBy?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export default PicklistItem;

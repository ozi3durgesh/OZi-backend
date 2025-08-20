import { Model } from 'sequelize';
import { RiderAttributes, RiderCreationAttributes } from '../types';
declare class Rider extends Model<RiderAttributes, RiderCreationAttributes> implements RiderAttributes {
    id: number;
    riderCode: string;
    name: string;
    phone: string;
    email?: string;
    vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN';
    vehicleNumber?: string;
    availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'BREAK';
    currentLocation?: {
        lat: number;
        lng: number;
    };
    rating: number;
    totalDeliveries: number;
    isActive: boolean;
    lastActiveAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export default Rider;

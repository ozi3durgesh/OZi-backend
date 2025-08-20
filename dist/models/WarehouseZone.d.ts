import { Model } from 'sequelize';
export interface WarehouseZoneAttributes {
    id: number;
    warehouse_id: number;
    zone_code: string;
    zone_name: string;
    zone_type: 'PICKING' | 'STORAGE' | 'RECEIVING' | 'PACKING' | 'SHIPPING' | 'RETURNS';
    temperature_zone: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
    capacity_units?: number;
    current_utilization: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface WarehouseZoneCreationAttributes extends Omit<WarehouseZoneAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class WarehouseZone extends Model<WarehouseZoneAttributes, WarehouseZoneCreationAttributes> implements WarehouseZoneAttributes {
    id: number;
    warehouse_id: number;
    zone_code: string;
    zone_name: string;
    zone_type: 'PICKING' | 'STORAGE' | 'RECEIVING' | 'PACKING' | 'SHIPPING' | 'RETURNS';
    temperature_zone: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
    capacity_units?: number;
    current_utilization: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export default WarehouseZone;

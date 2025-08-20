import { Model } from 'sequelize';
export interface WarehouseStaffAssignmentAttributes {
    id: number;
    warehouse_id: number;
    user_id: number;
    role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER';
    assigned_date: Date;
    end_date?: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface WarehouseStaffAssignmentCreationAttributes extends Omit<WarehouseStaffAssignmentAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class WarehouseStaffAssignment extends Model<WarehouseStaffAssignmentAttributes, WarehouseStaffAssignmentCreationAttributes> implements WarehouseStaffAssignmentAttributes {
    id: number;
    warehouse_id: number;
    user_id: number;
    role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER';
    assigned_date: Date;
    end_date?: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export default WarehouseStaffAssignment;

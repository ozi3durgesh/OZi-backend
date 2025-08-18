import { Model } from 'sequelize';
interface RolePermissionAttributes {
    id: number;
    roleId: number;
    permissionId: number;
    createdAt: Date;
    updatedAt: Date;
}
declare class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
    id: number;
    roleId: number;
    permissionId: number;
    createdAt: Date;
    updatedAt: Date;
}
export default RolePermission;

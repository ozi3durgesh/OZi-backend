import { Model } from 'sequelize';
interface PermissionAttributes {
    id: number;
    module: string;
    action: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
declare class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
    id: number;
    module: string;
    action: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
export default Permission;

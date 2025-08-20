import { Model } from 'sequelize';
interface RoleAttributes {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare class Role extends Model<RoleAttributes> implements RoleAttributes {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export default Role;

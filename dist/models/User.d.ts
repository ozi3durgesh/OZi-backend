import { Model } from 'sequelize';
import { UserAttributes, UserCreationAttributes } from '../types';
interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
    Role?: any;
}
declare const User: import("sequelize").ModelCtor<UserInstance>;
export default User;

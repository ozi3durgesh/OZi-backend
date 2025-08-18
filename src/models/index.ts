// models/index.ts
import User from './User';
import Order from './Order';
import Coupon from './Coupon';
import CouponTranslation from './CouponTranslation';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import PickingWave from './PickingWave';
import PicklistItem from './PicklistItem';
import PickingException from './PickingException';

// Set up associations
Coupon.hasMany(CouponTranslation, {
  foreignKey: 'translationable_id',
  as: 'translations',
  scope: {
    translationable_type: 'App\\Models\\Coupon'
  }
});

CouponTranslation.belongsTo(Coupon, {
  foreignKey: 'translationable_id',
  as: 'coupon'
});

// User-Role associations
User.belongsTo(Role, { foreignKey: 'roleId', as: 'Role' });
Role.hasMany(User, { foreignKey: 'roleId' });

// Role-Permission associations
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId' });

// Picking associations
PickingWave.belongsTo(User, { foreignKey: 'pickerId', as: 'Picker' });
User.hasMany(PickingWave, { foreignKey: 'pickerId', as: 'PickingWaves' });

PickingWave.hasMany(PicklistItem, { foreignKey: 'waveId', as: 'PicklistItems' });
PicklistItem.belongsTo(PickingWave, { foreignKey: 'waveId', as: 'Wave' });

PicklistItem.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(PicklistItem, { foreignKey: 'orderId', as: 'PicklistItems' });

PicklistItem.belongsTo(User, { foreignKey: 'pickedBy', as: 'PickedBy' });
User.hasMany(PicklistItem, { foreignKey: 'pickedBy', as: 'PickedItems' });

PickingException.belongsTo(PickingWave, { foreignKey: 'waveId', as: 'Wave' });
PickingWave.hasMany(PickingException, { foreignKey: 'waveId', as: 'Exceptions' });

PickingException.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(PickingException, { foreignKey: 'orderId', as: 'PickingExceptions' });

PickingException.belongsTo(User, { foreignKey: 'reportedBy', as: 'ReportedBy' });
User.hasMany(PickingException, { foreignKey: 'reportedBy', as: 'ReportedExceptions' });

PickingException.belongsTo(User, { foreignKey: 'assignedTo', as: 'AssignedTo' });
User.hasMany(PickingException, { foreignKey: 'assignedTo', as: 'AssignedExceptions' });

export { 
  User, 
  Order, 
  Coupon, 
  CouponTranslation,
  Role,
  Permission,
  RolePermission,
  PickingWave,
  PicklistItem,
  PickingException
};
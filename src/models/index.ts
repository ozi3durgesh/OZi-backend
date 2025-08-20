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
import PackingJob from './PackingJob';
import PackingItem from './PackingItem';
import PhotoEvidence from './PhotoEvidence';
import Seal from './Seal';
import Rider from './Rider';
import Handover from './Handover';
import LMSShipment from './LMSShipment';
import PackingEvent from './PackingEvent';
import Warehouse from './Warehouse';
import WarehouseZone from './WarehouseZone';
import WarehouseStaffAssignment from './WarehouseStaffAssignment';

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

// Packing and Handover associations
PickingWave.hasMany(PackingJob, { foreignKey: 'waveId', as: 'PackingJobs' });
PackingJob.belongsTo(PickingWave, { foreignKey: 'waveId', as: 'Wave' });

PackingJob.belongsTo(User, { foreignKey: 'packerId', as: 'Packer' });
User.hasMany(PackingJob, { foreignKey: 'packerId', as: 'PackingJobs' });

PackingJob.hasMany(PackingItem, { foreignKey: 'jobId', as: 'PackingItems' });
PackingItem.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

PackingItem.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(PackingItem, { foreignKey: 'orderId', as: 'PackingItems' });

PackingJob.hasMany(PhotoEvidence, { foreignKey: 'jobId', as: 'PhotoEvidence' });
PhotoEvidence.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

PhotoEvidence.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(PhotoEvidence, { foreignKey: 'orderId', as: 'PhotoEvidence' });

PhotoEvidence.belongsTo(User, { foreignKey: 'verifiedBy', as: 'VerifiedBy' });
User.hasMany(PhotoEvidence, { foreignKey: 'verifiedBy', as: 'VerifiedPhotos' });

PackingJob.hasMany(Seal, { foreignKey: 'jobId', as: 'Seals' });
Seal.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

Seal.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(Seal, { foreignKey: 'orderId', as: 'Seals' });

Seal.belongsTo(User, { foreignKey: 'appliedBy', as: 'AppliedBy' });
User.hasMany(Seal, { foreignKey: 'appliedBy', as: 'AppliedSeals' });

Seal.belongsTo(User, { foreignKey: 'verifiedBy', as: 'VerifiedBy' });
User.hasMany(Seal, { foreignKey: 'verifiedBy', as: 'VerifiedSeals' });

PackingJob.hasOne(Handover, { foreignKey: 'jobId', as: 'Handover' });
Handover.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

Handover.belongsTo(Rider, { foreignKey: 'riderId', as: 'Rider' });
Rider.hasMany(Handover, { foreignKey: 'riderId', as: 'Handovers' });

Handover.belongsTo(User, { foreignKey: 'cancellationBy', as: 'CancelledBy' });
User.hasMany(Handover, { foreignKey: 'cancellationBy', as: 'CancelledHandovers' });

Handover.hasMany(LMSShipment, { foreignKey: 'handoverId', as: 'LMSShipments' });
LMSShipment.belongsTo(Handover, { foreignKey: 'handoverId', as: 'Handover' });

PackingJob.hasMany(PackingEvent, { foreignKey: 'jobId', as: 'Events' });
PackingEvent.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

PackingEvent.belongsTo(User, { foreignKey: 'userId', as: 'User' });
User.hasMany(PackingEvent, { foreignKey: 'userId', as: 'PackingEvents' });

// Warehouse associations
Warehouse.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedBy' });
Warehouse.belongsTo(User, { foreignKey: 'updated_by', as: 'UpdatedBy' });
User.hasMany(Warehouse, { foreignKey: 'created_by', as: 'CreatedWarehouses' });
User.hasMany(Warehouse, { foreignKey: 'updated_by', as: 'UpdatedWarehouses' });

Warehouse.hasMany(WarehouseZone, { foreignKey: 'warehouse_id', as: 'Zones' });
WarehouseZone.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'Warehouse' });

Warehouse.hasMany(WarehouseStaffAssignment, { foreignKey: 'warehouse_id', as: 'StaffAssignments' });
WarehouseStaffAssignment.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'Warehouse' });

WarehouseStaffAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(WarehouseStaffAssignment, { foreignKey: 'user_id', as: 'StaffAssignments' });

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
  PickingException,
  PackingJob,
  PackingItem,
  PhotoEvidence,
  Seal,
  Rider,
  Handover,
  LMSShipment,
  PackingEvent,
  Warehouse,
  WarehouseZone,
  WarehouseStaffAssignment
};
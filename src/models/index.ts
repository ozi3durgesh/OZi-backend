// models/index.ts - Only includes models actually used in the application
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
import Handover from './Handover';
import LMSShipment from './LMSShipment';
import PackingEvent from './PackingEvent';
import Warehouse from './Warehouse';
import WarehouseZone from './WarehouseZone';
import WarehouseStaffAssignment from './WarehouseStaffAssignment';
import Rider from './Rider';
import ScannerBin from './ScannerBin';
import ScannerSku from './ScannerSku';
import PaymentRequest from './PaymentRequest';
import OrderPayment from './OrderPayment';
import OrderTransaction from './OrderTransaction';
import OrderDetails from './OrderDetails';
import Item from './Item';
import EcomLog from './EcomLog';
import Product from './productModel';

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

PackingJob.hasOne(Handover, { foreignKey: 'jobId', as: 'Handover' });
Handover.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

Handover.belongsTo(Rider, { foreignKey: 'riderId', as: 'Rider' });
Rider.hasMany(Handover, { foreignKey: 'riderId', as: 'Handovers' });

Handover.belongsTo(User, { foreignKey: 'cancellationBy', as: 'CancelledBy' });
User.hasMany(Handover, { foreignKey: 'cancellationBy', as: 'CancelledHandovers' });

Handover.hasMany(LMSShipment, { foreignKey: 'handoverId', as: 'LMSShips' });
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

// Payment associations
Order.hasMany(PaymentRequest, { foreignKey: 'order_id', as: 'PaymentRequests' });
PaymentRequest.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });

Order.hasMany(OrderPayment, { foreignKey: 'order_id', as: 'OrderPayments' });
OrderPayment.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });

Order.hasMany(OrderTransaction, { foreignKey: 'order_id', as: 'OrderTransactions' });
OrderTransaction.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });

// Ecommerce associations
Order.hasMany(OrderDetails, { foreignKey: 'order_id', as: 'orderDetails' });
OrderDetails.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Order.hasMany(EcomLog, { foreignKey: 'order_id', as: 'ecomLogs' });
EcomLog.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Scanner associations
ScannerBin.hasMany(ScannerSku, { foreignKey: 'binLocationScanId', sourceKey: 'binLocationScanId', as: 'SkuScans' });
ScannerSku.belongsTo(ScannerBin, { foreignKey: 'binLocationScanId', targetKey: 'binLocationScanId', as: 'BinLocation' });

// associations
// PicklistItem.ts
PicklistItem.belongsTo(Product, { foreignKey: 'sku', targetKey: 'SKU', as: 'productInfo' });
Product.hasMany(PicklistItem, { foreignKey: 'sku', sourceKey: 'SKU', as: 'picklistItems' });





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
  Handover,
  LMSShipment,
  PackingEvent,
  Warehouse,
  WarehouseZone,
  WarehouseStaffAssignment,
  Rider,
  ScannerBin,
  ScannerSku,
  PaymentRequest,
  OrderPayment,
  OrderTransaction,
  OrderDetails,
  Item,
  EcomLog, 
  Product
};
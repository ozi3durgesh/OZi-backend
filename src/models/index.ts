// models/index.ts - Only includes models actually used in the application
import User from './User';
import Order from './Order';
import Coupon from './Coupon';
// Removed: CouponTranslation (table dropped)
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import PickingWave from './PickingWave';
import PicklistItem from './PicklistItem';
import PickingException from './PickingException';
// Removed: PackingJob (table dropped)
import Handover from './Handover';
// Removed: PackingEvent (table dropped)
import Warehouse from './Warehouse';
import WarehouseZone from './WarehouseZone';
import WarehouseStaffAssignment from './WarehouseStaffAssignment';
import Rider from './Rider';
import ScannerBin from './ScannerBin';
import ScannerSku from './ScannerSku';
import BinLocation from './BinLocation';
import GRN from './Grn.model';
import GRNLine from './GrnLine';
import GRNBatch from './GrnBatch';
import GRNPhoto from './GrnPhoto';
import PurchaseOrder from './PurchaseOrder';
// Removed: EcomLog (table dropped)
import Product from './productModel';
import ProductMaster from './productModel';
import POProduct from './POProduct';
import TokenBlacklist from './TokenBlacklist';
import ReturnRequestItem from './ReturnRequestItem';
// Removed: PutawayTask (table dropped)
// Removed: PutawayAudit (table dropped)
import Inventory from './Inventory';
import InventoryLog from './InventoryLog';
// Removed: UserDevice (table dropped)
import BulkImportLog from './BulkImportLog';
import DistributionCenter from './DistributionCenter';
import FulfillmentCenter from './FulfillmentCenter';
import UserFulfillmentCenter from './UserFulfillmentCenter';

// Set up associations
// Removed: Coupon-CouponTranslation associations (CouponTranslation table dropped)

// User-Role associations
User.belongsTo(Role, { foreignKey: 'roleId', as: 'Role' });
Role.hasMany(User, { foreignKey: 'roleId' });

// Role-Permission associations
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
});

// Picking associations
PickingWave.belongsTo(User, { foreignKey: 'pickerId', as: 'Picker' });
User.hasMany(PickingWave, { foreignKey: 'pickerId', as: 'PickingWaves' });

PickingWave.hasMany(PicklistItem, {
  foreignKey: 'waveId',
  as: 'PicklistItems',
});
PicklistItem.belongsTo(PickingWave, { foreignKey: 'waveId', as: 'Wave' });

PicklistItem.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(PicklistItem, { foreignKey: 'orderId', as: 'PicklistItems' });

PicklistItem.belongsTo(User, { foreignKey: 'pickedBy', as: 'PickedBy' });
User.hasMany(PicklistItem, { foreignKey: 'pickedBy', as: 'PickedItems' });

PickingException.belongsTo(PickingWave, { foreignKey: 'waveId', as: 'Wave' });
PickingWave.hasMany(PickingException, {
  foreignKey: 'waveId',
  as: 'Exceptions',
});

PickingException.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(PickingException, {
  foreignKey: 'orderId',
  as: 'PickingExceptions',
});

PickingException.belongsTo(User, {
  foreignKey: 'reportedBy',
  as: 'ReportedBy',
});
User.hasMany(PickingException, {
  foreignKey: 'reportedBy',
  as: 'ReportedExceptions',
});

PickingException.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'AssignedTo',
});
User.hasMany(PickingException, {
  foreignKey: 'assignedTo',
  as: 'AssignedExceptions',
});

// Removed: Packing and Handover associations (PackingJob and PackingEvent tables dropped)
Handover.belongsTo(Rider, { foreignKey: 'riderId', as: 'Rider' });
Rider.hasMany(Handover, { foreignKey: 'riderId', as: 'Handovers' });

Handover.belongsTo(User, { foreignKey: 'cancellationBy', as: 'CancelledBy' });
User.hasMany(Handover, {
  foreignKey: 'cancellationBy',
  as: 'CancelledHandovers',
});

// Warehouse associations
Warehouse.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'WarehouseCreatedBy',
});
Warehouse.belongsTo(User, { foreignKey: 'updated_by', as: 'UpdatedBy' });
User.hasMany(Warehouse, { foreignKey: 'created_by', as: 'CreatedWarehouses' });
User.hasMany(Warehouse, { foreignKey: 'updated_by', as: 'UpdatedWarehouses' });

Warehouse.hasMany(WarehouseZone, { foreignKey: 'warehouse_id', as: 'Zones' });
WarehouseZone.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'Warehouse',
});

Warehouse.hasMany(WarehouseStaffAssignment, {
  foreignKey: 'warehouse_id',
  as: 'StaffAssignments',
});
WarehouseStaffAssignment.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'Warehouse',
});

WarehouseStaffAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(WarehouseStaffAssignment, {
  foreignKey: 'user_id',
  as: 'StaffAssignments',
});

// Removed: EcomLog associations (ecom_logs table dropped)

// Scanner associations
ScannerBin.hasMany(ScannerSku, {
  foreignKey: 'binLocationScanId',
  sourceKey: 'binLocationScanId',
  as: 'SkuScans',
});
ScannerSku.belongsTo(ScannerBin, {
  foreignKey: 'binLocationScanId',
  targetKey: 'binLocationScanId',
  as: 'BinLocation',
});

// associations
// PicklistItem.ts
PicklistItem.belongsTo(Product, {
  foreignKey: 'sku',
  targetKey: 'SKU',
  as: 'productInfo',
});
Product.hasMany(PicklistItem, {
  foreignKey: 'sku',
  sourceKey: 'SKU',
  as: 'picklistItems',
});

POProduct.belongsTo(ProductMaster, { foreignKey: 'sku_id', as: 'sku' });
ProductMaster.hasMany(POProduct, { foreignKey: 'sku_id', as: 'products' });

// GRN associations
GRN.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'PO' });
GRN.belongsTo(User, { foreignKey: 'created_by', as: 'GrnCreatedBy' });
GRN.belongsTo(User, { foreignKey: 'approved_by', as: 'ApprovedBy' });
User.hasMany(GRN, { foreignKey: 'created_by', as: 'CreatedGrns' });
User.hasMany(GRN, { foreignKey: 'approved_by', as: 'ApprovedGrns' });
PurchaseOrder.hasMany(GRN, { foreignKey: 'po_id', as: 'GRNs' });

// GRN Line associations
GRN.hasMany(GRNLine, { foreignKey: 'grn_id', as: 'Line' });
GRNLine.belongsTo(GRN, { foreignKey: 'grn_id', as: 'GrnId' });

// GRN Batch associations
GRNLine.hasMany(GRNBatch, { foreignKey: 'grn_line_id', as: 'Batches' });
GRNBatch.belongsTo(GRNLine, { foreignKey: 'grn_line_id', as: 'Line' });

// GRN Photo associations
GRN.hasMany(GRNPhoto, { foreignKey: 'grn_id', as: 'Photos' });
GRNPhoto.belongsTo(GRN, { foreignKey: 'grn_id', as: 'GRN' });

PurchaseOrder.hasMany(GRNPhoto, { foreignKey: 'po_id', as: 'Photos' });
GRNPhoto.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'PurchaseOrder' });

// Removed: Putaway associations (putaway_tasks and putaway_audit tables dropped)

// Inventory associations
Inventory.hasMany(InventoryLog, { foreignKey: 'sku', sourceKey: 'sku', as: 'Logs' });
InventoryLog.belongsTo(Inventory, { foreignKey: 'sku', targetKey: 'sku', as: 'Inventory' });

// Removed: User-Device associations (user_device table dropped)

// Distribution Center and Fulfillment Center Associations
DistributionCenter.hasMany(FulfillmentCenter, {
  foreignKey: 'dc_id',
  as: 'FulfillmentCenters',
});

FulfillmentCenter.belongsTo(DistributionCenter, {
  foreignKey: 'dc_id',
  as: 'DistributionCenter',
});

// User-FulfillmentCenter associations
User.hasMany(UserFulfillmentCenter, {
  foreignKey: 'user_id',
  as: 'UserFulfillmentCenters',
});

FulfillmentCenter.hasMany(UserFulfillmentCenter, {
  foreignKey: 'fc_id',
  as: 'UserFulfillmentCenters',
});

UserFulfillmentCenter.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User',
});

UserFulfillmentCenter.belongsTo(FulfillmentCenter, {
  foreignKey: 'fc_id',
  as: 'FulfillmentCenter',
});

// Creator/Updater associations for DC/FC
DistributionCenter.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'CreatedBy',
});

DistributionCenter.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedBy',
});

FulfillmentCenter.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'CreatedBy',
});

FulfillmentCenter.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedBy',
});

UserFulfillmentCenter.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'CreatedBy',
});

UserFulfillmentCenter.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedBy',
});

// Return system associations are defined in individual model files

export {
  User,
  Order,
  Coupon,
  // Removed: CouponTranslation (table dropped)
  Role,
  Permission,
  RolePermission,
  PickingWave,
  PicklistItem,
  PickingException,
  // Removed: PackingJob (table dropped)
  Handover,
  // Removed: PackingEvent (table dropped)
  Warehouse,
  WarehouseZone,
  WarehouseStaffAssignment,
  Rider,
  ScannerBin,
  ScannerSku,
  // Removed: EcomLog (table dropped)
  Product,
  BinLocation,
  GRN,
  GRNLine,
  GRNBatch,
  GRNPhoto,
  PurchaseOrder,
  POProduct,
  TokenBlacklist,
  // Removed: PutawayTask (table dropped)
  // Removed: PutawayAudit (table dropped)
  ReturnRequestItem,
  Inventory,
  InventoryLog,
  // Removed: UserDevice (table dropped)
  BulkImportLog,
  DistributionCenter,
  FulfillmentCenter,
  UserFulfillmentCenter,
};

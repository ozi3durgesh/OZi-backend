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
import Handover from './Handover';
import PackingEvent from './PackingEvent';
import Warehouse from './Warehouse';
import WarehouseZone from './WarehouseZone';
import WarehouseStaffAssignment from './WarehouseStaffAssignment';
import Rider from './Rider';
import ScannerBin from './ScannerBin';
import ScannerSku from './ScannerSku';
import BinLocation from './BinLocation';
import FCGrn from './FCGrn.model';
import FCGrnLine from './FCGrnLine';
import FCGrnBatch from './FCGrnBatch';
import FCGrnPhoto from './FCGrnPhoto';
import PurchaseOrder from './PurchaseOrder';
import EcomLog from './EcomLog';
import ProductMaster from './NewProductMaster';
import POProduct from './POProduct';
import TokenBlacklist from './TokenBlacklist';
import ReturnRequestItem from './ReturnRequestItem';
import FC_PutawayTask from './FC_PutawayTask';
import PutawayAudit from './PutawayAudit';
import Inventory from './Inventory';
import InventoryLog from './InventoryLog';
import UserDevice from './userDevice';
import BulkImportLog from './BulkImportLog';
import DistributionCenter from './DistributionCenter';
import FulfillmentCenter from './FulfillmentCenter';
import UserFulfillmentCenter from './UserFulfillmentCenter';
import VendorDC from './VendorDC';
import Brand from './Brand';
import DCPurchaseOrder from './DCPurchaseOrder';
import DCPOApproval from './DCPOApproval';
import DCPOSkuMatrix from './DCPOSkuMatrix';
import DCGrn from './DCGrn.model';
import DCGrnLine from './DCGrnLine';
import DCGrnBatch from './DCGrnBatch';
import DCGrnPhoto from './DCGrnPhoto';
import DCSkuSplitted from './DCSkuSplitted';
import DCInventory1 from './DCInventory1';
import FCPurchaseOrder from './FCPurchaseOrder';
import FCPOSkuMatrix from './FCPOSkuMatrix';
import FCPOApproval from './FCPOApproval';
import FCSkuSplitted from './FCSkuSplitted';
import PurchaseOrderEdit from './PurchaseOrderEdits';
import POProductEdit from './POProductEdit';
import ProductMasterAudit from './ProductMasterAudit';

// Set up associations
Coupon.hasMany(CouponTranslation, {
  foreignKey: 'translationable_id',
  as: 'translations',
  scope: {
    translationable_type: 'App\\Models\\Coupon',
  },
});

CouponTranslation.belongsTo(Coupon, {
  foreignKey: 'translationable_id',
  as: 'coupon',
});

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

PickingWave.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
Order.hasMany(PickingWave, { foreignKey: 'orderId', as: 'PickingWaves' });

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

// Packing and Handover associations
PickingWave.hasMany(PackingJob, { foreignKey: 'waveId', as: 'PackingJobs' });
PackingJob.belongsTo(PickingWave, { foreignKey: 'waveId', as: 'Wave' });

PackingJob.belongsTo(User, { foreignKey: 'packerId', as: 'Packer' });
User.hasMany(PackingJob, { foreignKey: 'packerId', as: 'PackingJobs' });

PackingJob.hasOne(Handover, { foreignKey: 'jobId', as: 'Handover' });
Handover.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

Handover.belongsTo(Rider, { foreignKey: 'riderId', as: 'Rider' });
Rider.hasMany(Handover, { foreignKey: 'riderId', as: 'Handovers' });

Handover.belongsTo(User, { foreignKey: 'cancellationBy', as: 'CancelledBy' });
User.hasMany(Handover, {
  foreignKey: 'cancellationBy',
  as: 'CancelledHandovers',
});

PackingJob.hasMany(PackingEvent, { foreignKey: 'jobId', as: 'Events' });
PackingEvent.belongsTo(PackingJob, { foreignKey: 'jobId', as: 'Job' });

PackingEvent.belongsTo(User, { foreignKey: 'userId', as: 'User' });
User.hasMany(PackingEvent, { foreignKey: 'userId', as: 'PackingEvents' });

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

Order.hasMany(EcomLog, { foreignKey: 'order_id', as: 'ecomLogs' });
EcomLog.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

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
// PicklistItem.ts - Association moved to PicklistItem.ts itself
// Commenting out duplicate ProductMaster association (using Product instead)
// PicklistItem.belongsTo(ProductMaster, {
//   foreignKey: 'sku',
//   targetKey: 'sku_id',
//   as: 'productInfo',
// });
// ProductMaster.hasMany(PicklistItem, {
//   foreignKey: 'sku',
//   sourceKey: 'sku_id',
//   as: 'picklistItems',
// });

POProduct.belongsTo(ProductMaster, { foreignKey: 'sku_id', targetKey: 'sku_id', as: 'sku' });
ProductMaster.hasMany(POProduct, { foreignKey: 'sku_id', sourceKey: 'sku_id', as: 'products' });

// FC-GRN associations
FCGrn.belongsTo(FCPurchaseOrder, { foreignKey: 'po_id', as: 'FCPO' });
FCGrn.belongsTo(User, { foreignKey: 'created_by', as: 'GrnCreatedBy' });
FCGrn.belongsTo(User, { foreignKey: 'approved_by', as: 'ApprovedBy' });
FCGrn.belongsTo(FulfillmentCenter, { foreignKey: 'fc_id', as: 'FulfillmentCenter' });
User.hasMany(FCGrn, { foreignKey: 'created_by', as: 'CreatedFCGrns' });
User.hasMany(FCGrn, { foreignKey: 'approved_by', as: 'ApprovedFCGrns' });
FCPurchaseOrder.hasMany(FCGrn, { foreignKey: 'po_id', as: 'FCGrns' });
FulfillmentCenter.hasMany(FCGrn, { foreignKey: 'fc_id', as: 'FCGrns' });

// FC-GRN Line associations
FCGrn.hasMany(FCGrnLine, { foreignKey: 'grn_id', as: 'Line' });
FCGrnLine.belongsTo(FCGrn, { foreignKey: 'grn_id', as: 'FCGrn' });

// FC-GRN Batch associations
FCGrnLine.hasMany(FCGrnBatch, { foreignKey: 'grn_line_id', as: 'Batches' });
FCGrnBatch.belongsTo(FCGrnLine, { foreignKey: 'grn_line_id', as: 'Line' });

// FC-GRN Photo associations
FCGrn.hasMany(FCGrnPhoto, { foreignKey: 'grn_id', as: 'Photos' });
FCGrnPhoto.belongsTo(FCGrn, { foreignKey: 'grn_id', as: 'FCGrn' });

FCPurchaseOrder.hasMany(FCGrnPhoto, { foreignKey: 'po_id', as: 'FCGrnPhotos' });
FCGrnPhoto.belongsTo(FCPurchaseOrder, { foreignKey: 'po_id', as: 'FCPurchaseOrder' });

// Putaway associations
FC_PutawayTask.belongsTo(FCGrn, { foreignKey: 'grn_id', as: 'FCGRN' });
FC_PutawayTask.belongsTo(FCGrnLine, { foreignKey: 'grn_line_id', as: 'FCGRNLine' });
FC_PutawayTask.belongsTo(User, { foreignKey: 'assigned_to', as: 'AssignedTo' });
FC_PutawayTask.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedBy' });

PutawayAudit.belongsTo(FC_PutawayTask, { foreignKey: 'putaway_task_id', as: 'PutawayTask' });
PutawayAudit.belongsTo(User, { foreignKey: 'performed_by', as: 'PerformedBy' });

FC_PutawayTask.hasMany(PutawayAudit, { foreignKey: 'putaway_task_id', as: 'AuditLogs' });

// Inventory associations
Inventory.hasMany(InventoryLog, { foreignKey: 'sku', sourceKey: 'sku', as: 'Logs' });
InventoryLog.belongsTo(Inventory, { foreignKey: 'sku', targetKey: 'sku', as: 'Inventory' });

// User-Device associations for push notifications
User.hasMany(UserDevice, { foreignKey: 'userId', as: 'devices' });
UserDevice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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

// VendorDC associations
VendorDC.belongsTo(DistributionCenter, {
  foreignKey: 'dc_id',
  as: 'DistributionCenter',
});

VendorDC.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'CreatedBy',
});

VendorDC.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedBy',
});

DistributionCenter.hasMany(VendorDC, {
  foreignKey: 'dc_id',
  as: 'Vendors',
});

User.hasMany(VendorDC, {
  foreignKey: 'created_by',
  as: 'CreatedVendorsDC',
});

// ProductMaster associations - Updated for new structure
ProductMaster.belongsTo(Brand, {
  foreignKey: 'brand_id',
  as: 'Brand',
});

ProductMaster.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'CreatedBy',
});

Brand.hasMany(ProductMaster, {
  foreignKey: 'brand_id',
  as: 'Products',
});

User.hasMany(ProductMaster, {
  foreignKey: 'created_by',
  as: 'CreatedProducts',
});

// DCPurchaseOrder associations
DCPurchaseOrder.belongsTo(VendorDC, {
  foreignKey: 'vendorId',
  as: 'Vendor',
});

DCPurchaseOrder.belongsTo(DistributionCenter, {
  foreignKey: 'dcId',
  as: 'DistributionCenter',
});

DCPurchaseOrder.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'CreatedBy',
});

DCPurchaseOrder.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'UpdatedBy',
});

DCPurchaseOrder.belongsTo(User, {
  foreignKey: 'approvedBy',
  as: 'ApprovedBy',
});

DCPurchaseOrder.belongsTo(User, {
  foreignKey: 'rejectedBy',
  as: 'RejectedBy',
});

DCPurchaseOrder.hasMany(DCPOApproval, {
  foreignKey: 'dcPOId',
  as: 'Approvals',
});

// DCPOSkuMatrix associations - directly linked to DCPurchaseOrder
DCPurchaseOrder.hasMany(DCPOSkuMatrix, {
  foreignKey: 'dcPOId',
  as: 'SkuMatrix',
});

DCPOSkuMatrix.belongsTo(DCPurchaseOrder, {
  foreignKey: 'dcPOId',
  as: 'DCPurchaseOrder',
});

// DCPOApproval associations
DCPOApproval.belongsTo(DCPurchaseOrder, {
  foreignKey: 'dcPOId',
  as: 'PurchaseOrder',
});

DCPOApproval.belongsTo(User, {
  foreignKey: 'approverId',
  as: 'Approver',
});

// Reverse associations
VendorDC.hasMany(DCPurchaseOrder, {
  foreignKey: 'vendorId',
  as: 'PurchaseOrders',
});

DistributionCenter.hasMany(DCPurchaseOrder, {
  foreignKey: 'dcId',
  as: 'PurchaseOrders',
});

User.hasMany(DCPurchaseOrder, {
  foreignKey: 'createdBy',
  as: 'CreatedPurchaseOrders',
});

User.hasMany(DCPOApproval, {
  foreignKey: 'approverId',
  as: 'Approvals',
});

// DCPOProduct removed - using DCPOSkuMatrix instead

// DC-GRN associations
DCGrn.belongsTo(DCPurchaseOrder, { foreignKey: 'dc_po_id', as: 'DCPO' });
DCGrn.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedBy' });
DCGrn.belongsTo(User, { foreignKey: 'approved_by', as: 'ApprovedBy' });
DCGrn.belongsTo(DistributionCenter, { foreignKey: 'dc_id', as: 'DistributionCenter' });

// DC-GRN Line associations
DCGrn.hasMany(DCGrnLine, { foreignKey: 'dc_grn_id', as: 'Lines' });
DCGrnLine.belongsTo(DCGrn, { foreignKey: 'dc_grn_id', as: 'DCGrn' });

// DC-GRN Batch associations
DCGrnLine.hasMany(DCGrnBatch, { foreignKey: 'dc_grn_line_id', as: 'Batches' });
DCGrnBatch.belongsTo(DCGrnLine, { foreignKey: 'dc_grn_line_id', as: 'Line' });

// DC-GRN Photo associations
DCGrn.hasMany(DCGrnPhoto, { foreignKey: 'dc_grn_id', as: 'Photos' });
DCGrnPhoto.belongsTo(DCGrn, { foreignKey: 'dc_grn_id', as: 'DCGrn' });

DCPurchaseOrder.hasMany(DCGrnPhoto, { foreignKey: 'dc_po_id', as: 'DCGrnPhotos' });
DCGrnPhoto.belongsTo(DCPurchaseOrder, { foreignKey: 'dc_po_id', as: 'DCPurchaseOrder' });

// DCSkuSplitted associations
DCSkuSplitted.belongsTo(DCPurchaseOrder, {
  foreignKey: 'po_id',
  as: 'PurchaseOrder',
});

DCSkuSplitted.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'CreatedBy',
});

DCPurchaseOrder.hasMany(DCSkuSplitted, {
  foreignKey: 'po_id',
  as: 'SkuSplitted',
});

User.hasMany(DCSkuSplitted, {
  foreignKey: 'createdBy',
  as: 'CreatedSkuSplitted',
});

// Reverse associations
DCPurchaseOrder.hasMany(DCGrn, { foreignKey: 'dc_po_id', as: 'DCGrns' });
User.hasMany(DCGrn, { foreignKey: 'created_by', as: 'CreatedDCGrns' });
User.hasMany(DCGrn, { foreignKey: 'approved_by', as: 'ApprovedDCGrns' });
DistributionCenter.hasMany(DCGrn, { foreignKey: 'dc_id', as: 'DCGrns' });

// FC Purchase Order associations
FCPurchaseOrder.belongsTo(FulfillmentCenter, {
  foreignKey: 'fcId',
  as: 'FulfillmentCenter',
});

FCPurchaseOrder.belongsTo(DistributionCenter, {
  foreignKey: 'dcId',
  as: 'DistributionCenter',
});

FCPurchaseOrder.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'CreatedBy',
});

FCPurchaseOrder.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'UpdatedBy',
});

FCPurchaseOrder.belongsTo(User, {
  foreignKey: 'approvedBy',
  as: 'ApprovedBy',
});

FCPurchaseOrder.belongsTo(User, {
  foreignKey: 'rejectedBy',
  as: 'RejectedBy',
});

FCPurchaseOrder.hasMany(FCPOSkuMatrix, {
  foreignKey: 'fcPOId',
  as: 'SkuMatrix',
});

FCPurchaseOrder.hasMany(FCPOApproval, {
  foreignKey: 'fcPOId',
  as: 'Approvals',
});

// FCPOSkuMatrix associations
FCPOSkuMatrix.belongsTo(FCPurchaseOrder, {
  foreignKey: 'fcPOId',
  as: 'FCPurchaseOrder',
});

// FCPOApproval associations
FCPOApproval.belongsTo(FCPurchaseOrder, {
  foreignKey: 'fcPOId',
  as: 'PurchaseOrder',
});

FCPOApproval.belongsTo(User, {
  foreignKey: 'approverId',
  as: 'Approver',
});

// Reverse associations
FulfillmentCenter.hasMany(FCPurchaseOrder, {
  foreignKey: 'fcId',
  as: 'FCPurchaseOrders',
});

DistributionCenter.hasMany(FCPurchaseOrder, {
  foreignKey: 'dcId',
  as: 'FCPurchaseOrders',
});

User.hasMany(FCPurchaseOrder, {
  foreignKey: 'createdBy',
  as: 'CreatedFCPurchaseOrders',
});

User.hasMany(FCPOApproval, {
  foreignKey: 'approverId',
  as: 'FCApprovals',
});


// FCSkuSplitted associations
FCSkuSplitted.belongsTo(FCPurchaseOrder, {
  foreignKey: 'fcPOId',
  as: 'FCPurchaseOrder',
});

FCSkuSplitted.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'CreatedBy',
});

FCPurchaseOrder.hasMany(FCSkuSplitted, {
  foreignKey: 'fcPOId',
  as: 'SkuSplitted',
});

User.hasMany(FCSkuSplitted, {
  foreignKey: 'createdBy',
  as: 'CreatedFCSkuSplitted',
});

// One-to-Many relationship
PurchaseOrderEdit.hasMany(POProductEdit, {
  foreignKey: 'purchase_order_edit_id',
  as: 'products',
});
POProductEdit.belongsTo(PurchaseOrderEdit, {
  foreignKey: 'purchase_order_edit_id',
  as: 'purchaseOrderEdit',
});

// Return system associations are defined in individual model files

// ProductMasterAudit associations
ProductMasterAudit.belongsTo(ProductMaster, {
  foreignKey: 'productMasterId',
  as: 'ProductMaster',
});

ProductMaster.hasMany(ProductMasterAudit, {
  foreignKey: 'productMasterId',
  as: 'AuditLogs',
});

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
  Handover,
  PackingEvent,
  Warehouse,
  WarehouseZone,
  WarehouseStaffAssignment,
  Rider,
  ScannerBin,
  ScannerSku,
  EcomLog,
  ProductMaster,
  BinLocation,
  FCGrn,
  FCGrnLine,
  FCGrnBatch,
  FCGrnPhoto,
  PurchaseOrder,
  POProduct,
  TokenBlacklist,
  FC_PutawayTask,
  PutawayAudit,
  ReturnRequestItem,
  Inventory,
  InventoryLog,
  UserDevice,
  BulkImportLog,
  DistributionCenter,
  FulfillmentCenter,
  UserFulfillmentCenter,
  VendorDC,
  Brand,
  DCPurchaseOrder,
  DCPOApproval,
  DCPOSkuMatrix,
  DCGrn,
  DCGrnLine,
  DCGrnBatch,
  DCGrnPhoto,
  DCSkuSplitted,
  DCInventory1,
  FCPurchaseOrder,
  FCPOSkuMatrix,
  FCPOApproval,
  FCSkuSplitted,
  PurchaseOrderEdit,
  POProductEdit,
  ProductMasterAudit,
};

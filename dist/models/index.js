"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackingEvent = exports.LMSShipment = exports.Handover = exports.Rider = exports.Seal = exports.PhotoEvidence = exports.PackingItem = exports.PackingJob = exports.PickingException = exports.PicklistItem = exports.PickingWave = exports.RolePermission = exports.Permission = exports.Role = exports.CouponTranslation = exports.Coupon = exports.Order = exports.User = void 0;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Order_1 = __importDefault(require("./Order"));
exports.Order = Order_1.default;
const Coupon_1 = __importDefault(require("./Coupon"));
exports.Coupon = Coupon_1.default;
const CouponTranslation_1 = __importDefault(require("./CouponTranslation"));
exports.CouponTranslation = CouponTranslation_1.default;
const Role_1 = __importDefault(require("./Role"));
exports.Role = Role_1.default;
const Permission_1 = __importDefault(require("./Permission"));
exports.Permission = Permission_1.default;
const RolePermission_1 = __importDefault(require("./RolePermission"));
exports.RolePermission = RolePermission_1.default;
const PickingWave_1 = __importDefault(require("./PickingWave"));
exports.PickingWave = PickingWave_1.default;
const PicklistItem_1 = __importDefault(require("./PicklistItem"));
exports.PicklistItem = PicklistItem_1.default;
const PickingException_1 = __importDefault(require("./PickingException"));
exports.PickingException = PickingException_1.default;
const PackingJob_1 = __importDefault(require("./PackingJob"));
exports.PackingJob = PackingJob_1.default;
const PackingItem_1 = __importDefault(require("./PackingItem"));
exports.PackingItem = PackingItem_1.default;
const PhotoEvidence_1 = __importDefault(require("./PhotoEvidence"));
exports.PhotoEvidence = PhotoEvidence_1.default;
const Seal_1 = __importDefault(require("./Seal"));
exports.Seal = Seal_1.default;
const Rider_1 = __importDefault(require("./Rider"));
exports.Rider = Rider_1.default;
const Handover_1 = __importDefault(require("./Handover"));
exports.Handover = Handover_1.default;
const LMSShipment_1 = __importDefault(require("./LMSShipment"));
exports.LMSShipment = LMSShipment_1.default;
const PackingEvent_1 = __importDefault(require("./PackingEvent"));
exports.PackingEvent = PackingEvent_1.default;
Coupon_1.default.hasMany(CouponTranslation_1.default, {
    foreignKey: 'translationable_id',
    as: 'translations',
    scope: {
        translationable_type: 'App\\Models\\Coupon'
    }
});
CouponTranslation_1.default.belongsTo(Coupon_1.default, {
    foreignKey: 'translationable_id',
    as: 'coupon'
});
User_1.default.belongsTo(Role_1.default, { foreignKey: 'roleId', as: 'Role' });
Role_1.default.hasMany(User_1.default, { foreignKey: 'roleId' });
Role_1.default.belongsToMany(Permission_1.default, { through: RolePermission_1.default, foreignKey: 'roleId' });
Permission_1.default.belongsToMany(Role_1.default, { through: RolePermission_1.default, foreignKey: 'permissionId' });
PickingWave_1.default.belongsTo(User_1.default, { foreignKey: 'pickerId', as: 'Picker' });
User_1.default.hasMany(PickingWave_1.default, { foreignKey: 'pickerId', as: 'PickingWaves' });
PickingWave_1.default.hasMany(PicklistItem_1.default, { foreignKey: 'waveId', as: 'PicklistItems' });
PicklistItem_1.default.belongsTo(PickingWave_1.default, { foreignKey: 'waveId', as: 'Wave' });
PicklistItem_1.default.belongsTo(Order_1.default, { foreignKey: 'orderId', as: 'Order' });
Order_1.default.hasMany(PicklistItem_1.default, { foreignKey: 'orderId', as: 'PicklistItems' });
PicklistItem_1.default.belongsTo(User_1.default, { foreignKey: 'pickedBy', as: 'PickedBy' });
User_1.default.hasMany(PicklistItem_1.default, { foreignKey: 'pickedBy', as: 'PickedItems' });
PickingException_1.default.belongsTo(PickingWave_1.default, { foreignKey: 'waveId', as: 'Wave' });
PickingWave_1.default.hasMany(PickingException_1.default, { foreignKey: 'waveId', as: 'Exceptions' });
PickingException_1.default.belongsTo(Order_1.default, { foreignKey: 'orderId', as: 'Order' });
Order_1.default.hasMany(PickingException_1.default, { foreignKey: 'orderId', as: 'PickingExceptions' });
PickingException_1.default.belongsTo(User_1.default, { foreignKey: 'reportedBy', as: 'ReportedBy' });
User_1.default.hasMany(PickingException_1.default, { foreignKey: 'reportedBy', as: 'ReportedExceptions' });
PickingException_1.default.belongsTo(User_1.default, { foreignKey: 'assignedTo', as: 'AssignedTo' });
User_1.default.hasMany(PickingException_1.default, { foreignKey: 'assignedTo', as: 'AssignedExceptions' });
PickingWave_1.default.hasMany(PackingJob_1.default, { foreignKey: 'waveId', as: 'PackingJobs' });
PackingJob_1.default.belongsTo(PickingWave_1.default, { foreignKey: 'waveId', as: 'Wave' });
PackingJob_1.default.belongsTo(User_1.default, { foreignKey: 'packerId', as: 'Packer' });
User_1.default.hasMany(PackingJob_1.default, { foreignKey: 'packerId', as: 'PackingJobs' });
PackingJob_1.default.hasMany(PackingItem_1.default, { foreignKey: 'jobId', as: 'PackingItems' });
PackingItem_1.default.belongsTo(PackingJob_1.default, { foreignKey: 'jobId', as: 'Job' });
PackingItem_1.default.belongsTo(Order_1.default, { foreignKey: 'orderId', as: 'Order' });
Order_1.default.hasMany(PackingItem_1.default, { foreignKey: 'orderId', as: 'PackingItems' });
PackingJob_1.default.hasMany(PhotoEvidence_1.default, { foreignKey: 'jobId', as: 'PhotoEvidence' });
PhotoEvidence_1.default.belongsTo(PackingJob_1.default, { foreignKey: 'jobId', as: 'Job' });
PhotoEvidence_1.default.belongsTo(Order_1.default, { foreignKey: 'orderId', as: 'Order' });
Order_1.default.hasMany(PhotoEvidence_1.default, { foreignKey: 'orderId', as: 'PhotoEvidence' });
PhotoEvidence_1.default.belongsTo(User_1.default, { foreignKey: 'verifiedBy', as: 'VerifiedBy' });
User_1.default.hasMany(PhotoEvidence_1.default, { foreignKey: 'verifiedBy', as: 'VerifiedPhotos' });
PackingJob_1.default.hasMany(Seal_1.default, { foreignKey: 'jobId', as: 'Seals' });
Seal_1.default.belongsTo(PackingJob_1.default, { foreignKey: 'jobId', as: 'Job' });
Seal_1.default.belongsTo(Order_1.default, { foreignKey: 'orderId', as: 'Order' });
Order_1.default.hasMany(Seal_1.default, { foreignKey: 'orderId', as: 'Seals' });
Seal_1.default.belongsTo(User_1.default, { foreignKey: 'appliedBy', as: 'AppliedBy' });
User_1.default.hasMany(Seal_1.default, { foreignKey: 'appliedBy', as: 'AppliedSeals' });
Seal_1.default.belongsTo(User_1.default, { foreignKey: 'verifiedBy', as: 'VerifiedBy' });
User_1.default.hasMany(Seal_1.default, { foreignKey: 'verifiedBy', as: 'VerifiedSeals' });
PackingJob_1.default.hasOne(Handover_1.default, { foreignKey: 'jobId', as: 'Handover' });
Handover_1.default.belongsTo(PackingJob_1.default, { foreignKey: 'jobId', as: 'Job' });
Handover_1.default.belongsTo(Rider_1.default, { foreignKey: 'riderId', as: 'Rider' });
Rider_1.default.hasMany(Handover_1.default, { foreignKey: 'riderId', as: 'Handovers' });
Handover_1.default.belongsTo(User_1.default, { foreignKey: 'cancellationBy', as: 'CancelledBy' });
User_1.default.hasMany(Handover_1.default, { foreignKey: 'cancellationBy', as: 'CancelledHandovers' });
Handover_1.default.hasMany(LMSShipment_1.default, { foreignKey: 'handoverId', as: 'LMSShipments' });
LMSShipment_1.default.belongsTo(Handover_1.default, { foreignKey: 'handoverId', as: 'Handover' });
PackingJob_1.default.hasMany(PackingEvent_1.default, { foreignKey: 'jobId', as: 'Events' });
PackingEvent_1.default.belongsTo(PackingJob_1.default, { foreignKey: 'jobId', as: 'Job' });
PackingEvent_1.default.belongsTo(User_1.default, { foreignKey: 'userId', as: 'User' });
User_1.default.hasMany(PackingEvent_1.default, { foreignKey: 'userId', as: 'PackingEvents' });

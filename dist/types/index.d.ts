import { Request } from 'express';
export interface ApiResponse<T = any> {
    statusCode: number;
    success: boolean;
    data?: T;
    error?: string | null;
}
export interface RoleAttributes {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PermissionAttributes {
    id: number;
    module: string;
    action: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface RolePermissionAttributes {
    id: number;
    roleId: number;
    permissionId: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
    permissions: string[];
}
export interface UserAttributes {
    id: number;
    email: string;
    password: string;
    roleId: number;
    isActive: boolean;
    availabilityStatus: 'available' | 'break' | 'off-shift';
    createdAt: Date;
    updatedAt: Date;
}
export interface UserCreationAttributes {
    email: string;
    password: string;
    roleId?: number;
    isActive?: boolean;
    availabilityStatus?: 'available' | 'break' | 'off-shift';
}
export interface CouponAttributes {
    id: number;
    title: string;
    code: string;
    start_date: string;
    expire_date: string;
    min_purchase: number;
    max_discount: number;
    discount: number;
    discount_type: string;
    coupon_type: string;
    limit: number;
    status: number;
    created_at: string;
    updated_at: string;
    data: string;
    total_uses: number;
    module_id: number;
    created_by: string;
    customer_id: string;
    slug: string | null;
    store_id: number;
}
export interface CouponCreationAttributes {
    title: string;
    code: string;
    start_date: string;
    expire_date: string;
    min_purchase?: number;
    max_discount?: number;
    discount: number;
    discount_type?: string;
    coupon_type?: string;
    limit?: number;
    status?: number;
    data?: string;
    total_uses?: number;
    module_id: number;
    created_by: string;
    customer_id?: string;
    slug?: string | null;
    store_id: number;
}
export interface CouponTranslationAttributes {
    id: number;
    translationable_type: string;
    translationable_id: number;
    locale: string;
    key: string;
    value: string;
    created_at: string | null;
    updated_at: string | null;
}
export interface CouponTranslationCreationAttributes {
    translationable_type: string;
    translationable_id: number;
    locale: string;
    key: string;
    value: string;
    created_at?: string | null;
    updated_at?: string | null;
}
export interface CartItem {
    sku: number;
    amount: number;
}
export interface OrderAttributes {
    id: number;
    user_id: number;
    cart: CartItem[];
    coupon_discount_amount: number;
    order_amount: number;
    order_type: string;
    payment_method: string;
    store_id: number;
    distance: number;
    discount_amount: number;
    tax_amount: number;
    address: string;
    latitude: number;
    longitude: number;
    contact_person_name: string;
    contact_person_number: string;
    address_type: string;
    is_scheduled: number;
    scheduled_timestamp: number;
    promised_delv_tat: string;
    created_at: number;
    updated_at: number;
}
export interface OrderCreationAttributes {
    user_id: number;
    cart: CartItem[];
    coupon_discount_amount?: number;
    order_amount: number;
    order_type: string;
    payment_method: string;
    store_id: number;
    distance?: number;
    discount_amount?: number;
    tax_amount?: number;
    address: string;
    latitude?: number;
    longitude?: number;
    contact_person_name?: string;
    contact_person_number: string;
    address_type?: string;
    is_scheduled?: number;
    scheduled_timestamp?: number;
    promised_delv_tat?: string;
    created_at?: number;
    updated_at?: number;
}
export interface S3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}
export interface LMSIntegrationConfig {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}
export interface PackingJobAttributes {
    id: number;
    jobNumber: string;
    waveId: number;
    packerId?: number;
    status: 'PENDING' | 'PACKING' | 'VERIFYING' | 'COMPLETED' | 'CANCELLED' | 'AWAITING_HANDOVER' | 'HANDOVER_ASSIGNED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    handoverAt?: Date;
    totalItems: number;
    packedItems: number;
    verifiedItems: number;
    estimatedDuration: number;
    slaDeadline: Date;
    workflowType: 'PICKER_PACKS' | 'DEDICATED_PACKER';
    specialInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PackingJobCreationAttributes {
    jobNumber?: string;
    waveId: number;
    packerId?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    workflowType?: 'PICKER_PACKS' | 'DEDICATED_PACKER';
    specialInstructions?: string;
    slaDeadline?: Date;
    totalItems?: number;
    estimatedDuration?: number;
}
export interface PackingItemAttributes {
    id: number;
    jobId: number;
    orderId: number;
    sku: string;
    quantity: number;
    pickedQuantity: number;
    packedQuantity: number;
    verifiedQuantity: number;
    status: 'PENDING' | 'PACKING' | 'VERIFIED' | 'COMPLETED';
    verificationNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PackingItemCreationAttributes {
    jobId: number;
    orderId: number;
    sku: string;
    quantity: number;
    pickedQuantity: number;
}
export interface PhotoEvidenceAttributes {
    id: number;
    jobId: number;
    orderId?: number;
    photoType: 'PRE_PACK' | 'POST_PACK' | 'SEALED' | 'HANDOVER';
    photoUrl: string;
    thumbnailUrl?: string;
    metadata: {
        timestamp: Date;
        location?: string;
        device?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedBy?: number;
    verifiedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PhotoEvidenceCreationAttributes {
    jobId: number;
    orderId?: number;
    photoType: 'PRE_PACK' | 'POST_PACK' | 'SEALED' | 'HANDOVER';
    photoUrl: string;
    thumbnailUrl?: string;
    metadata: {
        timestamp: Date;
        location?: string;
        device?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
}
export interface SealAttributes {
    id: number;
    sealNumber: string;
    jobId: number;
    orderId?: number;
    sealType: 'PLASTIC' | 'PAPER' | 'METAL' | 'ELECTRONIC';
    appliedAt?: Date;
    appliedBy?: number;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'TAMPERED';
    verifiedBy?: number;
    verifiedAt?: Date;
    tamperEvidence?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SealCreationAttributes {
    sealNumber: string;
    jobId: number;
    orderId?: number;
    sealType: 'PLASTIC' | 'PAPER' | 'METAL' | 'ELECTRONIC';
    appliedAt?: Date;
    appliedBy?: number;
}
export interface RiderAttributes {
    id: number;
    riderCode: string;
    name: string;
    phone: string;
    email?: string;
    vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN';
    vehicleNumber?: string;
    availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'BREAK';
    currentLocation?: {
        lat: number;
        lng: number;
    };
    rating: number;
    totalDeliveries: number;
    isActive: boolean;
    lastActiveAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface RiderCreationAttributes {
    riderCode: string;
    name: string;
    phone: string;
    email?: string;
    vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN';
    vehicleNumber?: string;
    availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'BREAK';
    currentLocation?: {
        lat: number;
        lng: number;
    };
    rating?: number;
    totalDeliveries?: number;
    isActive?: boolean;
}
export interface HandoverAttributes {
    id: number;
    jobId: number;
    riderId: number;
    status: 'ASSIGNED' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    assignedAt: Date;
    confirmedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    cancellationReason?: string;
    cancellationBy?: number;
    lmsSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'RETRY';
    lmsSyncAttempts: number;
    lmsLastSyncAt?: Date;
    lmsErrorMessage?: string;
    trackingNumber?: string;
    manifestNumber?: string;
    specialInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface HandoverCreationAttributes {
    jobId: number;
    riderId: number;
    status?: 'ASSIGNED' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    assignedAt?: Date;
    specialInstructions?: string;
}
export interface LMSShipmentAttributes {
    id: number;
    handoverId: number;
    lmsReference: string;
    status: 'PENDING' | 'CREATED' | 'MANIFESTED' | 'IN_TRANSIT' | 'DELIVERED';
    lmsResponse: any;
    retryCount: number;
    lastRetryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface LMSShipmentCreationAttributes {
    handoverId: number;
    lmsReference: string;
    status?: 'PENDING' | 'CREATED' | 'MANIFESTED' | 'IN_TRANSIT' | 'DELIVERED';
    lmsResponse: any;
    retryCount?: number;
}
export interface PackingEventAttributes {
    id: number;
    jobId: number;
    eventType: 'PACKING_STARTED' | 'ITEM_PACKED' | 'ITEM_VERIFIED' | 'PACKING_COMPLETED' | 'HANDOVER_ASSIGNED' | 'HANDOVER_CONFIRMED' | 'HANDOVER_STATUS_UPDATED' | 'LMS_SYNCED';
    eventData: any;
    userId?: number;
    timestamp: Date;
    createdAt: Date;
}
export interface PackingEventCreationAttributes {
    jobId: number;
    eventType: 'PACKING_STARTED' | 'ITEM_PACKED' | 'ITEM_VERIFIED' | 'PACKING_COMPLETED' | 'HANDOVER_ASSIGNED' | 'HANDOVER_CONFIRMED' | 'HANDOVER_STATUS_UPDATED' | 'LMS_SYNCED';
    eventData: any;
    userId?: number;
    timestamp: Date;
}
export interface StartPackingRequest {
    waveId: number;
    packerId?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    workflowType?: 'PICKER_PACKS' | 'DEDICATED_PACKER';
    specialInstructions?: string;
}
export interface VerifyItemRequest {
    jobId: number;
    orderId: number;
    sku: string;
    packedQuantity: number;
    verificationNotes?: string;
}
export interface CompletePackingRequest {
    jobId: number;
    photos: {
        photoType: 'POST_PACK' | 'SEALED';
        photoUrl: string;
        thumbnailUrl?: string;
        orderId?: number;
        metadata?: {
            location?: string;
            device?: string;
            coordinates?: {
                lat: number;
                lng: number;
            };
        };
    }[];
    seals?: {
        sealNumber: string;
        sealType: 'PLASTIC' | 'PAPER' | 'METAL' | 'ELECTRONIC';
        orderId?: number;
    }[];
}
export interface AssignRiderRequest {
    jobId: number;
    riderId: number;
    specialInstructions?: string;
}
export interface ConfirmHandoverRequest {
    handoverId: number;
    riderId: number;
    confirmationCode?: string;
}
export interface PackingJobStatus {
    id: number;
    jobNumber: string;
    status: string;
    progress: {
        totalItems: number;
        packedItems: number;
        verifiedItems: number;
        percentage: number;
    };
    sla: {
        deadline: Date;
        remaining: number;
        status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
    };
    assignedPacker?: {
        id: number;
        name: string;
    };
    handover?: {
        id: number;
        status: string;
        rider?: {
            id: number;
            name: string;
            phone: string;
        };
    };
}
export interface SLAStatus {
    totalJobs: number;
    onTrack: number;
    atRisk: number;
    breached: number;
    averageRemainingTime: number;
    criticalJobs: number;
}
export interface PackingEvent {
    type: string;
    jobId: number;
    data: any;
    timestamp: Date;
    userId?: number;
}
export interface RiderLocationUpdate {
    riderId: number;
    location: {
        lat: number;
        lng: number;
    };
    timestamp: Date;
}
export interface WarehouseAttributes {
    id: number;
    warehouse_code: string;
    name: string;
    type: 'MAIN' | 'SATELLITE' | 'STOREFRONT' | 'DISTRIBUTION';
    status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    emergency_contact?: string;
    operational_hours?: any;
    capacity_sqft?: number;
    storage_capacity_units?: number;
    current_utilization_percentage: number;
    services_offered?: any;
    supported_fulfillment_types?: any;
    is_auto_assignment_enabled: boolean;
    max_orders_per_day: number;
    sla_hours: number;
    lms_warehouse_id?: string;
    integration_status: 'PENDING' | 'COMPLETED' | 'FAILED';
    created_by: number;
    updated_by?: number;
    created_at: Date;
    updated_at: Date;
}
export interface WarehouseCreationAttributes extends Omit<WarehouseAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export interface WarehouseZoneAttributes {
    id: number;
    warehouse_id: number;
    zone_code: string;
    zone_name: string;
    zone_type: 'PICKING' | 'STORAGE' | 'RECEIVING' | 'PACKING' | 'SHIPPING' | 'RETURNS';
    temperature_zone: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
    capacity_units?: number;
    current_utilization: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface WarehouseZoneCreationAttributes extends Omit<WarehouseZoneAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export interface WarehouseStaffAssignmentAttributes {
    id: number;
    warehouse_id: number;
    user_id: number;
    role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER';
    assigned_date: Date;
    end_date?: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface WarehouseStaffAssignmentCreationAttributes extends Omit<WarehouseStaffAssignmentAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export interface CreateWarehouseRequest {
    warehouse_code: string;
    name: string;
    type: 'MAIN' | 'SATELLITE' | 'STOREFRONT' | 'DISTRIBUTION';
    address: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    emergency_contact?: string;
    operational_hours?: any;
    capacity_sqft?: number;
    storage_capacity_units?: number;
    services_offered?: any;
    supported_fulfillment_types?: any;
    is_auto_assignment_enabled?: boolean;
    max_orders_per_day?: number;
    sla_hours?: number;
    lms_warehouse_id?: string;
}
export interface UpdateWarehouseRequest extends Partial<CreateWarehouseRequest> {
}
export interface WarehouseStatusUpdateRequest {
    status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
}
export interface CreateZoneRequest {
    zone_code: string;
    zone_name: string;
    zone_type: 'PICKING' | 'STORAGE' | 'RECEIVING' | 'PACKING' | 'SHIPPING' | 'RETURNS';
    temperature_zone?: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
    capacity_units?: number;
}
export interface UpdateZoneRequest extends Partial<CreateZoneRequest> {
}
export interface AssignStaffRequest {
    user_id: number;
    role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER';
    assigned_date: Date;
    end_date?: Date;
}
export interface WarehouseFilters {
    status?: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
    type?: 'MAIN' | 'SATELLITE' | 'STOREFRONT' | 'DISTRIBUTION';
    city?: string;
    state?: string;
    country?: string;
    has_capacity?: string | boolean;
    page?: number;
    limit?: number;
    search?: string;
}
export interface WarehouseListResponse {
    warehouses: WarehouseAttributes[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        roleId: number;
        role: string;
        permissions: string[];
        availabilityStatus: 'available' | 'break' | 'off-shift';
        createdAt: Date;
    };
    body: any;
    params: any;
    query: any;
    headers: any;
}
export interface VersionCheckRequest extends Request {
    user?: any;
    headers: any;
}

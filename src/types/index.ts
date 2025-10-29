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
  currentFcId?: number; // Current selected FC ID
  currentDcId?: number; // Current selected DC ID
  availableFcs?: number[]; // Available FC IDs for the user
  name?: string; // User's name
  phone?: string; // User's phone number
  exp?: number; // JWT expiration timestamp
  iat?: number; // JWT issued at timestamp
}

// types.ts
export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  roleId: number;
  isActive: boolean;
  availabilityStatus: 'available' | 'break' | 'off-shift';
  createdAt: Date;
  updatedAt: Date;

  // Rider-specific fields if you want them here
  riderCode?: string;
  name?: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  currentLocation?: string;
  rating?: number;
  totalDeliveries?: number;
}

export interface UserCreationAttributes {
  email: string;
  password: string;
  roleId?: number;
  isActive?: boolean;
  availabilityStatus?: 'available' | 'break' | 'off-shift';
  name?: string;
  phone?: string;
}

// Add these to your existing types/index.ts file

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

// New Order Types
export interface CartItem {
  sku: number;
  amount: number; // This represents the price/amount
  quantity?: number; // Optional quantity field for future use
}

export interface OrderAttributes {
  id: number;
  user_id: number | null;
  order_amount: number;
  return_amount: number;
  return_date: Date | null;
  coupon_discount_amount: number;
  coupon_discount_title: string | null;
  payment_status: string;
  order_status: string;
  is_try_and_buy: number;
  try_and_buy_fee: number;
  gift_fee: number;
  total_tax_amount: number;
  payment_method: string | null;
  transaction_reference: string | null;
  delivery_address_id: number | null;
  delivery_man_id: number | null;
  coupon_code: string | null;
  order_note: string | null;
  order_type: string;
  checked: number;
  store_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  delivery_charge: number;
  schedule_at: Date | null;
  scheduled_slot: string | null;
  callback: string | null;
  otp: string | null;
  pending: Date | null;
  accepted: Date | null;
  confirmed: Date | null;
  processing: Date | null;
  handover: Date | null;
  picked_up: Date | null;
  delivered: Date | null;
  reached_delivery_timestamp: Date | null;
  canceled: Date | null;
  refund_requested: Date | null;
  refunded: Date | null;
  delivery_address: string | null;
  scheduled: number;
  store_discount_amount: number;
  original_delivery_charge: number;
  failed: Date | null;
  adjusment: number;
  edited: number;
  delivery_time: string | null;
  zone_id: number | null;
  module_id: number;
  order_attachment: string | null;
  parcel_category_id: number | null;
  receiver_details: string | null;
  charge_payer: string | null;
  distance: number;
  dm_tips: number;
  free_delivery_by: string | null;
  refund_request_canceled: Date | null;
  prescription_order: number;
  tax_status: string | null;
  dm_vehicle_id: number | null;
  cancellation_reason: string | null;
  canceled_by: string | null;
  coupon_created_by: string | null;
  discount_on_product_by: string;
  processing_time: string | null;
  unavailable_item_note: string | null;
  cutlery: number;
  delivery_instruction: string | null;
  tax_percentage: number | null;
  additional_charge: number;
  order_proof: string | null;
  partially_paid_amount: number;
  is_guest: number;
  flash_admin_discount_amount: number;
  flash_store_discount_amount: number;
  cash_back_id: number | null;
  extra_packaging_amount: number;
  ref_bonus_amount: number;
  EcommInvoiceID: string | null;
  EcommOrderID: string | null;
  awb_number: string | null;
  promised_duration: string | null;
  ecom_pidge_status: number;
  fc_id: number | null;

  // Legacy fields for backward compatibility
  cart?: CartItem[];
  orderDetails?: any[];
  ecomLogs?: any[];
}

export interface OrderCreationAttributes {
  user_id?: number | null;
  order_amount?: number;
  return_amount?: number;
  return_date?: Date | null;
  coupon_discount_amount?: number;
  coupon_discount_title?: string | null;
  payment_status?: string;
  order_status?: string;
  is_try_and_buy?: number;
  try_and_buy_fee?: number;
  gift_fee?: number;
  total_tax_amount?: number;
  payment_method?: string | null;
  transaction_reference?: string | null;
  delivery_address_id?: number | null;
  delivery_man_id?: number | null;
  coupon_code?: string | null;
  order_note?: string | null;
  order_type?: string;
  checked?: number;
  store_id?: number | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  delivery_charge?: number;
  schedule_at?: Date | null;
  scheduled_slot?: string | null;
  callback?: string | null;
  otp?: string | null;
  pending?: Date | null;
  accepted?: Date | null;
  confirmed?: Date | null;
  processing?: Date | null;
  handover?: Date | null;
  picked_up?: Date | null;
  delivered?: Date | null;
  reached_delivery_timestamp?: Date | null;
  canceled?: Date | null;
  refund_requested?: Date | null;
  refunded?: Date | null;
  delivery_address?: string | null;
  scheduled?: number;
  store_discount_amount?: number;
  original_delivery_charge?: number;
  failed?: Date | null;
  adjusment?: number;
  edited?: number;
  delivery_time?: string | null;
  zone_id?: number | null;
  module_id?: number;
  order_attachment?: string | null;
  parcel_category_id?: number | null;
  receiver_details?: string | null;
  charge_payer?: string | null;
  distance?: number;
  dm_tips?: number;
  free_delivery_by?: string | null;
  refund_request_canceled?: Date | null;
  prescription_order?: number;
  tax_status?: string | null;
  dm_vehicle_id?: number | null;
  cancellation_reason?: string | null;
  canceled_by?: string | null;
  coupon_created_by?: string | null;
  discount_on_product_by?: string;
  processing_time?: string | null;
  unavailable_item_note?: string | null;
  cutlery?: number;
  delivery_instruction?: string | null;
  tax_percentage?: number | null;
  additional_charge?: number;
  order_proof?: string | null;
  partially_paid_amount?: number;
  is_guest?: number;
  flash_admin_discount_amount?: number;
  flash_store_discount_amount?: number;
  cash_back_id?: number | null;
  extra_packaging_amount?: number;
  ref_bonus_amount?: number;
  EcommInvoiceID?: string | null;
  EcommOrderID?: string | null;
  awb_number?: string | null;
  promised_duration?: string | null;
  ecom_pidge_status?: number;
  fc_id?: number | null;
}

// Packing and Handover Module Types

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
  status:
    | 'PENDING'
    | 'PACKING'
    | 'VERIFYING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'AWAITING_HANDOVER'
    | 'HANDOVER_ASSIGNED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  handoverAt?: Date;
  totalItems: number;
  packedItems: number;
  verifiedItems: number;
  estimatedDuration: number; // in minutes
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
  status?:
    | 'PENDING'
    | 'PACKING'
    | 'VERIFYING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'AWAITING_HANDOVER'
    | 'HANDOVER_ASSIGNED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  workflowType?: 'PICKER_PACKS' | 'DEDICATED_PACKER';
  specialInstructions?: string;
  slaDeadline?: Date;
  totalItems?: number;
  packedItems?: number;
  verifiedItems?: number;
  estimatedDuration?: number;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  handoverAt?: Date;
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
    coordinates?: { lat: number; lng: number };
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
    coordinates?: { lat: number; lng: number };
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
  currentLocation?: { lat: number; lng: number };
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
  currentLocation?: { lat: number; lng: number };
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
  trackingNumber?: string;
  manifestNumber?: string;
  lmsSyncStatus?: 'PENDING' | 'SYNCED' | 'FAILED' | 'RETRY';
  lmsSyncAttempts?: number;
  lmsLastSyncAt?: Date;
  lmsErrorMessage?: string;
}

export interface PackingEventAttributes {
  id: number;
  jobId: number;
  eventType:
    | 'PACKING_STARTED'
    | 'ITEM_PACKED'
    | 'ITEM_VERIFIED'
    | 'PACKING_COMPLETED'
    | 'HANDOVER_ASSIGNED'
    | 'HANDOVER_CONFIRMED'
    | 'HANDOVER_STATUS_UPDATED'
    | 'LMS_SYNCED';
  eventData: any;
  userId?: number;
  timestamp: Date;
  createdAt: Date;
}

export interface PackingEventCreationAttributes {
  jobId: number;
  eventType:
    | 'PACKING_STARTED'
    | 'ITEM_PACKED'
    | 'ITEM_VERIFIED'
    | 'PACKING_COMPLETED'
    | 'HANDOVER_ASSIGNED'
    | 'HANDOVER_CONFIRMED'
    | 'HANDOVER_STATUS_UPDATED'
    | 'LMS_SYNCED';
  eventData: any;
  userId?: number;
  timestamp: Date;
}

// API Request/Response Types
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
      coordinates?: { lat: number; lng: number };
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
    remaining: number; // minutes
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

// Event Types for WebSocket
export interface PackingEvent {
  type: string;
  jobId: number;
  data: any;
  timestamp: Date;
  userId?: number;
}

export interface RiderLocationUpdate {
  riderId: number;
  location: { lat: number; lng: number };
  timestamp: Date;
}

// Warehouse Module Types
export interface WarehouseAttributes {
  id: number;
  warehouse_code: string;
  name: string;
  type: 'MAIN' | 'SATELLITE' | 'STOREFRONT' | 'DISTRIBUTION';
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';

  // Location Information
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;

  // Contact Information
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  emergency_contact?: string;

  // Operational Details
  operational_hours?: any;
  capacity_sqft?: number;
  storage_capacity_units?: number;
  current_utilization_percentage: number;

  // Services & Capabilities
  services_offered?: any;
  supported_fulfillment_types?: any;

  // Configuration
  is_auto_assignment_enabled: boolean;
  max_orders_per_day: number;
  sla_hours: number;

  // Integration Details
  lms_warehouse_id?: string;
  integration_status: 'PENDING' | 'COMPLETED' | 'FAILED';

  // Audit Fields
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseCreationAttributes
  extends Omit<WarehouseAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface WarehouseZoneAttributes {
  id: number;
  warehouse_id: number;
  zone_code: string;
  zone_name: string;
  zone_type:
    | 'PICKING'
    | 'STORAGE'
    | 'RECEIVING'
    | 'PACKING'
    | 'SHIPPING'
    | 'RETURNS';
  temperature_zone: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
  capacity_units?: number;
  current_utilization: number;
  is_active: boolean;

  // Audit Fields
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseZoneCreationAttributes
  extends Omit<WarehouseZoneAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface WarehouseStaffAssignmentAttributes {
  id: number;
  warehouse_id: number;
  user_id: number;
  role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER';
  assigned_date: Date;
  end_date?: Date;
  is_active: boolean;

  // Audit Fields
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseStaffAssignmentCreationAttributes
  extends Omit<
    WarehouseStaffAssignmentAttributes,
    'id' | 'created_at' | 'updated_at'
  > {}

// Warehouse API Request/Response Types
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

export interface UpdateWarehouseRequest
  extends Partial<CreateWarehouseRequest> {}

export interface WarehouseStatusUpdateRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
}

export interface CreateZoneRequest {
  zone_code: string;
  zone_name: string;
  zone_type:
    | 'PICKING'
    | 'STORAGE'
    | 'RECEIVING'
    | 'PACKING'
    | 'SHIPPING'
    | 'RETURNS';
  temperature_zone?: 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
  capacity_units?: number;
}

export interface UpdateZoneRequest extends Partial<CreateZoneRequest> {}

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

export interface ZoneListResponse {
  zones: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StaffListResponse {
  staff: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WarehouseDetailResponse {
  warehouse: any;
  zones: {
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  staff: {
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GRNAttributes {
  id: number;
  po_id: number;
  status:
    | 'partial'
    | 'completed'
    | 'closed'
    | 'pending-qc'
    | 'variance-review'
    | 'rtv-initiated';
  created_by: number;
  close_reason?: string | null;
  approved_by?: number | null;
  fc_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type GRNCreationAttributes = Omit<GRNAttributes, 'id'>;

export interface GRNLineAttributes {
  id: number;
  grn_id: number;
  sku_id: string;
  ean?: string;
  ordered_qty: number;
  rejected_qty: number;
  received_qty: number;
  pending_qty: number;
  qc_pass_qty?: number;
  held_qty?: number;
  rtv_qty?: number;
  qc_fail_qty: number;
  variance_reason?: string;
  line_status: string;
  putaway_status?: string;
  remarks?: string | null;
  expected_date?: Date;
  received_date?: Date;
  qc_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export type GRNLineCreationAttributes = Omit<GRNLineAttributes, 'id'>;

export interface GRNBatchAttributes {
  id: number;
  grn_line_id: number;
  batch_no: string;
  expiry_date: Date;
  qty: number;
  created_at?: Date;
  updated_at?: Date;
}

export type GRNBatchCreationAttributes = Omit<GRNBatchAttributes, 'id'>;

export interface GRNPhotoAttributes {
  id: number;
  sku_id: string;
  grn_id: number;
  po_id: number;
  url: string;
  reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type GRNPhotoCreationAttributes = Omit<GRNPhotoAttributes, 'id'>;

export interface GRNRequest {
  po_id: number;
  vendor: string;
  status:
    | 'partial'
    | 'completed'
    | 'closed'
    | 'pending-qc'
    | 'variance-review'
    | 'rtv-initiated';
}

// New interface for modified GRN create flow with SKU-level photos
export interface CreateFullGRNInput {
  poId: number;
  lines: {
    skuId?: string;
    ean?: string;
    orderedQty: number;
    receivedQty: number;
    rejectedQty: number;
    qcPassQty?: number;
    remarks?: string;
    heldQty?: number;
    rtvQty?: number;
    lineStatus?: string;
    // SKU-level photos (array of URLs or comma-separated string)
    photos?: string | string[]; // Array of photo URLs or comma-separated string
    batches?: {
      batchNo: string;
      expiry: Date;
      qty: number;
    }[];
  }[];
  close_reason?: string;
  status?: 'partial' | 'completed' | 'closed' | 'pending-qc' | 'rtv-initiated';
}
export interface scanItemRequest {
  grnId: number;
  skuId: string;
  receivedQty: number;
  batchNo: string;
  expiry: Date;
  photos: string[];
  variance_reason?:
    | 'short'
    | 'excess'
    | 'damage'
    | 'wrong'
    | 'near-expiry'
    | null;
  remarks?: string | null;
  orderedQty: number;
  qcPassQty: number;
  qcFailQty: number;
}

// --- Line ---
export interface CreateGRNLineRequest {
  grnId: number;
  skuId: string;
  orderedQty: number;
  receivedQty: number;
  rejectedQty?: number;
  qcPassQty?: number;
  qcFailQty?: number;
  varianceReason?:
    | 'short'
    | 'excess'
    | 'damage'
    | 'wrong'
    | 'near-expiry'
    | null;
  line_status: string;
  held_qty?: number;
  rtv_qty?: number;
  remarks?: string;
}

// --- Batch ---
export interface CreateGRNBatchRequest {
  grnLineId: number;
  batchNo: string;
  expiry: Date;
  qty: number;
}

// --- Photo ---
export interface CreateGRNPhotoRequest {
  grnLineId: number;
  grnBatchId: number;
  photos: string[];
  reason?: string;
}

export interface GRNFilters {
  status?: 'in-progress' | 'completed' | 'closed';
  po_id?: number;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}
// Request type extensions for middleware
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    roleId: number;
    role: string;
    permissions: string[];
    availabilityStatus: 'available' | 'break' | 'off-shift';
    createdAt: Date;
    currentFcId?: number;
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

// Distribution Center and Fulfillment Center Types
export interface DistributionCenterAttributes {
  id: number;
  dc_code: string;
  name: string;
  type: 'MAIN' | 'REGIONAL' | 'LOCAL';
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
  lms_dc_id?: string;
  integration_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface DistributionCenterCreationAttributes
  extends Omit<DistributionCenterAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface FulfillmentCenterAttributes {
  id: number;
  fc_code: string;
  name: string;
  dc_id: number;
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
  lms_fc_id?: string;
  integration_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface FulfillmentCenterCreationAttributes
  extends Omit<FulfillmentCenterAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface UserFulfillmentCenterAttributes {
  id: number;
  user_id: number;
  fc_id: number;
  role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER' | 'VIEWER';
  assigned_date: Date;
  end_date?: Date;
  is_active: boolean;
  is_default: boolean;
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserFulfillmentCenterCreationAttributes
  extends Omit<UserFulfillmentCenterAttributes, 'id' | 'created_at' | 'updated_at'> {}

// API Request/Response Types for DC/FC
export interface CreateDistributionCenterRequest {
  dc_code: string;
  name: string;
  type: 'MAIN' | 'REGIONAL' | 'LOCAL';
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
  lms_dc_id?: string;
}

export interface CreateFulfillmentCenterRequest {
  fc_code: string;
  name: string;
  dc_id: number;
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
  lms_fc_id?: string;
}

export interface AssignUserToFulfillmentCenterRequest {
  user_id: number;
  fc_id: number;
  role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER' | 'VIEWER';
  assigned_date?: Date;
  end_date?: Date;
  is_default?: boolean;
}

export interface UserFulfillmentCenterResponse {
  id: number;
  user: {
    id: number;
    email: string;
    name?: string;
    phone?: string;
  };
  fulfillment_center: {
    id: number;
    fc_code: string;
    name: string;
    dc_id: number;
    distribution_center: {
      id: number;
      dc_code: string;
      name: string;
    };
  };
  role: string;
  assigned_date: Date;
  end_date?: Date;
  is_active: boolean;
  is_default: boolean;
}

export interface FulfillmentCenterSelectionResponse {
  id: number;
  fc_code: string;
  name: string;
  dc_id: number;
  distribution_center: {
    id: number;
    dc_code: string;
    name: string;
  };
  role: string;
  is_default: boolean;
}

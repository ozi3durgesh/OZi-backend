/**
 * Return Process Constants
 * Centralized configuration for return-related operations
 * Following user preference for dynamic configuration over hardcoded values
 */

export const RETURN_CONSTANTS = {
  // Return statuses
  STATUSES: {
    PENDING: 'pending',
    APPROVED: 'approved',
    PICKUP_SCHEDULED: 'pickup_scheduled',
    IN_TRANSIT: 'in_transit',
    RECEIVED: 'received',
    QC_PENDING: 'qc_pending',
    QC_COMPLETED: 'qc_completed',
    REFUND_INITIATED: 'refund_initiated',
    REFUNDED: 'refunded',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },

  // Return reasons
  REASONS: {
    DEFECTIVE_PRODUCT: 'defective_product',
    WRONG_ITEM: 'wrong_item',
    DAMAGED_IN_TRANSIT: 'damaged_in_transit',
    NOT_AS_DESCRIBED: 'not_as_described',
    SIZE_ISSUE: 'size_issue',
    QUALITY_ISSUE: 'quality_issue',
    CUSTOMER_CHANGED_MIND: 'customer_changed_mind',
    DUPLICATE_ORDER: 'duplicate_order',
    LATE_DELIVERY: 'late_delivery',
    TRY_AND_BUY_NOT_SATISFIED: 'try_and_buy_not_satisfied',
    TRY_AND_BUY_EXPIRED: 'try_and_buy_expired',
    OTHER: 'other'
  },

  // Return types
  TYPES: {
    FULL_RETURN: 'full_return',
    PARTIAL_RETURN: 'partial_return',
    EXCHANGE: 'exchange',
    TRY_AND_BUY_RETURN: 'try_and_buy_return'
  },

  // QC statuses
  QC_STATUSES: {
    PENDING: 'pending',
    PASSED: 'passed',
    FAILED: 'failed',
    NEEDS_REPAIR: 'needs_repair',
    DISPOSAL: 'disposal'
  },

  // GRN return statuses (extends existing GRN statuses)
  GRN_RETURN_STATUSES: {
    RETURN_PENDING: 'return_pending',
    RETURN_RECEIVED: 'return_received',
    RETURN_QC_PENDING: 'return_qc_pending',
    RETURN_QC_COMPLETED: 'return_qc_completed',
    RETURN_PUTAWAY_PENDING: 'return_putaway_pending',
    RETURN_PUTAWAY_COMPLETED: 'return_putaway_completed',
    RETURN_DISPOSED: 'return_disposed'
  },

  // Putaway statuses
  PUTAWAY_STATUSES: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },

  // Default values
  DEFAULTS: {
    STATUS: 'pending',
    QC_STATUS: 'pending',
    PUTAWAY_STATUS: 'pending',
    TOTAL_ITEMS_COUNT: 0,
    TOTAL_RETURN_AMOUNT: 0.00,
    RETURN_TYPE: 'full_return',
    IS_ACTIVE: 1,
    PRIORITY: 'normal'
  },

  // Validation limits
  LIMITS: {
    MAX_RETURN_NOTES_LENGTH: 1000,
    MAX_PICKUP_ADDRESS_LENGTH: 1000,
    MAX_QC_NOTES_LENGTH: 500,
    MAX_PUTAWAY_NOTES_LENGTH: 500,
    MAX_PIDGE_TRACKING_ID_LENGTH: 100,
    MAX_RETURN_REASON_LENGTH: 50,
    MAX_STATUS_LENGTH: 50,
    MAX_IMAGES_COUNT: 10
  },

  // Return order ID generation
  RETURN_ORDER_ID: {
    SUFFIX: '-PD',
    PREFIX: 'RET',
    MIN_LENGTH: 8,
    MAX_LENGTH: 50
  },

  // Timeline event types
  TIMELINE_EVENTS: {
    CREATED: 'created',
    APPROVED: 'approved',
    PICKUP_SCHEDULED: 'pickup_scheduled',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    RECEIVED: 'received',
    QC_STARTED: 'qc_started',
    QC_COMPLETED: 'qc_completed',
    GRN_CREATED: 'grn_created',
    PUTAWAY_STARTED: 'putaway_started',
    PUTAWAY_COMPLETED: 'putaway_completed',
    REFUND_INITIATED: 'refund_initiated',
    REFUNDED: 'refunded',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    STATUS_UPDATED: 'status_updated'
  }
};

// Type definitions for better TypeScript support
export type ReturnStatus = typeof RETURN_CONSTANTS.STATUSES[keyof typeof RETURN_CONSTANTS.STATUSES];
export type ReturnReason = typeof RETURN_CONSTANTS.REASONS[keyof typeof RETURN_CONSTANTS.REASONS];
export type ReturnType = typeof RETURN_CONSTANTS.TYPES[keyof typeof RETURN_CONSTANTS.TYPES];
export type QCStatus = typeof RETURN_CONSTANTS.QC_STATUSES[keyof typeof RETURN_CONSTANTS.QC_STATUSES];
export type GRNReturnStatus = typeof RETURN_CONSTANTS.GRN_RETURN_STATUSES[keyof typeof RETURN_CONSTANTS.GRN_RETURN_STATUSES];
export type PutawayStatus = typeof RETURN_CONSTANTS.PUTAWAY_STATUSES[keyof typeof RETURN_CONSTANTS.PUTAWAY_STATUSES];
export type TimelineEvent = typeof RETURN_CONSTANTS.TIMELINE_EVENTS[keyof typeof RETURN_CONSTANTS.TIMELINE_EVENTS];

// Interface for return request creation
export interface ReturnRequestData {
  original_order_id: string;
  customer_id: number;
  return_reason: ReturnReason;
  status?: ReturnStatus;
  total_items_count?: number;
  total_return_amount?: number;
  pidge_tracking_id?: string | null;
  pickup_address?: object | null;
  return_notes?: string | null;
  images?: string[] | null;
  created_by?: number;
  is_try_and_buy?: boolean;
  try_and_buy_feedback?: string | null;
  try_and_buy_rating?: number | null;
}

// Interface for return item creation
export interface ReturnItemData {
  return_request_id: number;
  item_id: number;
  quantity: number;
  return_reason?: ReturnReason;
  item_details?: string | null;
  variation?: string | null;
  price?: number;
  images?: string[] | null;
  notes?: string | null;
  is_try_and_buy?: boolean;
  try_and_buy_feedback?: string | null;
  try_and_buy_rating?: number | null;
}

// Interface for Pidge webhook data
export interface PidgeWebhookData {
  id: string;
  return_order_id: string;
  original_order_id: string;
  customer_id: number;
  return_reason: ReturnReason;
  status: ReturnStatus;
  total_items_count: number;
  total_return_amount: number;
  pidge_tracking_id: string;
  pickup_address: object;
  return_notes?: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  created_by?: number;
}

// Interface for return timeline event
export interface ReturnTimelineData {
  return_request_id: number;
  event_type: TimelineEvent;
  status?: ReturnStatus;
  notes?: string | null;
  created_by?: number;
  metadata?: object | null;
}

// Interface for return GRN creation (using existing GRN tables)
export interface ReturnGrnData {
  return_request_id: number;
  received_quantity: number;
  expected_quantity: number;
  notes?: string | null;
  created_by: number;
}

// Interface for return putaway creation (using existing putaway tables)
export interface ReturnPutawayData {
  return_request_id: number;
  grn_id: number;
  grn_line_id: number;
  item_id: number;
  quantity: number;
  bin_location_id: string;
  notes?: string | null;
  putaway_by: number;
  is_try_and_buy?: boolean;
}

// Interface specifically for try and buy return requests
export interface TryAndBuyReturnData {
  original_order_id: string;
  customer_id: number;
  items: TryAndBuyReturnItem[];
  return_reason: 'try_and_buy_not_satisfied' | 'try_and_buy_expired';
  pickup_address?: object | null;
  return_notes?: string | null;
  images?: string[] | null;
  created_by?: number;
  customer_feedback?: string | null;
  overall_rating?: number | null;
}

// Interface for try and buy return items
export interface TryAndBuyReturnItem {
  item_id: number;
  quantity: number;
  item_details?: string | null;
  variation?: string | null;
  price?: number;
  images?: string[] | null;
  notes?: string | null;
  item_feedback?: string | null;
  item_rating?: number | null;
  try_and_buy_reason?: 'not_satisfied' | 'expired' | 'changed_mind';
}

// Bin location routing logic
export const RETURN_BIN_ROUTING = {
  TRY_AND_BUY: {
    BIN_PREFIX: 'BIN-TRY-BUY',
    DESCRIPTION: 'Try and buy products for customer suggestions',
    QC_REQUIRED: false,
    RESALE_PRIORITY: 'high',
    SPECIAL_HANDLING: 'customer_feedback_collection'
  },
  DEFECTIVE: {
    BIN_PREFIX: 'BIN-DEFECTIVE',
    DESCRIPTION: 'Defective products for disposal or repair',
    QC_REQUIRED: true,
    RESALE_PRIORITY: 'none',
    SPECIAL_HANDLING: 'disposal_assessment'
  },
  QUALITY_ISSUE: {
    BIN_PREFIX: 'BIN-QUALITY',
    DESCRIPTION: 'Quality issue products for QC review',
    QC_REQUIRED: true,
    RESALE_PRIORITY: 'low',
    SPECIAL_HANDLING: 'quality_review'
  },
  OTHER: {
    BIN_PREFIX: 'BIN-RETURN',
    DESCRIPTION: 'General return products',
    QC_REQUIRED: true,
    RESALE_PRIORITY: 'medium',
    SPECIAL_HANDLING: 'standard_assessment'
  }
};

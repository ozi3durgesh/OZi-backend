/**
 * Order Process Constants
 * Centralized configuration for order-related operations
 * Following user preference for dynamic configuration over hardcoded values
 */

export const ORDER_CONSTANTS = {
  // Order statuses
  STATUSES: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  
  // Payment statuses
  PAYMENT_STATUSES: {
    UNPAID: 'unpaid',
    PAID: 'paid',
    PARTIALLY_PAID: 'partially_paid',
    REFUNDED: 'refunded'
  },
  
  // Payment methods
  PAYMENT_METHODS: {
    CASH_ON_DELIVERY: 'cash_on_delivery',
    DIGITAL_PAYMENT: 'digital_payment',
    WALLET: 'wallet',
    OFFLINE_PAYMENT: 'offline_payment',
    PARTIAL_PAYMENT: 'partial_payment'
  },
  
  // Order types
  ORDER_TYPES: {
    TAKE_AWAY: 'take_away',
    DELIVERY: 'delivery',
    PARCEL: 'parcel'
  },
  
  // Discount types
  DISCOUNT_TYPES: {
    AMOUNT: 'amount',
    PERCENTAGE: 'percentage',
    FLASH_SALE: 'flash_sale'
  },
  
  // Default values
  DEFAULTS: {
    PRICE: 0.00,
    QUANTITY: 1,
    TAX_AMOUNT: 1.00,
    TOTAL_ADD_ON_PRICE: 0.00,
    DISCOUNT_TYPE: 'amount',
    ORDER_STATUS: 'pending',
    PAYMENT_STATUS: 'unpaid',
    TAX_PERCENTAGE: 10.00,
    DELIVERY_CHARGE: 0.00,
    STORE_DISCOUNT_AMOUNT: 0.00,
    COUPON_DISCOUNT_AMOUNT: 0.00,
    ZONE_ID: 1,
    MODULE_ID: 1,
    IS_GUEST: 0,
    SCHEDULED: 0,
    FAILED: 0,
    REFUND_REQUESTED: 0,
    REFUNDED: 0,
    CHECKED: 0,
    EDITED: 0,
    PRESCRIPTION_ORDER: 0,
    CUTLERY: 0,
    PARTIAL_PAYMENT: 0,
    IS_BUY_NOW: 0,
    CREATE_NEW_USER: 0,
    REFUND_REQUEST_CANCELED: 0,
    PARTIALLY_PAID_AMOUNT: 0.00,
    FLASH_ADMIN_DISCOUNT_AMOUNT: 0.00,
    FLASH_STORE_DISCOUNT_AMOUNT: 0.00,
    EXTRA_PACKAGING_AMOUNT: 0.00,
    REF_BONUS_AMOUNT: 0.00,
    ADJUSMENT: 0.00,
    ADDITIONAL_CHARGE: 0.00,
    ORIGINAL_DELIVERY_CHARGE: 0.00,
    DM_TIPS: 0.00,
    DISTANCE: 0.000000,
    LATITUDE: 0.0,
    LONGITUDE: 0.0,
    PROMISED_DELV_TAT: '24',
    ADDRESS_TYPE: 'others',
    IS_SCHEDULED: 0,
    SCHEDULED_TIMESTAMP: 0,
    CHARGE_PAYER: 'sender',
    TAX_STATUS: 'excluded'
  },
  
  // Validation limits
  LIMITS: {
    MAX_ORDER_NOTE_LENGTH: 1000,
    MAX_DELIVERY_INSTRUCTION_LENGTH: 500,
    MAX_UNAVAILABLE_ITEM_NOTE_LENGTH: 500,
    MAX_CANCELLATION_REASON_LENGTH: 500,
    MAX_CONTACT_PERSON_NAME_LENGTH: 255,
    MAX_CONTACT_PERSON_NUMBER_LENGTH: 20,
    MAX_ORDER_ID_LENGTH: 50,
    MAX_COUPON_CODE_LENGTH: 50,
    MAX_TRANSACTION_REFERENCE_LENGTH: 255,
    MAX_CALLBACK_LENGTH: 255,
    MAX_DELIVERY_TIME_LENGTH: 50,
    MAX_FREE_DELIVERY_BY_LENGTH: 50,
    MAX_COUPON_CREATED_BY_LENGTH: 50,
    MAX_DISCOUNT_ON_PRODUCT_BY_LENGTH: 50,
    MAX_CANCELED_BY_LENGTH: 50,
    MAX_PROMISED_DURATION_LENGTH: 50,
    MAX_E_COMM_INVOICE_ID_LENGTH: 255,
    MAX_E_COMM_ORDER_ID_LENGTH: 255,
    MAX_AWB_NUMBER_LENGTH: 255,
    MAX_GUEST_ID_LENGTH: 255,
    MAX_PASSWORD_LENGTH: 255,
    MAX_VARIATION_LENGTH: 255,
    MAX_VARIANT_LENGTH: 255,
    MAX_DISCOUNT_TYPE_LENGTH: 20,
    MAX_ORDER_STATUS_LENGTH: 50,
    MAX_PAYMENT_STATUS_LENGTH: 50,
    MAX_PAYMENT_METHOD_LENGTH: 50,
    MAX_ORDER_TYPE_LENGTH: 50,
    MAX_TAX_STATUS_LENGTH: 50,
    MAX_CHARGE_PAYER_LENGTH: 50,
    MAX_ADDRESS_TYPE_LENGTH: 50,
    MAX_PROMISED_DELV_TAT_LENGTH: 10
  },
  
  // Order ID generation
  ORDER_ID: {
    PREFIX: 'ORD',
    SUFFIX_LENGTH: 8,
    MIN_LENGTH: 8,
    MAX_LENGTH: 50
  },
  
  // Cart item structure
  CART_ITEM: {
    REQUIRED_FIELDS: ['item_id', 'quantity', 'price'],
    OPTIONAL_FIELDS: ['variation', 'add_ons', 'discount_on_item', 'tax_amount', 'variant', 'item_campaign_id', 'total_add_on_price']
  }
};

// Type definitions for better TypeScript support
export type OrderStatus = typeof ORDER_CONSTANTS.STATUSES[keyof typeof ORDER_CONSTANTS.STATUSES];
export type PaymentStatus = typeof ORDER_CONSTANTS.PAYMENT_STATUSES[keyof typeof ORDER_CONSTANTS.PAYMENT_STATUSES];
export type PaymentMethod = typeof ORDER_CONSTANTS.PAYMENT_METHODS[keyof typeof ORDER_CONSTANTS.PAYMENT_METHODS];
export type OrderType = typeof ORDER_CONSTANTS.ORDER_TYPES[keyof typeof ORDER_CONSTANTS.ORDER_TYPES];
export type DiscountType = typeof ORDER_CONSTANTS.DISCOUNT_TYPES[keyof typeof ORDER_CONSTANTS.DISCOUNT_TYPES];

// Interface for cart item structure
export interface CartItem {
  item_id: number;
  quantity: number;
  price: number;
  variation?: string | null;
  add_ons?: string | null;
  discount_on_item?: number | null;
  tax_amount?: number;
  variant?: string | null;
  item_campaign_id?: number | null;
  total_add_on_price?: number;
  item_details?: string | null;
  is_return?: number;
  return_item_status?: string | null;
  return_item_date?: Date | null;
  is_gift?: number;
  fc_id?: number | null;
}

// Interface for order detail creation
export interface OrderDetailData {
  item_id: number | null;
  order_id: number;
  price: number;
  item_details?: string | null;
  variation?: string | null;
  add_ons?: string | null;
  discount_on_item?: number | null;
  discount_type?: string;
  quantity?: number;
  is_return?: number;
  return_item_status?: string | null;
  return_item_date?: Date | null;
  tax_amount?: number;
  variant?: string | null;
  created_at?: Date;
  updated_at?: Date;
  item_campaign_id?: number | null;
  is_gift?: number;
  total_add_on_price?: number;
  fc_id?: number | null;
}

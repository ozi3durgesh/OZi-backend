// deliveryManConstants.ts - Configuration constants for delivery man management

export const DELIVERY_MAN_CONSTANTS = {
  DEFAULT_VALUES: {
    STATUS: true,
    ACTIVE: true,
    EARNING: true,
    CURRENT_ORDERS: 0,
    TYPE: 'zone_wise',
    APPLICATION_STATUS: 'approved' as 'approved' | 'denied' | 'pending',
    ORDER_COUNT: 0,
    ASSIGNED_ORDER_COUNT: 0,
  },
  
  RESPONSE_MESSAGES: {
    SUCCESS_ASSIGNED: 'Delivery man assigned successfully',
    SUCCESS_CREATED_AND_ASSIGNED: 'Delivery man created and assigned successfully',
    ERROR_ORDER_NOT_FOUND: 'Order not found',
    ERROR_MISSING_FIELDS: 'Missing required fields',
    ERROR_INVALID_PHONE: 'Invalid phone number format',
    ERROR_DATABASE: 'Database operation failed',
    ERROR_DELIVERY_MAN_NOT_FOUND: 'Delivery man not found',
  },
  
  VALIDATION: {
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 20,
    REQUIRED_FIELDS: ['phone', 'password', 'orderId'],
  },
  
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  },
};


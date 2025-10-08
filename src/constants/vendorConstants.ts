export const VENDOR_CONSTANTS = {
  // Vendor ID Configuration
  VENDOR_ID_PREFIX: 'OZIVID',
  VENDOR_ID_START_NUMBER: 10001,
  
  // Status Values
  STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
  } as const,
  
  // Vendor Types
  VENDOR_TYPES: {
    MANUFACTURER: 'MANUFACTURER',
    SUPPLIER: 'SUPPLIER',
    DISTRIBUTOR: 'DISTRIBUTOR',
    WHOLESALER: 'WHOLESALER',
    OTHER: 'OTHER',
  } as const,
  
  // Default Values
  DEFAULTS: {
    STATUS: 'ACTIVE' as const,
    VENDOR_TYPE: 'SUPPLIER' as const,
    COUNTRY: 'India',
    CREDIT_LIMIT: 0,
  },
  
  // Validation Rules
  VALIDATION: {
    GST_NUMBER_LENGTH: 15,
    PAN_NUMBER_LENGTH: 10,
    MIN_RATING: 0,
    MAX_RATING: 5,
    PHONE_MAX_LENGTH: 20,
    EMAIL_MAX_LENGTH: 255,
  },
  
  // Error Messages
  ERRORS: {
    DUPLICATE_GST: 'Vendor with this GST Number already exists',
    DUPLICATE_VENDOR_ID: 'Vendor ID already exists',
    VENDOR_NOT_FOUND: 'Vendor not found',
    INVALID_DC: 'Invalid Distribution Center',
    INVALID_GST: 'Invalid GST Number format',
    INVALID_PAN: 'Invalid PAN Number format',
    UNAUTHORIZED: 'Only admin users can create vendors',
    CREATION_FAILED: 'Failed to create vendor',
  },
  
  // Success Messages
  SUCCESS: {
    CREATED: 'Vendor created successfully',
    UPDATED: 'Vendor updated successfully',
    DELETED: 'Vendor deleted successfully',
    FETCHED: 'Vendor(s) fetched successfully',
  },
} as const;

// Type exports for TypeScript
export type VendorStatus = typeof VENDOR_CONSTANTS.STATUS[keyof typeof VENDOR_CONSTANTS.STATUS];
export type VendorType = typeof VENDOR_CONSTANTS.VENDOR_TYPES[keyof typeof VENDOR_CONSTANTS.VENDOR_TYPES];


// DC Purchase Order Constants

export const DC_PO_CONSTANTS = {
  // PO ID Configuration
  PO_ID_PREFIX: 'DCPO',
  PO_ID_START_NUMBER: 10001,
  
  // Status Values
  STATUS: {
    DRAFT: 'DRAFT',
    PENDING_CATEGORY_HEAD: 'PENDING_CATEGORY_HEAD',
    PENDING_ADMIN: 'PENDING_ADMIN',
    PENDING_CREATOR_REVIEW: 'PENDING_CREATOR_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
  } as const,
  
  // Approval Roles
  APPROVAL_ROLES: {
    CREATOR: 'creator',
    CATEGORY_HEAD: 'category_head',
    ADMIN: 'admin',
    FOUNDER: 'founder',
  } as const,
  
  // Approval Workflow
  APPROVAL_WORKFLOW: [
    'CREATOR',
    'CATEGORY_HEAD',
    'ADMIN',
    'CREATOR_REVIEW'
  ] as const,
  
  // Default Values
  DEFAULTS: {
    STATUS: 'DRAFT' as const,
    PRIORITY: 'MEDIUM' as const,
  },
  
  // Validation Rules
  VALIDATION: {
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 999999,
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 99999999.99,
    DESCRIPTION_MAX_LENGTH: 500,
    NOTES_MAX_LENGTH: 1000,
  },
  
  // Error Messages
  ERRORS: {
    PO_NOT_FOUND: 'Purchase Order not found',
    DUPLICATE_PO_ID: 'PO ID already exists',
    INVALID_VENDOR: 'Invalid vendor',
    INVALID_DC: 'Invalid Distribution Center',
    INVALID_STATUS: 'Invalid status for this operation',
    UNAUTHORIZED_APPROVAL: 'Unauthorized to approve/reject this PO',
    INVALID_APPROVAL_ROLE: 'Invalid approval role',
    TOKEN_EXPIRED: 'Approval token has expired',
    INVALID_TOKEN: 'Invalid approval token',
    PRODUCT_REQUIRED: 'At least one product is required',
    INVALID_QUANTITY: 'Invalid quantity',
    INVALID_AMOUNT: 'Invalid amount',
    CREATION_FAILED: 'Failed to create purchase order',
    APPROVAL_FAILED: 'Failed to process approval',
    REJECTION_FAILED: 'Failed to process rejection',
  },
  
  // Success Messages
  SUCCESS: {
    CREATED: 'Purchase Order created successfully',
    UPDATED: 'Purchase Order updated successfully',
    APPROVED: 'Purchase Order approved successfully',
    REJECTED: 'Purchase Order rejected successfully',
    FETCHED: 'Purchase Order(s) fetched successfully',
    DELETED: 'Purchase Order deleted successfully',
  },
  
  // Email Configuration
  EMAIL: {
    APPROVAL_EMAILS: {
      category_head: process.env.CATEGORY_HEAD_EMAIL || 'durgesh.singh.sde@gmail.com',
      admin: process.env.ADMIN_EMAIL || 'durgesh.singh@ozi.in',
      founder: process.env.FOUNDER_EMAIL || 'durgesh.singh@ozi.in',
      creator: process.env.CREATOR_EMAIL || 'durgesh.sde@gmail.com',
    },
    TOKEN_EXPIRY_MINUTES: 60,
    SUBJECT_PREFIX: 'DC-PO',
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

// Type exports for TypeScript
export type DC_PO_Status = typeof DC_PO_CONSTANTS.STATUS[keyof typeof DC_PO_CONSTANTS.STATUS];
export type ApprovalRole = typeof DC_PO_CONSTANTS.APPROVAL_ROLES[keyof typeof DC_PO_CONSTANTS.APPROVAL_ROLES];

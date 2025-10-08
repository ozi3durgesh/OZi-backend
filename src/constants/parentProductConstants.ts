// Parent Product Master DC Constants

export const PARENT_PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
} as const;

export const PARENT_PRODUCT_FLAMMABLE_OPTIONS = {
  YES: 'Yes',
  NO: 'No',
  UNKNOWN: 'Unknown',
} as const;

export const PARENT_PRODUCT_REQUIRED_FIELDS = [
  'SKU',
  'MRP',
  'COST',
  'Weight',
  'Length',
  'Height',
  'Width',
  'hsn',
  'EAN_UPC',
  'ProductName',
  'ImageURL',
  'Status',
  'Category',
  'Brand',
  'gst',
] as const;

export const PARENT_PRODUCT_NUMERIC_FIELDS = [
  'MRP',
  'COST',
  'Weight',
  'Length',
  'Height',
  'Width',
  'ReverseWeight',
  'ReverseLength',
  'ReverseHeight',
  'ReverseWidth',
  'SPThreshold',
  'InventoryThreshold',
  'ERPSystemId',
  'SyncTally',
  'ShelfLifePercentage',
  'ProductExpiryInDays',
  'CESS',
] as const;

export const PARENT_PRODUCT_VALIDATION_PATTERNS = {
  SKU: /^\d{12}$/,
  HSN: /^\d{4,8}$/,
  EAN_UPC: /^\d{8,14}$/,
  IMAGE_URL: /^https?:\/\/.+/i,
  IMAGE_EXTENSION: /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i,
  GST: /^(\d+(?:\.\d+)?)%?$/,
} as const;

export const PARENT_PRODUCT_ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_SKU_FORMAT: 'SKU must be exactly 12 digits',
  INVALID_HSN_FORMAT: 'HSN must be 4-8 digits',
  INVALID_EAN_FORMAT: 'EAN/UPC must be 8-14 digits',
  INVALID_IMAGE_URL: 'ImageURL must be a valid HTTP/HTTPS URL',
  INVALID_IMAGE_EXTENSION: 'ImageURL must have a valid image extension (jpg, jpeg, png, gif, bmp, webp, svg)',
  INVALID_STATUS: 'Status must be active, inactive, draft, or archived',
  INVALID_GST_FORMAT: 'GST must be a valid percentage (e.g., 18 or 18%)',
  INVALID_GST_RANGE: 'GST must be between 0 and 100',
  INVALID_NUMERIC_FIELD: (field: string) => `${field} must be a valid positive number`,
  INVALID_FLAMMABLE: 'Flammable must be Yes, No, or Unknown',
  SKU_ALREADY_EXISTS: (sku: string) => `Parent product with SKU ${sku} already exists`,
  PRODUCT_NOT_FOUND: 'Parent product not found',
  VALIDATION_FAILED: 'Validation failed',
} as const;

export const PARENT_PRODUCT_SUCCESS_MESSAGES = {
  CREATED: 'Parent product created successfully',
  UPDATED: 'Parent product updated successfully',
  RETRIEVED: 'Parent product retrieved successfully',
  DELETED: 'Parent product deleted successfully',
} as const;

export const PARENT_PRODUCT_DEFAULT_VALUES = {
  FLAMMABLE: PARENT_PRODUCT_FLAMMABLE_OPTIONS.NO,
  STATUS: PARENT_PRODUCT_STATUS.ACTIVE,
} as const;

export const PARENT_PRODUCT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;


// Parent Product Master Constants

export const PARENT_PRODUCT_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1,
} as const;

export const PARENT_PRODUCT_REQUIRED_FIELDS = [
  'name',
  'status',
  'category_id',
  'catalogue_id',
  'description',
  'hsn',
  'image_url',
  'mrp',
  'cost',
  'ean_upc',
  'brand_id',
  'weight',
  'length',
  'height',
  'width',
  'inventory_threshold',
  'gst',
  'cess',
] as const;

export const PARENT_PRODUCT_NUMERIC_FIELDS = [
  'mrp',
  'weight',
  'length',
  'height',
  'width',
  'inventory_threshold',
  'gst',
  'cess',
  'category_id',
  'brand_id',
] as const;

export const PARENT_PRODUCT_VALIDATION_PATTERNS = {
  CATALOGUE_ID: /^\d{7}$/,
  HSN: /^\d{4,8}$/,
  EAN_UPC: /^\d{8,14}$/,
  IMAGE_URL: /^https?:\/\/.+/i,
  IMAGE_EXTENSION: /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i,
  GST: /^(\d+(?:\.\d+)?)%?$/,
} as const;

export const PARENT_PRODUCT_ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_CATALOGUE_ID_FORMAT: 'Catalogue ID must be exactly 7 digits',
  INVALID_HSN_FORMAT: 'HSN must be 4-8 digits',
  INVALID_EAN_FORMAT: 'EAN/UPC must be 8-14 digits',
  INVALID_IMAGE_URL: 'Image URL must be a valid HTTP/HTTPS URL',
  INVALID_IMAGE_EXTENSION: 'Image URL must have a valid image extension (jpg, jpeg, png, gif, bmp, webp, svg)',
  INVALID_STATUS: 'Status must be 0 (inactive) or 1 (active)',
  INVALID_GST_FORMAT: 'GST must be a valid percentage (e.g., 18 or 18%)',
  INVALID_GST_RANGE: 'GST must be between 0 and 100',
  INVALID_NUMERIC_FIELD: (field: string) => `${field} must be a valid positive number`,
  COST_MUST_BE_LESS_THAN_MRP: 'Cost must be less than MRP',
  CATALOGUE_ID_ALREADY_EXISTS: (catalogueId: string) => `Parent product with catalogue ID ${catalogueId} already exists`,
  PRODUCT_NOT_FOUND: 'Parent product not found',
  VALIDATION_FAILED: 'Validation failed',
  BRAND_NOT_FOUND: 'Brand not found',
  CATEGORY_NOT_FOUND: 'Category not found',
  DC_ACCESS_DENIED: 'Only DC users can create parent products',
} as const;

export const PARENT_PRODUCT_SUCCESS_MESSAGES = {
  CREATED: 'Parent product created successfully',
  UPDATED: 'Parent product updated successfully',
  RETRIEVED: 'Parent product retrieved successfully',
  DELETED: 'Parent product deleted successfully',
} as const;

export const PARENT_PRODUCT_DEFAULT_VALUES = {
  STATUS: PARENT_PRODUCT_STATUS.ACTIVE,
} as const;

export const PARENT_PRODUCT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;


// Product Master Constants - Unified from ParentProductMasterDC and Product models

export const PRODUCT_MASTER_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1,
} as const;

export const PRODUCT_MASTER_REQUIRED_FIELDS = [
  'name',
  'category',
  'description',
  'mrp',
  'brand_id',
  'gst',
  'cess',
  'hsn',
] as const;

export const PRODUCT_MASTER_OPTIONAL_FIELDS = [
  'color',
  'age_size',
  'image_url',
  'ean_upc',
  'weight',
  'length',
  'height',
  'width',
  'inventory_threshold',
] as const;

export const PRODUCT_MASTER_NUMERIC_FIELDS = [
  'mrp',
  'avg_cost_to_ozi',
  'weight',
  'length',
  'height',
  'width',
  'inventory_threshold',
  'gst',
  'cess',
  'brand_id',
] as const;

export const PRODUCT_MASTER_VALIDATION_PATTERNS = {
  CATALOGUE_ID: /^\d{7}$/,
  HSN: /^\d{4,8}$/,
  EAN_UPC: /^\d{8,14}$/,
  SKU: /^[A-Za-z0-9\-_]+$/,
  ITEM_CODE: /^[A-Za-z0-9\-_]+$/,
  IMAGE_URL: /^https?:\/\/.+/i,
  IMAGE_EXTENSION: /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i,
  GST: /^(\d+(?:\.\d+)?)%?$/,
} as const;

export const PRODUCT_MASTER_ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_CATALOGUE_ID_FORMAT: 'Catalogue ID must be exactly 7 digits',
  INVALID_HSN_FORMAT: 'HSN must be 4-8 digits',
  INVALID_EAN_FORMAT: 'EAN/UPC must be 8-14 digits',
  INVALID_SKU_FORMAT: 'SKU must contain only alphanumeric characters, hyphens, and underscores',
  INVALID_ITEM_CODE_FORMAT: 'Item code must contain only alphanumeric characters, hyphens, and underscores',
  INVALID_IMAGE_URL: 'Image URL must be a valid HTTP/HTTPS URL',
  INVALID_IMAGE_EXTENSION: 'Image URL must have a valid image extension (jpg, jpeg, png, gif, bmp, webp, svg)',
  INVALID_STATUS: 'Status must be 0 (inactive) or 1 (active)',
  INVALID_GST_FORMAT: 'GST must be a valid percentage (e.g., 18 or 18%)',
  INVALID_GST_RANGE: 'GST must be between 0 and 100',
  INVALID_NUMERIC_FIELD: (field: string) => `${field} must be a valid positive number`,
  CATALOGUE_ID_ALREADY_EXISTS: (catalogueId: string) => `Product with catalogue ID ${catalogueId} already exists`,
  SKU_ALREADY_EXISTS: (sku: string) => `Product with SKU ${sku} already exists`,
  PRODUCT_NOT_FOUND: 'Product not found',
  VALIDATION_FAILED: 'Validation failed',
  BRAND_NOT_FOUND: 'Brand not found',
  CATEGORY_NOT_FOUND: 'Category not found',
  DC_NOT_FOUND: 'Distribution Center not found',
  DC_ACCESS_DENIED: 'Only DC users can create products',
} as const;

export const PRODUCT_MASTER_SUCCESS_MESSAGES = {
  CREATED: 'Product created successfully',
  UPDATED: 'Product updated successfully',
  RETRIEVED: 'Product retrieved successfully',
  DELETED: 'Product deleted successfully',
  BULK_UPLOAD_SUCCESS: 'Bulk upload completed successfully',
} as const;

export const PRODUCT_MASTER_DEFAULT_VALUES = {
  STATUS: PRODUCT_MASTER_STATUS.ACTIVE,
  COST: null,
  ITEM_CODE: null,
  DC_ID: null,
  UPDATED_BY: [],
} as const;

export const PRODUCT_MASTER_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PRODUCT_MASTER_SEARCH_FIELDS = [
  'catelogue_id',
  'product_id',
  'sku_id',
  'name',
  'category',
  'hsn',
  'ean_upc',
  'description',
] as const;

export const PRODUCT_MASTER_SORT_FIELDS = [
  'id',
  'name',
  'catelogue_id',
  'product_id',
  'sku_id',
  'mrp',
  'avg_cost_to_ozi',
  'created_at',
  'updated_at',
] as const;

// Field mappings for data migration
export const PRODUCT_MASTER_FIELD_MAPPINGS = {
  // From ParentProductMasterDC
  PARENT_PRODUCT: {
    id: 'id',
    name: 'name',
    status: 'status',
    category_id: 'category_id',
    catalogue_id: 'catalogue_id',
    description: 'description',
    hsn: 'hsn',
    image_url: 'image_url',
    mrp: 'mrp',
    ean_upc: 'ean_upc',
    brand_id: 'brand_id',
    weight: 'weight',
    length: 'length',
    height: 'height',
    width: 'width',
    inventory_threshold: 'inventory_threshold',
    gst: 'gst',
    cess: 'cess',
    createdBy: 'createdBy',
    updatedBy: 'updatedBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  // From Product (product_master)
  PRODUCT: {
    id: 'id',
    name: 'name',
    status: 'status',
    category_id: 'category_id',
    catalogue_id: 'catelogue_id', // Note: typo in original field name
    description: 'description',
    hsn: 'hsn',
    image_url: 'image_url',
    mrp: 'mrp',
    cost: 'cost',
    ean_upc: 'ean_upc',
    brand_id: 'brand_id',
    weight: 'weight',
    length: 'length',
    height: 'height',
    width: 'width',
    inventory_threshold: 'inventory_thresshold', // Note: typo in original field name
    gst: 'gst',
    cess: 'cess',
    sku: 'sku',
    item_code: 'item_code',
    dc_id: 'dc_id',
    createdBy: 'created_by',
    updatedBy: 'updated_by',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
} as const;

// config/pickingConstants.ts
/**
 * Constants for picking operations to avoid hardcoded values
 */

export const PICKING_CONSTANTS = {
  // Default bin location when no specific bin is found
  DEFAULT_BIN_LOCATION: 'DEFAULT-BIN',
  
  // Database table names
  TABLES: {
    PRODUCT_MASTER: 'product_master',
    BIN_LOCATIONS: 'bin_locations',
    SCANNER_SKU: 'scanner_sku',
    SCANNER_BIN: 'scanner_bin'
  },
  
  // Column names
  COLUMNS: {
    SKU: 'sku',
    CATEGORY: 'category',
    BIN_CODE: 'bin_code',
    CATEGORY_MAPPING: 'category_mapping',
    STATUS: 'status'
  },
  
  // Status values
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    MAINTENANCE: 'maintenance'
  },
  
  // Log messages
  LOG_MESSAGES: {
    SKU_NOT_FOUND_IN_SCANNER: 'SKU not found in scanner system. Checking category-based fallback.',
    BIN_LOCATION_NOT_FOUND: 'Bin location not found for SKU. Checking category-based fallback.',
    CATEGORY_FOUND: 'Found product category for SKU. Checking bin_locations.',
    CATEGORY_BIN_FOUND: 'Found category-based bin location for category',
    NO_ACTIVE_BIN_FOR_CATEGORY: 'No active bin found for category. Using default bin location.',
    NO_CATEGORY_FOUND: 'No category found for SKU. Using default bin location.',
    USING_DEFAULT_BIN: 'Using default bin location.'
  },
  
  // Query options
  QUERY_OPTIONS: {
    ORDER_BY_ID_ASC: [['id', 'ASC']] as [string, string][]
  }
} as const;

export default PICKING_CONSTANTS;

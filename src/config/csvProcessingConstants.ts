// CSV Processing Constants for Product CSV Processing API
export const CSV_PROCESSING_CONSTANTS = {
  // Required CSV headers for PO creation
  REQUIRED_HEADERS: [
    'sku_id',
    'units', 
    'mrp',
    'sp',
    'margin',
    'rlp',
    'rlp_w_o_tax'
  ],

  // Field mappings from CSV to response
  FIELD_MAPPINGS: {
    CSV_TO_RESPONSE: {
      'sku_id': 'sku_id',
      'units': 'units',
      'mrp': 'csv_mrp',
      'sp': 'sp',
      'margin': 'margin',
      'rlp': 'rlp',
      'rlp_w_o_tax': 'rlp_w_o_tax'
    },
    PRODUCT_TO_RESPONSE: {
      'ImageURL': 'imageUrl',
      'ProductName': 'productName',
      'gst': 'gst',
      'hsn': 'hsn',
      'EAN_UPC': 'ean_upc',
      'Brand': 'brand'
    }
  },

  // Numeric fields that require validation
  NUMERIC_FIELDS: [
    'units',
    'mrp',
    'sp', 
    'margin',
    'rlp',
    'rlp_w_o_tax'
  ],

  // Validation rules
  VALIDATION_RULES: {
    MIN_UNITS: 0,
    MIN_PRICE: 0,
    MAX_PRICE: 999999.99,
    MAX_MARGIN: 100, // percentage
    SKU_MAX_LENGTH: 50,
    SKU_PATTERN: /^[A-Za-z0-9_-]+$/
  },

  // Error types
  ERROR_TYPES: {
    MISSING_HEADER: 'MISSING_HEADER',
    INVALID_DATA_TYPE: 'INVALID_DATA_TYPE',
    SKU_NOT_FOUND: 'SKU_NOT_FOUND',
    INVALID_SKU_FORMAT: 'INVALID_SKU_FORMAT',
    INVALID_NUMERIC_VALUE: 'INVALID_NUMERIC_VALUE',
    NEGATIVE_VALUE: 'NEGATIVE_VALUE',
    FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR'
  },

  // Error messages
  ERROR_MESSAGES: {
    MISSING_HEADER: 'Required header missing from CSV',
    INVALID_DATA_TYPE: 'Invalid data type for field',
    SKU_NOT_FOUND: 'SKU not found in product master',
    INVALID_SKU_FORMAT: 'Invalid SKU format',
    INVALID_NUMERIC_VALUE: 'Invalid numeric value',
    NEGATIVE_VALUE: 'Value cannot be negative',
    FILE_PROCESSING_ERROR: 'Error processing CSV file',
    DATABASE_ERROR: 'Database error occurred'
  },

  // Response structure configuration
  RESPONSE_CONFIG: {
    CALCULATED_FIELDS: {
      'original_mrp': {
        formula: 'units * mrp',
        description: 'Total MRP value (units × mrp)'
      }
    },
    DEFAULT_VALUES: {
      imageUrl: null,
      productName: null,
      gst: null,
      hsn: null,
      ean_upc: null,
      brand: null
    }
  },

  // Processing configuration
  PROCESSING_CONFIG: {
    BATCH_SIZE: 100, // Process SKUs in batches for database queries
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB max file size
    ALLOWED_FILE_TYPES: ['.csv'],
    LOG_LEVEL: 'INFO'
  }
} as const;

// Type definitions
export type CSVHeader = typeof CSV_PROCESSING_CONSTANTS.REQUIRED_HEADERS[number];
export type NumericField = typeof CSV_PROCESSING_CONSTANTS.NUMERIC_FIELDS[number];
export type ErrorType = typeof CSV_PROCESSING_CONSTANTS.ERROR_TYPES[keyof typeof CSV_PROCESSING_CONSTANTS.ERROR_TYPES];

// Interface definitions
export interface CSVRow {
  sku_id: string;
  units: number;
  mrp: number;
  sp: number;
  margin: number;
  rlp: number;
  rlp_w_o_tax: number;
}

export interface ProcessedCSVRow {
  sku_id: string;
  units: number;
  csv_mrp: number;
  sp: number;
  margin: number;
  rlp: number;
  rlp_w_o_tax: number;
  imageUrl: string | null;
  productName: string | null;
  gst: string | null;
  hsn: string | null;
  ean_upc: string | null;
  brand: string | null;
  original_mrp: number;
}

export interface ProcessingError {
  row: number;
  sku_id?: string;
  field?: string;
  value?: any;
  errorType: ErrorType;
  message: string;
}

export interface CSVProcessingResult {
  success: boolean;
  data: ProcessedCSVRow[];
  errors: ProcessingError[];
  summary: {
    totalRows: number;
    successCount: number;
    errorCount: number;
    processedAt: string;
  };
}

export default CSV_PROCESSING_CONSTANTS;

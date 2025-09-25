import Product from '../models/productModel';
import { Op } from 'sequelize';

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  error: string;
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ProcessedRecord {
  data: any;
  row: number;
  isUpdate: boolean;
  existingProduct?: Product | null;
}

export class ProductBulkValidationService {
  private requiredFields = [
    'SKU',
    'ProductName', 
    'Category',
    'Brand',
    'ModelNum',
    'COST',
    'MRP',
    'Weight',
    'Length',
    'Height',
    'Width',
    'MaterialType',
    'Flammable',
    'gst_number'
  ];

  private numericFields = [
    'MRP',
    'COST', 
    'Weight',
    'Length',
    'Height',
    'Width',
    'SPThreshold',
    'InventoryThreshold',
    'ERPSystemId',
    'SyncTally',
    'ShelfLifePercentage',
    'ProductExpiryInDays',
    'ReverseWeight',
    'ReverseLength',
    'ReverseHeight',
    'ReverseWidth',
    'CESS'
  ];

  private stringFields = [
    'SKU',
    'ProductName',
    'Description',
    'Category',
    'Brand',
    'ModelName',
    'ModelNum',
    'EAN_UPC',
    'Color',
    'Size',
    'ImageURL',
    'Status',
    'CPId',
    'ParentSKU',
    'IS_MPS',
    'hsn',
    'ManufacturerDescription',
    'AccountingSKU',
    'AccountingUnit',
    'Flammable',
    'ShelfLife',
    'SKUType',
    'MaterialType',
    'gst_number'
  ];

  private enumFields = {
    'Flammable': ['Yes', 'No', 'Unknown'],
    'Status': ['Active', 'Inactive', 'Pending'],
    'IS_MPS': ['Y', 'N'],
    'SyncTally': ['0', '1']
  };

  /**
   * Validate CSV headers and check for required fields
   */
  validateHeaders(headers: string[]): ValidationResult {
    const errors: ValidationError[] = [];
    const missingFields: string[] = [];

    // Check for required fields
    for (const requiredField of this.requiredFields) {
      if (!headers.includes(requiredField)) {
        missingFields.push(requiredField);
      }
    }

    if (missingFields.length > 0) {
      errors.push({
        row: 0,
        column: 'HEADER',
        value: missingFields.join(', '),
        error: 'MISSING_REQUIRED_FIELDS',
        description: `Required fields missing from CSV: ${missingFields.join(', ')}`
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate a single record
   */
  async validateRecord(record: any, row: number): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Required field validation
    for (const field of this.requiredFields) {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push({
          row,
          column: field,
          value: record[field],
          error: 'REQUIRED_FIELD_MISSING',
          description: `${field} is required but was empty or missing`
        });
      }
    }

    // 2. Data type validation
    await this.validateDataTypes(record, row, errors);

    // 3. Business logic validation
    this.validateBusinessLogic(record, row, errors);

    // 4. Enum validation
    this.validateEnums(record, row, errors);

    // 5. Format validation
    this.validateFormats(record, row, errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate data types for all fields
   */
  private async validateDataTypes(record: any, row: number, errors: ValidationError[]): Promise<void> {
    // Numeric fields validation
    for (const field of this.numericFields) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const value = record[field];
        if (isNaN(Number(value)) || Number(value) < 0) {
          errors.push({
            row,
            column: field,
            value: value,
            error: 'INVALID_NUMERIC_VALUE',
            description: `${field} must be a valid positive number, got: ${value}`
          });
        }
      }
    }

    // String fields validation
    for (const field of this.stringFields) {
      if (record[field] !== undefined && record[field] !== null) {
        const value = record[field].toString();
        if (value.length > 255 && !['Description', 'ManufacturerDescription', 'ImageURL'].includes(field)) {
          errors.push({
            row,
            column: field,
            value: value,
            error: 'STRING_TOO_LONG',
            description: `${field} exceeds maximum length of 255 characters`
          });
        }
      }
    }
  }

  /**
   * Validate business logic rules
   */
  private validateBusinessLogic(record: any, row: number, errors: ValidationError[]): void {
    // COST cannot be greater than MRP
    const cost = Number(record.COST);
    const mrp = Number(record.MRP);
    
    if (!isNaN(cost) && !isNaN(mrp) && cost > mrp) {
      errors.push({
        row,
        column: 'COST',
        value: cost,
        error: 'COST_GREATER_THAN_MRP',
        description: `COST (${cost}) cannot be greater than MRP (${mrp})`
      });
    }

    // Weight, Length, Height, Width must be positive
    const dimensions = ['Weight', 'Length', 'Height', 'Width'];
    for (const dim of dimensions) {
      const value = Number(record[dim]);
      if (!isNaN(value) && value <= 0) {
        errors.push({
          row,
          column: dim,
          value: value,
          error: 'INVALID_DIMENSION',
          description: `${dim} must be greater than 0, got: ${value}`
        });
      }
    }
  }

  /**
   * Validate enum fields
   */
  private validateEnums(record: any, row: number, errors: ValidationError[]): void {
    for (const [field, allowedValues] of Object.entries(this.enumFields)) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const value = record[field].toString();
        if (!allowedValues.includes(value)) {
          errors.push({
            row,
            column: field,
            value: value,
            error: 'INVALID_ENUM_VALUE',
            description: `${field} must be one of: ${allowedValues.join(', ')}, got: ${value}`
          });
        }
      }
    }
  }

  /**
   * Validate field formats
   */
  private validateFormats(record: any, row: number, errors: ValidationError[]): void {
    // SKU format validation (alphanumeric, reasonable length)
    if (record.SKU) {
      const sku = record.SKU.toString();
      if (!/^[A-Za-z0-9_-]+$/.test(sku)) {
        errors.push({
          row,
          column: 'SKU',
          value: sku,
          error: 'INVALID_SKU_FORMAT',
          description: 'SKU must contain only alphanumeric characters, hyphens, and underscores'
        });
      }
      if (sku.length > 50) {
        errors.push({
          row,
          column: 'SKU',
          value: sku,
          error: 'SKU_TOO_LONG',
          description: 'SKU cannot exceed 50 characters'
        });
      }
    }

    // EAN/UPC format validation (numeric, 8-14 digits)
    if (record.EAN_UPC) {
      const ean = record.EAN_UPC.toString();
      if (!/^\d{8,14}$/.test(ean)) {
        errors.push({
          row,
          column: 'EAN_UPC',
          value: ean,
          error: 'INVALID_EAN_FORMAT',
          description: 'EAN/UPC must be 8-14 digits'
        });
      }
    }
  }

  /**
   * Validate EAN/UPC uniqueness and existing SKU consistency
   */
  async validateEANConsistency(records: ProcessedRecord[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const eanMap = new Map<string, { sku: string; row: number }>();

    for (const record of records) {
      const { data, row, isUpdate, existingProduct } = record;
      
      if (data.EAN_UPC) {
        const ean = data.EAN_UPC.toString();
        
        // Check for duplicate EAN in current batch
        if (eanMap.has(ean)) {
          const existing = eanMap.get(ean)!;
          errors.push({
            row,
            column: 'EAN_UPC',
            value: ean,
            error: 'DUPLICATE_EAN_IN_BATCH',
            description: `EAN/UPC ${ean} is duplicated in rows ${existing.row} and ${row}`
          });
        } else {
          eanMap.set(ean, { sku: data.SKU, row });
        }

        // For existing SKUs, check EAN consistency
        if (isUpdate && existingProduct) {
          if (existingProduct.EAN_UPC && existingProduct.EAN_UPC !== ean) {
            errors.push({
              row,
              column: 'EAN_UPC',
              value: ean,
              error: 'EAN_MISMATCH_EXISTING',
              description: `EAN/UPC ${ean} does not match existing EAN/UPC ${existingProduct.EAN_UPC} for SKU ${data.SKU}`
            });
          }
        }
      }
    }

    // Check for EAN uniqueness in database for new SKUs
    const newEANs = records
      .filter(r => !r.isUpdate && r.data.EAN_UPC)
      .map(r => r.data.EAN_UPC);

    if (newEANs.length > 0) {
      const existingEANs = await Product.findAll({
        where: {
          EAN_UPC: { [Op.in]: newEANs }
        },
        attributes: ['EAN_UPC']
      });

      for (const existingEAN of existingEANs) {
        const conflictingRecord = records.find(r => 
          !r.isUpdate && r.data.EAN_UPC === existingEAN.EAN_UPC
        );
        if (conflictingRecord) {
          errors.push({
            row: conflictingRecord.row,
            column: 'EAN_UPC',
            value: existingEAN.EAN_UPC,
            error: 'EAN_ALREADY_EXISTS',
            description: `EAN/UPC ${existingEAN.EAN_UPC} already exists in database for different SKU`
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Process and prepare records for database operations
   */
  async processRecords(records: any[]): Promise<ProcessedRecord[]> {
    const processedRecords: ProcessedRecord[] = [];
    const skus = records.map(r => r.SKU);

    // Fetch existing products
    const existingProducts = await Product.findAll({
      where: { SKU: { [Op.in]: skus } }
    });

    const existingSKUMap = new Map(
      existingProducts.map(p => [p.SKU, p])
    );

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const existingProduct = existingSKUMap.get(record.SKU) || null;
      
      processedRecords.push({
        data: record,
        row: i + 2, // +2 because CSV is 1-indexed and has header
        isUpdate: !!existingProduct,
        existingProduct
      });
    }

    return processedRecords;
  }

  /**
   * Comprehensive validation of all records
   */
  async validateAllRecords(records: any[]): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    // Process records to get existing product info
    const processedRecords = await this.processRecords(records);

    // Validate each record individually
    for (const record of processedRecords) {
      const result = await this.validateRecord(record.data, record.row);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    // Validate EAN/UPC consistency
    const eanResult = await this.validateEANConsistency(processedRecords);
    allErrors.push(...eanResult.errors);
    allWarnings.push(...eanResult.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}

export default ProductBulkValidationService;

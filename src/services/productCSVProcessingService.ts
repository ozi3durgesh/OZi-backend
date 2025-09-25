import Product from '../models/productModel';
import { Op, QueryTypes } from 'sequelize';
import CSV_PROCESSING_CONSTANTS, { 
  CSVRow, 
  ProcessedCSVRow, 
  ProcessingError, 
  CSVProcessingResult,
  ErrorType 
} from '../config/csvProcessingConstants';

export class ProductCSVProcessingService {
  private constants = CSV_PROCESSING_CONSTANTS;

  /**
   * Validate CSV headers against required headers
   */
  validateHeaders(headers: string[]): { isValid: boolean; errors: ProcessingError[] } {
    const errors: ProcessingError[] = [];
    const missingHeaders: string[] = [];

    // Check for required headers
    for (const requiredHeader of this.constants.REQUIRED_HEADERS) {
      if (!headers.includes(requiredHeader)) {
        missingHeaders.push(requiredHeader);
      }
    }

    if (missingHeaders.length > 0) {
      errors.push({
        row: 0,
        errorType: this.constants.ERROR_TYPES.MISSING_HEADER,
        message: `${this.constants.ERROR_MESSAGES.MISSING_HEADER}: ${missingHeaders.join(', ')}`
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single CSV row
   */
  validateRow(row: any, rowIndex: number): ProcessingError[] {
    const errors: ProcessingError[] = [];

    // Validate SKU format
    if (row.sku_id) {
      const sku = row.sku_id.toString().trim();
      if (!this.constants.VALIDATION_RULES.SKU_PATTERN.test(sku)) {
        errors.push({
          row: rowIndex,
          sku_id: sku,
          field: 'sku_id',
          value: sku,
          errorType: this.constants.ERROR_TYPES.INVALID_SKU_FORMAT,
          message: `${this.constants.ERROR_MESSAGES.INVALID_SKU_FORMAT}: ${sku}`
        });
      }
      if (sku.length > this.constants.VALIDATION_RULES.SKU_MAX_LENGTH) {
        errors.push({
          row: rowIndex,
          sku_id: sku,
          field: 'sku_id',
          value: sku,
          errorType: this.constants.ERROR_TYPES.INVALID_SKU_FORMAT,
          message: `SKU exceeds maximum length of ${this.constants.VALIDATION_RULES.SKU_MAX_LENGTH} characters`
        });
      }
    } else {
      errors.push({
        row: rowIndex,
        field: 'sku_id',
        errorType: this.constants.ERROR_TYPES.INVALID_DATA_TYPE,
        message: 'SKU ID is required'
      });
    }

    // Validate numeric fields
    for (const field of this.constants.NUMERIC_FIELDS) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        const value = parseFloat(row[field]);
        if (isNaN(value)) {
          errors.push({
            row: rowIndex,
            sku_id: row.sku_id,
            field: field,
            value: row[field],
            errorType: this.constants.ERROR_TYPES.INVALID_NUMERIC_VALUE,
            message: `${this.constants.ERROR_MESSAGES.INVALID_NUMERIC_VALUE} for ${field}: ${row[field]}`
          });
        } else if (value < 0) {
          errors.push({
            row: rowIndex,
            sku_id: row.sku_id,
            field: field,
            value: value,
            errorType: this.constants.ERROR_TYPES.NEGATIVE_VALUE,
            message: `${this.constants.ERROR_MESSAGES.NEGATIVE_VALUE} for ${field}: ${value}`
          });
        } else if (field.includes('price') || field === 'mrp' || field === 'sp' || field === 'rlp' || field === 'rlp_w_o_tax') {
          if (value > this.constants.VALIDATION_RULES.MAX_PRICE) {
            errors.push({
              row: rowIndex,
              sku_id: row.sku_id,
              field: field,
              value: value,
              errorType: this.constants.ERROR_TYPES.INVALID_NUMERIC_VALUE,
              message: `${field} exceeds maximum value of ${this.constants.VALIDATION_RULES.MAX_PRICE}`
            });
          }
        } else if (field === 'margin') {
          if (value > this.constants.VALIDATION_RULES.MAX_MARGIN) {
            errors.push({
              row: rowIndex,
              sku_id: row.sku_id,
              field: field,
              value: value,
              errorType: this.constants.ERROR_TYPES.INVALID_NUMERIC_VALUE,
              message: `Margin exceeds maximum value of ${this.constants.VALIDATION_RULES.MAX_MARGIN}%`
            });
          }
        }
      } else {
        errors.push({
          row: rowIndex,
          sku_id: row.sku_id,
          field: field,
          errorType: this.constants.ERROR_TYPES.INVALID_DATA_TYPE,
          message: `${field} is required`
        });
      }
    }

    return errors;
  }

  /**
   * Fetch products from database for given SKUs
   */
  async fetchProductsBySKUs(skus: string[]): Promise<Map<string, any>> {
    try {
      console.log('🔍 Fetching products for SKUs:', skus.slice(0, 3), '...');
      
      // Use raw query to avoid Sequelize column mapping issues
      const query = `
        SELECT SKU, ImageURL, ProductName, gst, hsn, EAN_UPC, Brand 
        FROM product_master 
        WHERE SKU IN (${skus.map(() => '?').join(',')})
      `;
      
      console.log('🔍 Executing query:', query);
      console.log('🔍 With replacements:', skus);
      
      const products = await Product.sequelize!.query(query, {
        replacements: skus,
        type: QueryTypes.SELECT
      });

      console.log('✅ Query successful, found', products.length, 'products');

      const productMap = new Map<string, any>();
      products.forEach((product: any) => {
        productMap.set(product.SKU, product);
      });

      return productMap;
    } catch (error: any) {
      console.error('❌ Error fetching products by SKUs:', error.message);
      console.error('❌ Full error:', error);
      throw new Error(`${this.constants.ERROR_MESSAGES.DATABASE_ERROR}: ${error.message}`);
    }
  }

  /**
   * Process CSV rows and enrich with product data
   */
  async processCSVRows(csvRows: any[]): Promise<CSVProcessingResult> {
    const errors: ProcessingError[] = [];
    const processedRows: ProcessedCSVRow[] = [];
    const validRows: CSVRow[] = [];

    // First pass: Validate all rows
    for (let i = 0; i < csvRows.length; i++) {
      const rowErrors = this.validateRow(csvRows[i], i + 1);
      errors.push(...rowErrors);
      
      if (rowErrors.length === 0) {
        validRows.push({
          sku_id: csvRows[i].sku_id.toString().trim(),
          units: parseFloat(csvRows[i].units),
          mrp: parseFloat(csvRows[i].mrp),
          sp: parseFloat(csvRows[i].sp),
          margin: parseFloat(csvRows[i].margin),
          rlp: parseFloat(csvRows[i].rlp),
          rlp_w_o_tax: parseFloat(csvRows[i].rlp_w_o_tax)
        });
      }
    }

    // If there are validation errors, return early
    if (errors.length > 0) {
      return {
        success: false,
        data: [],
        errors,
        summary: {
          totalRows: csvRows.length,
          successCount: 0,
          errorCount: errors.length,
          processedAt: new Date().toISOString()
        }
      };
    }

    // Second pass: Fetch product data for valid SKUs
    const skus = validRows.map(row => row.sku_id);
    const productMap = await this.fetchProductsBySKUs(skus);

    // Third pass: Process each valid row
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const product = productMap.get(row.sku_id);

      if (!product) {
        // SKU not found in product master
        errors.push({
          row: i + 1,
          sku_id: row.sku_id,
          errorType: this.constants.ERROR_TYPES.SKU_NOT_FOUND,
          message: `${this.constants.ERROR_MESSAGES.SKU_NOT_FOUND}: ${row.sku_id}`
        });
        continue;
      }

      // Create processed row with product data
      const processedRow: ProcessedCSVRow = {
        sku_id: row.sku_id,
        units: row.units,
        csv_mrp: row.mrp,
        sp: row.sp,
        margin: row.margin,
        rlp: row.rlp,
        rlp_w_o_tax: row.rlp_w_o_tax,
        imageUrl: product.ImageURL || this.constants.RESPONSE_CONFIG.DEFAULT_VALUES.imageUrl,
        productName: product.ProductName || this.constants.RESPONSE_CONFIG.DEFAULT_VALUES.productName,
        gst: product.gst || this.constants.RESPONSE_CONFIG.DEFAULT_VALUES.gst,
        hsn: product.hsn || this.constants.RESPONSE_CONFIG.DEFAULT_VALUES.hsn,
        ean_upc: product.EAN_UPC || this.constants.RESPONSE_CONFIG.DEFAULT_VALUES.ean_upc,
        brand: product.Brand || this.constants.RESPONSE_CONFIG.DEFAULT_VALUES.brand,
        original_mrp: row.units * row.mrp // Calculated field
      };

      processedRows.push(processedRow);
    }

    return {
      success: processedRows.length > 0, // Success if at least one row was processed
      data: processedRows,
      errors,
      summary: {
        totalRows: csvRows.length,
        successCount: processedRows.length,
        errorCount: errors.length,
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Main method to process CSV file
   */
  async processCSVFile(csvData: any[]): Promise<CSVProcessingResult> {
    try {
      console.log('📊 Processing CSV file with', csvData.length, 'rows');
      
      // Validate headers
      const headers = Object.keys(csvData[0] || {});
      console.log('📋 CSV headers:', headers);
      
      const headerValidation = this.validateHeaders(headers);
      
      if (!headerValidation.isValid) {
        console.log('❌ Header validation failed:', headerValidation.errors);
        return {
          success: false,
          data: [],
          errors: headerValidation.errors,
          summary: {
            totalRows: csvData.length,
            successCount: 0,
            errorCount: headerValidation.errors.length,
            processedAt: new Date().toISOString()
          }
        };
      }

      console.log('✅ Header validation passed');
      
      // Process rows
      console.log('🔄 Starting row processing...');
      return await this.processCSVRows(csvData);
    } catch (error: any) {
      console.error('❌ Error processing CSV file:', error.message);
      console.error('❌ Full error:', error);
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          errorType: this.constants.ERROR_TYPES.FILE_PROCESSING_ERROR,
          message: `${this.constants.ERROR_MESSAGES.FILE_PROCESSING_ERROR}: ${error.message}`
        }],
        summary: {
          totalRows: csvData.length,
          successCount: 0,
          errorCount: 1,
          processedAt: new Date().toISOString()
        }
      };
    }
  }
}

export default ProductCSVProcessingService;

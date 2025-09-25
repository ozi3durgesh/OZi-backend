import BulkImportLog, { ColumnError, ErrorDetails, BulkImportLogCreationAttributes } from '../models/BulkImportLog.js';
import sequelize from '../config/database.js';

export class BulkImportLogger {
  private logs: Map<string, Omit<BulkImportLogCreationAttributes, 'id'>> = new Map();
  private currentLogId: string | null = null;

  /**
   * Create a new bulk import log entry
   */
  async createLog(
    createdBy: string,
    productData: any,
    importStatus: 'SUCCESS' | 'FAILED' = 'FAILED'
  ): Promise<string> {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const logData: Omit<BulkImportLogCreationAttributes, 'id'> = {
        // Copy all product data fields
        CPId: productData.CPId || null,
        Status: productData.Status || null,
        ModelNum: productData.ModelNum || null,
        ModelName: productData.ModelName || null,
        Category: productData.Category || null,
        SKU: productData.SKU || '',
        ParentSKU: productData.ParentSKU || null,
        IS_MPS: productData.IS_MPS || null,
        ProductName: productData.ProductName || null,
        Description: productData.Description || null,
        ManufacturerDescription: productData.ManufacturerDescription || null,
        hsn: productData.hsn || null,
        ImageURL: productData.ImageURL || null,
        MRP: productData.MRP || null,
        COST: productData.COST || null,
        EAN_UPC: productData.EAN_UPC || null,
        Color: productData.Color || null,
        Size: productData.Size || null,
        Brand: productData.Brand || null,
        Weight: productData.Weight || null,
        Length: productData.Length || null,
        Height: productData.Height || null,
        Width: productData.Width || null,
        AccountingSKU: productData.AccountingSKU || null,
        AccountingUnit: productData.AccountingUnit || null,
        Flammable: productData.Flammable || 'No',
        SPThreshold: productData.SPThreshold || null,
        InventoryThreshold: productData.InventoryThreshold || null,
        ERPSystemId: productData.ERPSystemId || null,
        SyncTally: productData.SyncTally || null,
        ShelfLife: productData.ShelfLife || null,
        ShelfLifePercentage: productData.ShelfLifePercentage || null,
        ProductExpiryInDays: productData.ProductExpiryInDays || null,
        ReverseWeight: productData.ReverseWeight || null,
        ReverseLength: productData.ReverseLength || null,
        ReverseHeight: productData.ReverseHeight || null,
        ReverseWidth: productData.ReverseWidth || null,
        gst_number: productData.gst_number || null,
        CESS: productData.CESS || null,
        CreatedDate: productData.CreatedDate || null,
        LastUpdatedDate: productData.LastUpdatedDate || null,
        SKUType: productData.SKUType || null,
        MaterialType: productData.MaterialType || null,
        
        // Logging fields
        CreatedBy: createdBy,
        ImportStatus: importStatus,
        ErrorDetails: null,
        ImportDate: new Date(),
      };

      this.logs.set(logId, logData);
      this.currentLogId = logId;
      
      console.log(`📝 Created bulk import log: ${logId} for user: ${createdBy}`);
      return logId;
    } catch (error: any) {
      console.error('❌ Error creating bulk import log:', error);
      throw error;
    }
  }

  /**
   * Add column-specific error to the current log
   */
  addColumnError(
    logId: string,
    column: string,
    value: string | null,
    error: string,
    description: string,
    row?: number
  ): void {
    try {
      const logData = this.logs.get(logId);
      if (!logData) {
        console.warn(`⚠️ Log ${logId} not found for adding column error`);
        return;
      }

      const columnError: ColumnError = {
        column,
        value: value?.toString() || null,
        error,
        description,
      };

      // Initialize ErrorDetails if not exists
      if (!logData.ErrorDetails) {
        logData.ErrorDetails = [];
      }

      // Find existing error details for this row or create new one
      let errorDetail = logData.ErrorDetails.find((ed: ErrorDetails) => ed.row === (row || 0));
      if (!errorDetail) {
        errorDetail = {
          row: row || 0,
          errors: [],
          sku: logData.SKU,
        };
        logData.ErrorDetails.push(errorDetail);
      }

      // Add the column error
      errorDetail.errors.push(columnError);
      
      console.log(`📝 Added column error to log ${logId}: ${column} - ${error}`);
    } catch (error: any) {
      console.error('❌ Error adding column error:', error);
    }
  }

  /**
   * Update log status
   */
  updateLogStatus(logId: string, status: 'SUCCESS' | 'FAILED'): void {
    try {
      const logData = this.logs.get(logId);
      if (!logData) {
        console.warn(`⚠️ Log ${logId} not found for status update`);
        return;
      }

      logData.ImportStatus = status;
      console.log(`📝 Updated log ${logId} status to: ${status}`);
    } catch (error: any) {
      console.error('❌ Error updating log status:', error);
    }
  }

  /**
   * Save all logs to database
   */
  async saveLogs(): Promise<void> {
    try {
      const logsToSave = Array.from(this.logs.values());
      
      if (logsToSave.length === 0) {
        console.log('📝 No logs to save');
        return;
      }

      await BulkImportLog.bulkCreate(logsToSave);
      console.log(`📝 Saved ${logsToSave.length} bulk import logs to database`);
      
      // Clear the logs after saving
      this.logs.clear();
      this.currentLogId = null;
    } catch (error: any) {
      console.error('❌ Error saving bulk import logs:', error);
      throw error;
    }
  }

  /**
   * Get logs by user
   */
  async getLogsByUser(createdBy: string, limit: number = 50): Promise<BulkImportLog[]> {
    try {
      return await BulkImportLog.findAll({
        where: { CreatedBy: createdBy },
        order: [['ImportDate', 'DESC']],
        limit,
      });
    } catch (error: any) {
      console.error('❌ Error fetching logs by user:', error);
      throw error;
    }
  }

  /**
   * Get logs by status
   */
  async getLogsByStatus(status: 'SUCCESS' | 'FAILED', limit: number = 50): Promise<BulkImportLog[]> {
    try {
      return await BulkImportLog.findAll({
        where: { ImportStatus: status },
        order: [['ImportDate', 'DESC']],
        limit,
      });
    } catch (error: any) {
      console.error('❌ Error fetching logs by status:', error);
      throw error;
    }
  }

  /**
   * Get specific log by ID
   */
  async getLogById(id: number): Promise<BulkImportLog | null> {
    try {
      return await BulkImportLog.findByPk(id);
    } catch (error: any) {
      console.error('❌ Error fetching log by ID:', error);
      throw error;
    }
  }

  /**
   * Get current log ID
   */
  getCurrentLogId(): string | null {
    return this.currentLogId;
  }

  /**
   * Clear all logs from memory
   */
  clearLogs(): void {
    this.logs.clear();
    this.currentLogId = null;
    console.log('📝 Cleared all logs from memory');
  }

  /**
   * Get logs count
   */
  getLogsCount(): number {
    return this.logs.size;
  }
}

// Export singleton instance
export const bulkImportLogger = new BulkImportLogger();

// Export the class with a different name to avoid conflict
export { BulkImportLogger as BulkImportLoggerClass };

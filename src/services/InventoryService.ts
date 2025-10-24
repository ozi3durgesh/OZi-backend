import { Transaction } from 'sequelize';
import sequelize from '../config/database';
import Inventory from '../models/Inventory';
import InventoryLog from '../models/InventoryLog';
import { 
  INVENTORY_OPERATIONS, 
  INVENTORY_COLUMNS, 
  INVENTORY_ERRORS, 
  INVENTORY_MESSAGES,
  InventoryOperation,
  InventoryColumn 
} from '../config/inventoryConstants';

interface InventoryUpdateParams {
  sku: string;
  operation: InventoryOperation;
  quantity: number;
  referenceId?: string;
  operationDetails?: any;
  performedBy?: number;
  transaction?: Transaction;
}

interface InventoryCheckParams {
  sku: string;
  requiredQuantity: number;
  operation: InventoryOperation;
}

class InventoryService {
  /**
   * Update inventory for a specific operation
   */
  async updateInventory(params: InventoryUpdateParams): Promise<{ success: boolean; message: string; data?: any }> {
    const { sku, operation, quantity, referenceId, operationDetails, performedBy, transaction } = params;
    
    try {
      const result = await sequelize.transaction(async (t) => {
        const activeTransaction = transaction || t;
        
        // Get current inventory record
        const inventory = await Inventory.findOne({
          where: { sku },
          transaction: activeTransaction,
          lock: true, // Row-level locking for concurrency
        });

        if (!inventory) {
          // Create new inventory record if it doesn't exist
          const putawayQty = operation === INVENTORY_OPERATIONS.PUTAWAY ? quantity : 0;
          const picklistQty = operation === INVENTORY_OPERATIONS.PICKLIST ? quantity : 0;
          
          const newInventory = await Inventory.create({
            sku,
            fc_po_raise_quantity: operation === INVENTORY_OPERATIONS.PO ? quantity : 0,
            fc_po_approve_quantity: 0,
            fc_grn_quantity: operation === INVENTORY_OPERATIONS.GRN ? quantity : 0,
            fc_putaway_quantity: putawayQty,
            fc_picklist_quantity: picklistQty,
            fc_return_try_and_buy_quantity: operation === INVENTORY_OPERATIONS.RETURN_TRY_AND_BUY ? quantity : 0,
            fc_return_other_quantity: operation === INVENTORY_OPERATIONS.RETURN_OTHER ? quantity : 0,
            fc_total_available_quantity: putawayQty - picklistQty,
          }, { transaction: activeTransaction });

          // Log the operation
          await this.logInventoryOperation({
            sku,
            operation,
            quantityChange: quantity,
            previousQuantity: 0,
            newQuantity: quantity,
            referenceId,
            operationDetails,
            performedBy,
            transaction: activeTransaction,
          });

          return { success: true, message: INVENTORY_MESSAGES.SUCCESS, data: newInventory };
        }

        // Get previous quantity for the specific operation
        const previousQuantity = this.getQuantityForOperation(inventory, operation);
        const newQuantity = previousQuantity + quantity;

        // Validate quantity constraints
        if (newQuantity < 0) {
          throw new Error(INVENTORY_ERRORS.INSUFFICIENT_QUANTITY);
        }

        // Update inventory based on operation
        await this.updateInventoryByOperation(inventory, operation, quantity, activeTransaction);

        // Log the operation
        await this.logInventoryOperation({
          sku,
          operation,
          quantityChange: quantity,
          previousQuantity,
          newQuantity,
          referenceId,
          operationDetails,
          performedBy,
          transaction: activeTransaction,
        });

        return { success: true, message: INVENTORY_MESSAGES.SUCCESS, data: inventory };
      });

      return result;
    } catch (error: any) {
      console.error('Inventory update error:', error);
      return {
        success: false,
        message: error.message || INVENTORY_MESSAGES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Check if sufficient quantity is available for an operation
   */
  async checkInventoryAvailability(params: InventoryCheckParams): Promise<{ available: boolean; currentQuantity: number; message: string }> {
    const { sku, requiredQuantity, operation } = params;

    try {
      const inventory = await Inventory.findOne({
        where: { sku },
      });

      if (!inventory) {
        return {
          available: false,
          currentQuantity: 0,
          message: INVENTORY_MESSAGES.SKU_NOT_FOUND,
        };
      }

      const currentQuantity = this.getQuantityForOperation(inventory, operation);
      const available = currentQuantity >= requiredQuantity;

      return {
        available,
        currentQuantity,
        message: available ? 'Sufficient quantity available' : INVENTORY_MESSAGES.INSUFFICIENT_QUANTITY,
      };
    } catch (error: any) {
      console.error('Inventory check error:', error);
      return {
        available: false,
        currentQuantity: 0,
        message: INVENTORY_MESSAGES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Get inventory summary for a SKU
   */
  async getInventorySummary(sku: string): Promise<any> {
    try {
      const inventory = await Inventory.findOne({
        where: { sku },
      });

      if (!inventory) {
        return null;
      }

      return {
        sku: inventory.sku,
        fc_po_raise_quantity: inventory.fc_po_raise_quantity,
        fc_po_approve_quantity: inventory.fc_po_approve_quantity,
        fc_grn_quantity: inventory.fc_grn_quantity,
        fc_putaway_quantity: inventory.fc_putaway_quantity,
        fc_picklist_quantity: inventory.fc_picklist_quantity,
        fc_return_try_and_buy_quantity: inventory.fc_return_try_and_buy_quantity,
        fc_return_other_quantity: inventory.fc_return_other_quantity,
        fc_total_available_quantity: inventory.fc_total_available_quantity,
        available_for_picking: inventory.availableQuantity,
        total_inventory: inventory.totalInventory,
        created_at: inventory.created_at,
        updated_at: inventory.updated_at,
      };
    } catch (error: any) {
      console.error('Get inventory summary error:', error);
      throw error;
    }
  }

  /**
   * Get inventory logs for a SKU
   */
  async getInventoryLogs(sku: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const logs = await InventoryLog.findAndCountAll({
        where: { sku },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return logs.rows;
    } catch (error: any) {
      console.error('Get inventory logs error:', error);
      throw error;
    }
  }

  /**
   * Reconcile inventory for a SKU (fix any discrepancies)
   */
  async reconcileInventory(sku: string): Promise<{ success: boolean; message: string }> {
    try {
      await sequelize.transaction(async (t) => {
        const inventory = await Inventory.findOne({
          where: { sku },
          transaction: t,
          lock: true,
        });

        if (!inventory) {
          throw new Error(INVENTORY_MESSAGES.SKU_NOT_FOUND);
        }

        // Recalculate fc_total_available_quantity
        const calculatedAvailable = inventory.fc_putaway_quantity - inventory.fc_picklist_quantity;
        
        if (calculatedAvailable !== inventory.fc_total_available_quantity) {
          await inventory.update({
            fc_total_available_quantity: calculatedAvailable,
          }, { transaction: t });

          // Log the reconciliation
          await this.logInventoryOperation({
            sku,
            operation: 'reconciliation' as any,
            quantityChange: calculatedAvailable - inventory.fc_total_available_quantity,
            previousQuantity: inventory.fc_total_available_quantity,
            newQuantity: calculatedAvailable,
            operationDetails: { type: 'reconciliation', reason: 'quantity_mismatch' },
            transaction: t,
          });
        }
      });

      return { success: true, message: 'Inventory reconciled successfully' };
    } catch (error: any) {
      console.error('Inventory reconciliation error:', error);
      return {
        success: false,
        message: error.message || INVENTORY_MESSAGES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Bulk update inventory for multiple SKUs
   */
  async bulkUpdateInventory(updates: InventoryUpdateParams[]): Promise<{ success: boolean; results: any[] }> {
    try {
      const results = await sequelize.transaction(async (t) => {
        const updateResults: { success: boolean; message: string; data?: any }[] = [];

        for (const update of updates) {
          const result = await this.updateInventory({
            ...update,
            transaction: t,
          });
          updateResults.push(result);
        }

        return updateResults;
      });

      return { success: true, results };
    } catch (error: any) {
      console.error('Bulk inventory update error:', error);
      return {
        success: false,
        results: [],
      };
    }
  }

  /**
   * Private helper methods
   */
  private getQuantityForOperation(inventory: Inventory, operation: InventoryOperation): number {
    switch (operation) {
      case INVENTORY_OPERATIONS.PO:
        return inventory.fc_po_raise_quantity;
      case INVENTORY_OPERATIONS.GRN:
        return inventory.fc_grn_quantity;
      case INVENTORY_OPERATIONS.PUTAWAY:
        return inventory.fc_putaway_quantity;
      case INVENTORY_OPERATIONS.PICKLIST:
        return inventory.fc_picklist_quantity;
      case INVENTORY_OPERATIONS.RETURN_TRY_AND_BUY:
        return inventory.fc_return_try_and_buy_quantity;
      case INVENTORY_OPERATIONS.RETURN_OTHER:
        return inventory.fc_return_other_quantity;
      default:
        return 0;
    }
  }

  private async updateInventoryByOperation(
    inventory: Inventory, 
    operation: InventoryOperation, 
    quantity: number, 
    transaction: Transaction
  ): Promise<void> {
    const updateData: any = {};

    switch (operation) {
      case INVENTORY_OPERATIONS.PO:
        updateData.fc_po_raise_quantity = inventory.fc_po_raise_quantity + quantity;
        break;
      case INVENTORY_OPERATIONS.GRN:
        updateData.fc_grn_quantity = inventory.fc_grn_quantity + quantity;
        break;
      case INVENTORY_OPERATIONS.PUTAWAY:
        updateData.fc_putaway_quantity = inventory.fc_putaway_quantity + quantity;
        updateData.fc_total_available_quantity = inventory.fc_total_available_quantity + quantity;
        break;
      case INVENTORY_OPERATIONS.PICKLIST:
        updateData.fc_picklist_quantity = inventory.fc_picklist_quantity + quantity;
        updateData.fc_total_available_quantity = inventory.fc_total_available_quantity - quantity;
        break;
      case INVENTORY_OPERATIONS.RETURN_TRY_AND_BUY:
        updateData.fc_return_try_and_buy_quantity = inventory.fc_return_try_and_buy_quantity + quantity;
        break;
      case INVENTORY_OPERATIONS.RETURN_OTHER:
        updateData.fc_return_other_quantity = inventory.fc_return_other_quantity + quantity;
        break;
    }

    await inventory.update(updateData, { transaction });
  }

  private async logInventoryOperation(params: {
    sku: string;
    operation: string;
    quantityChange: number;
    previousQuantity: number;
    newQuantity: number;
    referenceId?: string;
    operationDetails?: any;
    performedBy?: number;
    transaction?: Transaction;
  }): Promise<void> {
    const {
      sku,
      operation,
      quantityChange,
      previousQuantity,
      newQuantity,
      referenceId,
      operationDetails,
      performedBy,
      transaction,
    } = params;

    await InventoryLog.create({
      sku,
      operation_type: operation,
      quantity_change: quantityChange,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reference_id: referenceId,
      operation_details: operationDetails,
      performed_by: performedBy,
    }, { transaction });
  }
}

export { InventoryService };
export default InventoryService;

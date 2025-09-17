/**
 * Direct Inventory Service
 * Simple, efficient inventory updates without complex triggers
 */

import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';

interface InventoryUpdateResult {
  success: boolean;
  message: string;
  data?: any;
}

interface InventorySummary {
  sku: string;
  po_quantity: number;
  grn_quantity: number;
  putaway_quantity: number;
  picklist_quantity: number;
  return_try_and_buy_quantity: number;
  return_other_quantity: number;
  total_available_quantity: number;
  total_inventory: number;
}

class DirectInventoryService {
  
  /**
   * Update inventory directly in database
   */
  async updateInventory(params: {
    sku: string;
    operation: string;
    quantity: number;
    referenceId?: string;
    operationDetails?: any;
    performedBy?: number;
  }): Promise<InventoryUpdateResult> {
    const { sku, operation, quantity, referenceId, operationDetails, performedBy } = params;
    
    try {
      // Start transaction
      const transaction = await sequelize.transaction();
      
      try {
        // Get current inventory
        const currentInventory = await sequelize.query(
          'SELECT * FROM inventory WHERE sku = ? FOR UPDATE',
          {
            replacements: [sku],
            type: QueryTypes.SELECT,
            transaction
          }
        );

        let currentQuantities = {
          po_quantity: 0,
          grn_quantity: 0,
          putaway_quantity: 0,
          picklist_quantity: 0,
          return_try_and_buy_quantity: 0,
          return_other_quantity: 0
        };

        if (currentInventory.length > 0) {
          const inv = currentInventory[0] as any;
          currentQuantities = {
            po_quantity: inv.po_quantity || 0,
            grn_quantity: inv.grn_quantity || 0,
            putaway_quantity: inv.putaway_quantity || 0,
            picklist_quantity: inv.picklist_quantity || 0,
            return_try_and_buy_quantity: inv.return_try_and_buy_quantity || 0,
            return_other_quantity: inv.return_other_quantity || 0
          };
        }

        // Calculate new quantities based on operation
        let newQuantities = { ...currentQuantities };
        let previousQuantity = 0;
        let newQuantity = 0;

        switch (operation) {
          case INVENTORY_OPERATIONS.PO:
            previousQuantity = currentQuantities.po_quantity;
            newQuantities.po_quantity = currentQuantities.po_quantity + quantity;
            newQuantity = newQuantities.po_quantity;
            break;
            
          case INVENTORY_OPERATIONS.GRN:
            previousQuantity = currentQuantities.grn_quantity;
            newQuantities.grn_quantity = currentQuantities.grn_quantity + quantity;
            newQuantity = newQuantities.grn_quantity;
            break;
            
          case INVENTORY_OPERATIONS.PUTAWAY:
            previousQuantity = currentQuantities.putaway_quantity;
            newQuantities.putaway_quantity = currentQuantities.putaway_quantity + quantity;
            newQuantity = newQuantities.putaway_quantity;
            break;
            
          case INVENTORY_OPERATIONS.PICKLIST:
            previousQuantity = currentQuantities.picklist_quantity;
            newQuantities.picklist_quantity = currentQuantities.picklist_quantity + quantity;
            newQuantity = newQuantities.picklist_quantity;
            break;
            
          case INVENTORY_OPERATIONS.RETURN_TRY_AND_BUY:
            previousQuantity = currentQuantities.return_try_and_buy_quantity;
            newQuantities.return_try_and_buy_quantity = currentQuantities.return_try_and_buy_quantity + quantity;
            newQuantity = newQuantities.return_try_and_buy_quantity;
            break;
            
          case INVENTORY_OPERATIONS.RETURN_OTHER:
            previousQuantity = currentQuantities.return_other_quantity;
            newQuantities.return_other_quantity = currentQuantities.return_other_quantity + quantity;
            newQuantity = newQuantities.return_other_quantity;
            break;
            
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        // Calculate total available quantity (putaway - picklist)
        const totalAvailableQuantity = Math.max(0, newQuantities.putaway_quantity - newQuantities.picklist_quantity);
        
        // Calculate total inventory
        const totalInventory = 
          newQuantities.po_quantity + 
          newQuantities.grn_quantity + 
          newQuantities.putaway_quantity + 
          newQuantities.picklist_quantity + 
          newQuantities.return_try_and_buy_quantity + 
          newQuantities.return_other_quantity;

        // Update or insert inventory record
        if (currentInventory.length > 0) {
          await sequelize.query(
            `UPDATE inventory SET 
             po_quantity = ?, 
             grn_quantity = ?, 
             putaway_quantity = ?, 
             picklist_quantity = ?, 
             return_try_and_buy_quantity = ?, 
             return_other_quantity = ?, 
             total_available_quantity = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE sku = ?`,
            {
              replacements: [
                newQuantities.po_quantity,
                newQuantities.grn_quantity,
                newQuantities.putaway_quantity,
                newQuantities.picklist_quantity,
                newQuantities.return_try_and_buy_quantity,
                newQuantities.return_other_quantity,
                totalAvailableQuantity,
                sku
              ],
              transaction
            }
          );
        } else {
          await sequelize.query(
            `INSERT INTO inventory (
             sku, po_quantity, grn_quantity, putaway_quantity, picklist_quantity, 
             return_try_and_buy_quantity, return_other_quantity, total_available_quantity,
             created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            {
              replacements: [
                sku,
                newQuantities.po_quantity,
                newQuantities.grn_quantity,
                newQuantities.putaway_quantity,
                newQuantities.picklist_quantity,
                newQuantities.return_try_and_buy_quantity,
                newQuantities.return_other_quantity,
                totalAvailableQuantity
              ],
              transaction
            }
          );
        }

        // Log the operation
        await sequelize.query(
          `INSERT INTO inventory_logs (
           sku, operation_type, quantity_change, previous_quantity, new_quantity,
           reference_id, operation_details, performed_by, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          {
            replacements: [
              sku,
              operation,
              quantity,
              previousQuantity,
              newQuantity,
              referenceId || null,
              operationDetails ? JSON.stringify(operationDetails) : null,
              performedBy || 1
            ],
            transaction
          }
        );

        // Commit transaction
        await transaction.commit();

        return {
          success: true,
          message: `Inventory updated successfully for SKU ${sku}`,
          data: {
            sku,
            operation,
            quantity_change: quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            total_available_quantity: totalAvailableQuantity,
            total_inventory: totalInventory
          }
        };

      } catch (error: any) {
        await transaction.rollback();
        throw error;
      }

    } catch (error: any) {
      console.error(`❌ Error updating inventory for SKU ${sku}:`, error.message);
      return {
        success: false,
        message: `Failed to update inventory: ${error.message}`
      };
    }
  }

  /**
   * Get inventory summary for a SKU
   */
  async getInventorySummary(sku: string): Promise<InventorySummary | null> {
    try {
      const result = await sequelize.query(
        'SELECT * FROM inventory WHERE sku = ?',
        {
          replacements: [sku],
          type: QueryTypes.SELECT
        }
      );

      if (result.length === 0) {
        return null;
      }

      const inventory = result[0] as any;
      return {
        sku: inventory.sku,
        po_quantity: inventory.po_quantity || 0,
        grn_quantity: inventory.grn_quantity || 0,
        putaway_quantity: inventory.putaway_quantity || 0,
        picklist_quantity: inventory.picklist_quantity || 0,
        return_try_and_buy_quantity: inventory.return_try_and_buy_quantity || 0,
        return_other_quantity: inventory.return_other_quantity || 0,
        total_available_quantity: inventory.total_available_quantity || 0,
        total_inventory: (inventory.po_quantity || 0) + 
                       (inventory.grn_quantity || 0) + 
                       (inventory.putaway_quantity || 0) + 
                       (inventory.picklist_quantity || 0) + 
                       (inventory.return_try_and_buy_quantity || 0) + 
                       (inventory.return_other_quantity || 0)
      };
    } catch (error: any) {
      console.error(`❌ Error getting inventory summary for SKU ${sku}:`, error.message);
      return null;
    }
  }

  /**
   * Get inventory logs for a SKU
   */
  async getInventoryLogs(sku: string, limit: number = 10): Promise<any[]> {
    try {
      const result = await sequelize.query(
        'SELECT * FROM inventory_logs WHERE sku = ? ORDER BY created_at DESC LIMIT ?',
        {
          replacements: [sku, limit],
          type: QueryTypes.SELECT
        }
      );

      return result;
    } catch (error: any) {
      console.error(`❌ Error getting inventory logs for SKU ${sku}:`, error.message);
      return [];
    }
  }

  /**
   * Check inventory availability
   */
  async checkAvailability(sku: string, requiredQuantity: number): Promise<{
    available: boolean;
    available_quantity: number;
    required_quantity: number;
    shortfall: number;
  }> {
    try {
      const summary = await this.getInventorySummary(sku);
      
      if (!summary) {
        return {
          available: false,
          available_quantity: 0,
          required_quantity: requiredQuantity,
          shortfall: requiredQuantity
        };
      }

      const availableQuantity = summary.total_available_quantity;
      const shortfall = Math.max(0, requiredQuantity - availableQuantity);

      return {
        available: availableQuantity >= requiredQuantity,
        available_quantity: availableQuantity,
        required_quantity: requiredQuantity,
        shortfall
      };
    } catch (error: any) {
      console.error(`❌ Error checking availability for SKU ${sku}:`, error.message);
      return {
        available: false,
        available_quantity: 0,
        required_quantity: requiredQuantity,
        shortfall: requiredQuantity
      };
    }
  }
}

export default new DirectInventoryService();

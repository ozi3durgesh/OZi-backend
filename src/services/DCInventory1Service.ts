import DCInventory1 from '../models/DCInventory1';
import { Transaction, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

export class DCInventory1Service {
  /**
   * Update or create DC inventory record when PO is raised
   */
  static async updateOnPORaise(
    skuId: string,
    dcId: number,
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const [record, created] = await DCInventory1.findOrCreate({
        where: { 
          sku_id: skuId,
          dc_id: dcId
        },
        defaults: {
          sku_id: skuId,
          dc_id: dcId,
          po_raise_quantity: quantity,
          po_approve_quantity: 0,
          grn_done: 0,
          total_available_quantity: 0,
        },
        transaction,
      });

      if (!created) {
        // Update existing record by adding to po_raise_quantity
        await record.update(
          {
            po_raise_quantity: record.po_raise_quantity + quantity,
          },
          { transaction }
        );
      }

      console.log(`✅ DC Inventory updated for SKU ${skuId} in DC ${dcId}: +${quantity} PO raised`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on PO raise:', error);
      throw error;
    }
  }

  /**
   * Update DC inventory record when PO is approved
   */
  static async updateOnPOApprove(
    skuId: string,
    dcId: number,
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { 
          sku_id: skuId,
          dc_id: dcId
        },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for SKU ${skuId} in DC ${dcId}`);
        return;
      }

      await record.update(
        {
          po_approve_quantity: record.po_approve_quantity + quantity,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for SKU ${skuId} in DC ${dcId}: +${quantity} PO approved`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on PO approve:', error);
      throw error;
    }
  }


  /**
   * Update DC inventory record when GRN is done
   */
  static async updateOnGRNDone(
    skuId: string,
    dcId: number,
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { 
          sku_id: skuId,
          dc_id: dcId
        },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for SKU ${skuId} in DC ${dcId}`);
        return;
      }

      // Update grn_done
      const newGrnDone = record.grn_done + quantity;
      
      // Calculate total_available_quantity = grn_done - fc_po_raise_quantity (for matching dc_id)
      // Get fc_po_raise_quantity from inventory table for the same dc_id and sku
      const inventoryRecord = await sequelize.query(`
        SELECT fc_po_raise_quantity 
        FROM inventory 
        WHERE dc_id = :dcId AND sku = :skuId
        LIMIT 1
      `, {
        replacements: { dcId, skuId },
        type: QueryTypes.SELECT,
        transaction
      });

      const fcPoRaiseQuantity = inventoryRecord.length > 0 ? (inventoryRecord[0] as any).fc_po_raise_quantity : 0;
      const totalAvailableQuantity = newGrnDone - fcPoRaiseQuantity;

      await record.update(
        {
          grn_done: newGrnDone,
          total_available_quantity: totalAvailableQuantity,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for SKU ${skuId} in DC ${dcId}: +${quantity} GRN done, total_available_quantity: ${totalAvailableQuantity}`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on GRN done:', error);
      throw error;
    }
  }

  /**
   * Update DC inventory record when FC PO is raised (reduces total_available_quantity)
   */
  static async updateOnFCPORaise(
    skuId: string,
    dcId: number,
    fcPoRaiseQuantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { 
          sku_id: skuId,
          dc_id: dcId
        },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for SKU ${skuId} in DC ${dcId}`);
        return;
      }

      // Recalculate total_available_quantity = grn_done - fc_po_raise_quantity
      const totalAvailableQuantity = record.grn_done - fcPoRaiseQuantity;

      await record.update(
        {
          total_available_quantity: totalAvailableQuantity,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for SKU ${skuId} in DC ${dcId}: total_available_quantity recalculated to ${totalAvailableQuantity} (grn_done: ${record.grn_done} - fc_po_raise: ${fcPoRaiseQuantity})`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on FC PO raise:', error);
      throw error;
    }
  }

  /**
   * Get DC inventory record by SKU ID and DC ID
   */
  static async getBySkuIdAndDcId(
    skuId: string,
    dcId: number,
    transaction?: Transaction
  ): Promise<DCInventory1 | null> {
    try {
      return await DCInventory1.findOne({
        where: { 
          sku_id: skuId,
          dc_id: dcId
        },
        transaction,
      });
    } catch (error) {
      console.error('❌ Error fetching DC Inventory by SKU ID and DC ID:', error);
      throw error;
    }
  }

  /**
   * Get DC inventory records by DC ID
   */
  static async getByDcId(
    dcId: number,
    transaction?: Transaction
  ): Promise<DCInventory1[]> {
    try {
      return await DCInventory1.findAll({
        where: { dc_id: dcId },
        transaction,
        order: [['updated_at', 'DESC']],
      });
    } catch (error) {
      console.error('❌ Error fetching DC Inventory by DC ID:', error);
      throw error;
    }
  }

  /**
   * Get all DC inventory records
   */
  static async getAll(transaction?: Transaction): Promise<DCInventory1[]> {
    try {
      return await DCInventory1.findAll({
        transaction,
        order: [['updated_at', 'DESC']],
      });
    } catch (error) {
      console.error('❌ Error fetching all DC Inventory records:', error);
      throw error;
    }
  }
}

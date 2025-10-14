import DCInventory1 from '../models/DCInventory1';
import { Transaction } from 'sequelize';

export class DCInventory1Service {
  /**
   * Update or create DC inventory record when PO is raised
   */
  static async updateOnPORaise(
    catalogueId: string,
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const [record, created] = await DCInventory1.findOrCreate({
        where: { catalogue_id: catalogueId },
        defaults: {
          catalogue_id: catalogueId,
          po_raise_quantity: quantity,
          po_approve_quantity: 0,
          sku_split: null,
          grn_done: null,
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

      console.log(`✅ DC Inventory updated for catalogue ${catalogueId}: +${quantity} PO raised`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on PO raise:', error);
      throw error;
    }
  }

  /**
   * Update DC inventory record when PO is approved
   */
  static async updateOnPOApprove(
    catalogueId: string,
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { catalogue_id: catalogueId },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for catalogue ${catalogueId}`);
        return;
      }

      await record.update(
        {
          po_approve_quantity: record.po_approve_quantity + quantity,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for catalogue ${catalogueId}: +${quantity} PO approved`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on PO approve:', error);
      throw error;
    }
  }

  /**
   * Update DC inventory record when SKU split is done
   */
  static async updateOnSKUSplit(
    catalogueId: string,
    skuSplitData: Record<string, number>,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { catalogue_id: catalogueId },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for catalogue ${catalogueId}`);
        return;
      }

      // Merge with existing sku_split data
      const existingSkuSplit = record.sku_split || {};
      const mergedSkuSplit = { ...existingSkuSplit };

      // Add new SKU split data
      Object.entries(skuSplitData).forEach(([sku, quantity]) => {
        mergedSkuSplit[sku] = (mergedSkuSplit[sku] || 0) + quantity;
      });

      await record.update(
        {
          sku_split: mergedSkuSplit,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for catalogue ${catalogueId}: SKU split updated`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on SKU split:', error);
      throw error;
    }
  }

  /**
   * Update DC inventory record when GRN is done
   */
  static async updateOnGRNDone(
    catalogueId: string,
    grnData: Record<string, number>,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { catalogue_id: catalogueId },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for catalogue ${catalogueId}`);
        return;
      }

      // Merge with existing grn_done data
      const existingGrnDone = record.grn_done || {};
      const mergedGrnDone = { ...existingGrnDone };

      // Add new GRN data
      Object.entries(grnData).forEach(([sku, quantity]) => {
        mergedGrnDone[sku] = (mergedGrnDone[sku] || 0) + quantity;
      });

      await record.update(
        {
          grn_done: mergedGrnDone,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for catalogue ${catalogueId}: GRN done updated`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on GRN done:', error);
      throw error;
    }
  }

  /**
   * Get DC inventory record by catalogue ID
   */
  static async getByCatalogueId(
    catalogueId: string,
    transaction?: Transaction
  ): Promise<DCInventory1 | null> {
    try {
      return await DCInventory1.findOne({
        where: { catalogue_id: catalogueId },
        transaction,
      });
    } catch (error) {
      console.error('❌ Error fetching DC Inventory by catalogue ID:', error);
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

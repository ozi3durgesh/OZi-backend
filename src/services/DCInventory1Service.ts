import DCInventory1 from '../models/DCInventory1';
import { Transaction } from 'sequelize';

export class DCInventory1Service {
  /**
   * Update or create DC inventory record when PO is raised
   */
  static async updateOnPORaise(
    skuId: string,
    catalogueId: string,
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const [record, created] = await DCInventory1.findOrCreate({
        where: { sku_id: skuId },
        defaults: {
          sku_id: skuId,
          catalogue_id: catalogueId,
          po_raise_quantity: quantity,
          po_approve_quantity: 0,
          grn_done: 0,
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

      console.log(`✅ DC Inventory updated for SKU ${skuId}: +${quantity} PO raised`);
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
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { sku_id: skuId },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for SKU ${skuId}`);
        return;
      }

      await record.update(
        {
          po_approve_quantity: record.po_approve_quantity + quantity,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for SKU ${skuId}: +${quantity} PO approved`);
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
    quantity: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const record = await DCInventory1.findOne({
        where: { sku_id: skuId },
        transaction,
      });

      if (!record) {
        console.warn(`⚠️ No DC Inventory record found for SKU ${skuId}`);
        return;
      }

      await record.update(
        {
          grn_done: record.grn_done + quantity,
        },
        { transaction }
      );

      console.log(`✅ DC Inventory updated for SKU ${skuId}: +${quantity} GRN done`);
    } catch (error) {
      console.error('❌ Error updating DC Inventory on GRN done:', error);
      throw error;
    }
  }

  /**
   * Get DC inventory record by SKU ID
   */
  static async getBySkuId(
    skuId: string,
    transaction?: Transaction
  ): Promise<DCInventory1 | null> {
    try {
      return await DCInventory1.findOne({
        where: { sku_id: skuId },
        transaction,
      });
    } catch (error) {
      console.error('❌ Error fetching DC Inventory by SKU ID:', error);
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

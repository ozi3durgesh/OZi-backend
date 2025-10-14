import { Op } from 'sequelize';
import DCSkuSplitted from '../../models/DCSkuSplitted';
import DCPurchaseOrder from '../../models/DCPurchaseOrder';
import DCPOProduct from '../../models/DCPOProduct';
import ParentProductMasterDC from '../../models/ParentProductMasterDC';
import DCGrn from '../../models/DCGrn.model';
import DCGrnLine from '../../models/DCGrnLine';
import DCGrnBatch from '../../models/DCGrnBatch';
import DCGrnPhoto from '../../models/DCGrnPhoto';
import sequelize from '../../config/database';
import { DC_PO_CONSTANTS } from '../../constants/dcPOConstants';
import { DCInventory1Service } from '../DCInventory1Service';

export interface SkuSplittingStatus {
  status: 'pending' | 'partial' | 'completed';
  totalSplitQuantity: number;
  remainingQuantity: number;
  splitSkusCount: number;
}

export interface CreateSkuSplitData {
  poId: number;
  catalogueId: string;
  sku: string;
  skuSplittedQuantity: number;
  createdBy: number;
}

export interface SkuSplitDetails {
  catalogue_id: string;
  received_quantity: number;
  total_split_quantity: number;
  remaining_quantity: number;
  splitting_status: 'pending' | 'partial' | 'completed';
  split_skus: Array<{
    id: number;
    sku: string;
    sku_splitted_quantity: number;
    createdAt: Date;
  }>;
}

export class DCSkuSplittingService {
  /**
   * Generate unique SKU: category_id + 5 random digits
   */
  static generateUniqueSku(categoryId: number): string {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${categoryId}${randomDigits}`;
  }

  /**
   * Generate unique SKU with catalogue_id: catalogue_id + 5 random digits
   */
  static generateUniqueSkuWithCatalogueId(catalogueId: string): string {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${catalogueId}${randomDigits}`;
  }

  /**
   * Validate SKU format: exactly 12 digits (category_id + 5 digits)
   */
  static validateSkuFormat(sku: string, categoryId: number): boolean {
    if (sku.length !== 12) return false;
    if (!/^\d+$/.test(sku)) return false;
    
    const expectedPrefix = categoryId.toString();
    return sku.startsWith(expectedPrefix);
  }

  /**
   * Validate SKU format with catalogue_id: exactly 12 digits (catalogue_id + 5 digits)
   */
  static validateSkuFormatWithCatalogueId(sku: string, catalogueId: string): boolean {
    if (sku.length !== 12) return false;
    if (!/^\d+$/.test(sku)) return false;
    
    return sku.startsWith(catalogueId);
  }

  /**
   * Check if SKU is unique
   */
  static async isSkuUnique(sku: string): Promise<boolean> {
    const existingSku = await DCSkuSplitted.findOne({
      where: { sku }
    });
    return !existingSku;
  }

  /**
   * Get SKU splitting status for a specific PO and catalogue_id
   */
  static async getSkuSplittingStatus(poId: number, catalogueId: string): Promise<SkuSplittingStatus> {
    // Get the original product details
    const product = await DCPOProduct.findOne({
      where: { 
        dcPOId: poId,
        catalogue_id: catalogueId 
      },
      include: [
        {
          model: ParentProductMasterDC,
          as: 'Product',
          attributes: ['category_id']
        }
      ]
    });

    if (!product) {
      throw new Error('Product not found for the given PO and catalogue ID');
    }

    const receivedQuantity = product.quantity;

    // Get all split SKUs for this PO and catalogue_id
    const splitSkus = await DCSkuSplitted.findAll({
      where: {
        po_id: poId,
        catalogue_id: catalogueId
      }
    });

    const totalSplitQuantity = splitSkus.reduce((sum, sku) => sum + sku.sku_splitted_quantity, 0);
    const remainingQuantity = receivedQuantity - totalSplitQuantity;
    const splitSkusCount = splitSkus.length;

    let status: 'pending' | 'partial' | 'completed';
    
    if (totalSplitQuantity === 0) {
      status = 'pending';
    } else if (totalSplitQuantity < receivedQuantity) {
      status = 'partial';
    } else if (totalSplitQuantity === receivedQuantity) {
      status = 'completed';
    } else {
      // This should never happen due to validation
      throw new Error('Split quantity cannot exceed received quantity');
    }

    return {
      status,
      totalSplitQuantity,
      remainingQuantity,
      splitSkusCount
    };
  }

  /**
   * Create a new SKU split
   */
  static async createSkuSplit(data: CreateSkuSplitData): Promise<DCSkuSplitted> {
    const { poId, catalogueId, sku, skuSplittedQuantity, createdBy } = data;

    // Validate PO exists and is approved
    const po = await DCPurchaseOrder.findByPk(poId);
    if (!po) {
      throw new Error('Purchase Order not found');
    }
    if (po.status !== 'APPROVED') {
      throw new Error('Purchase Order must be approved to create SKU splits');
    }

    // Get product details
    const product = await DCPOProduct.findOne({
      where: { 
        dcPOId: poId,
        catalogue_id: catalogueId 
      },
      include: [
        {
          model: ParentProductMasterDC,
          as: 'Product'
        }
      ]
    });

    if (!product) {
      throw new Error('Product not found for the given PO and catalogue ID');
    }

    // Validate SKU format - SKU should start with catalogue_id (7 digits) + 5 more digits = 12 total
    if (!this.validateSkuFormatWithCatalogueId(sku, catalogueId)) {
      throw new Error(`Invalid SKU format. Must be 12 digits starting with catalogue_id (${catalogueId})`);
    }

    // Check if SKU already exists for this PO and catalogue_id
    const existingSkuSplit = await DCSkuSplitted.findOne({
      where: {
        po_id: poId,
        catalogue_id: catalogueId,
        sku: sku
      }
    });

    if (existingSkuSplit) {
      // Get current splitting status to check remaining quantity
      const currentSplittingStatus = await this.getSkuSplittingStatus(poId, catalogueId);
      
      // Validate that the new quantity doesn't exceed remaining quantity
      if (skuSplittedQuantity > currentSplittingStatus.remainingQuantity) {
        throw new Error(`Split quantity (${skuSplittedQuantity}) cannot exceed remaining quantity (${currentSplittingStatus.remainingQuantity}) for this PO and catalogue`);
      }

      // Update existing SKU split quantity
      const newQuantity = existingSkuSplit.sku_splitted_quantity + skuSplittedQuantity;

      await existingSkuSplit.update({
        sku_splitted_quantity: newQuantity,
        updatedBy: JSON.stringify([...JSON.parse(existingSkuSplit.updatedBy), createdBy]),
        ready_for_grn: 1 // Ensure it's ready for GRN after update
      });

      // Update splitting status for this PO and catalogue_id
      await this.updateSplittingStatus(poId, catalogueId);
      
      // Update DC Inventory 1 for SKU split update
      try {
        const skuSplitData_for_inventory = {
          [sku]: skuSplittedQuantity
        };
        console.log(`🔍 SKU Split Update Hook: Updating DC Inventory for catalogue ${catalogueId} with data:`, skuSplitData_for_inventory);
        await DCInventory1Service.updateOnSKUSplit(catalogueId, skuSplitData_for_inventory);
        console.log(`✅ SKU Split Update Hook: DC Inventory updated successfully`);
      } catch (error) {
        console.error(`❌ SKU Split Update Hook Error:`, error);
        // Don't throw the error to prevent breaking the SKU split operation
      }
      
      // Get updated splitting status
      const splittingStatus = await this.getSkuSplittingStatus(poId, catalogueId);

      return {
        ...existingSkuSplit.toJSON(),
        sku_splitted_quantity: newQuantity,
        status: splittingStatus.status,
        remaining_quantity: splittingStatus.remainingQuantity,
        total_split_quantity: splittingStatus.totalSplitQuantity
      } as any;
    }

    // Check if SKU is unique globally (for different PO/catalogue combinations)
    const isUnique = await this.isSkuUnique(sku);
    if (!isUnique) {
      throw new Error('SKU already exists');
    }

    // Get current splitting status
    const splittingStatus = await this.getSkuSplittingStatus(poId, catalogueId);

    // Validate quantity
    if (skuSplittedQuantity <= 0) {
      throw new Error('Split quantity must be greater than 0');
    }

    if (skuSplittedQuantity > splittingStatus.remainingQuantity) {
      throw new Error(`Split quantity (${skuSplittedQuantity}) cannot exceed remaining quantity (${splittingStatus.remainingQuantity})`);
    }

    // Create the SKU split record
    const skuSplitData = {
      po_id: poId,
      name: product.productName,
      status: 1,
      category_id: product.category_id || 0,
      sku,
      received_quantity: product.quantity,
      sku_splitted_quantity: skuSplittedQuantity,
      catalogue_id: catalogueId,
      description: product.description || '',
      hsn: product.hsn || '',
      image_url: product.image_url || '',
      mrp: product.mrp || 0,
      ean_upc: product.ean_upc || '',
      brand_id: product.brand_id || 0,
      weight: product.weight || 0,
      length: product.length || 0,
      height: product.height || 0,
      width: product.width || 0,
      inventory_threshold: product.inventory_threshold || 0,
      gst: product.gst || 0,
      cess: product.cess || 0,
      createdBy,
      updatedBy: JSON.stringify([createdBy]),
      ready_for_grn: 1, // Set to 1 when SKU split is created
      grn_completed: 0,
      splitting_of_product: 'partially' as const,
      number_of_grn_done: 0
    };

    const skuSplit = await DCSkuSplitted.create(skuSplitData);
    
    // Update splitting status for this PO and catalogue_id
    await this.updateSplittingStatus(poId, catalogueId);
    
    // Update DC Inventory 1 for SKU split
    try {
      const skuSplitData_for_inventory = {
        [sku]: skuSplittedQuantity
      };
      console.log(`🔍 SKU Split Hook: Updating DC Inventory for catalogue ${catalogueId} with data:`, skuSplitData_for_inventory);
      await DCInventory1Service.updateOnSKUSplit(catalogueId, skuSplitData_for_inventory);
      console.log(`✅ SKU Split Hook: DC Inventory updated successfully`);
    } catch (error) {
      console.error(`❌ SKU Split Hook Error:`, error);
      // Don't throw the error to prevent breaking the SKU split operation
    }
    
    return skuSplit;
  }

  /**
   * Get SKU split details for a specific PO and catalogue_id
   */
  static async getSkuSplitDetails(poId: number, catalogueId: string): Promise<SkuSplitDetails> {
    // Get the original product details
    const product = await DCPOProduct.findOne({
      where: { 
        dcPOId: poId,
        catalogue_id: catalogueId 
      }
    });

    if (!product) {
      throw new Error('Product not found for the given PO and catalogue ID');
    }

    // Get all split SKUs for this PO and catalogue_id
    const splitSkus = await DCSkuSplitted.findAll({
      where: {
        po_id: poId,
        catalogue_id: catalogueId
      },
      order: [['createdAt', 'DESC']]
    });

    const totalSplitQuantity = splitSkus.reduce((sum, sku) => sum + sku.sku_splitted_quantity, 0);
    const remainingQuantity = product.quantity - totalSplitQuantity;

    // Use the splitting_of_product field from the database instead of calculating
    let splittingStatus: 'pending' | 'partial' | 'completed';
    
    if (splitSkus.length === 0) {
      splittingStatus = 'pending';
    } else {
      // Use the splitting_of_product field from the first SKU split (they should all be the same)
      const firstSku = splitSkus[0];
      splittingStatus = firstSku.splitting_of_product === 'completely' ? 'completed' : 'partial';
    }

    return {
      catalogue_id: catalogueId,
      received_quantity: product.quantity,
      total_split_quantity: totalSplitQuantity,
      remaining_quantity: remainingQuantity,
      splitting_status: splittingStatus,
      split_skus: splitSkus.map(sku => ({
        id: sku.id,
        po_id: sku.po_id,
        name: sku.name,
        status: sku.status,
        category_id: sku.category_id,
        sku: sku.sku,
        received_quantity: sku.received_quantity,
        sku_splitted_quantity: sku.sku_splitted_quantity,
        catalogue_id: sku.catalogue_id,
        description: sku.description,
        hsn: sku.hsn,
        image_url: sku.image_url,
        mrp: sku.mrp,
        ean_upc: sku.ean_upc,
        brand_id: sku.brand_id,
        weight: sku.weight,
        length: sku.length,
        height: sku.height,
        width: sku.width,
        inventory_threshold: sku.inventory_threshold,
        gst: sku.gst,
        cess: sku.cess,
        createdBy: sku.createdBy,
        updatedBy: sku.updatedBy,
        createdAt: sku.createdAt,
        updatedAt: sku.updatedAt
      }))
    };
  }

  /**
   * Get SKU splitting status for all products in a PO
   */
  static async getPOSSkuSplittingStatus(poId: number): Promise<Array<{
    catalogue_id: string;
    product_name: string;
    received_quantity: number;
    splitting_status: SkuSplittingStatus;
  }>> {
    // Get all products for this PO
    const products = await DCPOProduct.findAll({
      where: { dcPOId: poId },
      include: [
        {
          model: ParentProductMasterDC,
          as: 'Product',
          attributes: ['name']
        }
      ]
    });

    const results: any[] = [];

    for (const product of products) {
      const splittingStatus = await this.getSkuSplittingStatus(poId, product.catalogue_id);
      
      results.push({
        catalogue_id: product.catalogue_id,
        product_name: product.productName,
        received_quantity: product.quantity,
        splitting_status: splittingStatus
      });
    }

    return results;
  }

  /**
   * Generate a unique SKU for a given category_id
   */
  static async generateUniqueSkuForCategory(categoryId: number): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const sku = this.generateUniqueSku(categoryId);
      const isUnique = await this.isSkuUnique(sku);
      
      if (isUnique) {
        return sku;
      }
      
      attempts++;
    }

    throw new Error('Unable to generate unique SKU after multiple attempts');
  }

  /**
   * Generate a unique SKU for a given catalogue_id
   */
  static async generateUniqueSkuForCatalogueId(catalogueId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const sku = this.generateUniqueSkuWithCatalogueId(catalogueId);
      const isUnique = await this.isSkuUnique(sku);
      
      if (isUnique) {
        return sku;
      }
      
      attempts++;
    }

    throw new Error('Unable to generate unique SKU after multiple attempts');
  }

  /**
   * Update GRN status fields for a SKU split
   */
  static async updateGrnStatus(skuSplitId: number, grnQuantity: number): Promise<void> {
    const skuSplit = await DCSkuSplitted.findByPk(skuSplitId);
    if (!skuSplit) {
      throw new Error('SKU split not found');
    }

    // Update number_of_grn_done
    const newGrnDone = skuSplit.number_of_grn_done + grnQuantity;
    
    // Calculate ready_for_grn: 0 when number_of_grn_done == received_quantity, 1 otherwise
    const readyForGrn = skuSplit.received_quantity === newGrnDone ? 0 : 1;
    
    // Calculate grn_completed: 1 when received_quantity == number_of_grn_done
    const grnCompleted = skuSplit.received_quantity === newGrnDone ? 1 : 0;

    await skuSplit.update({
      number_of_grn_done: newGrnDone,
      ready_for_grn: readyForGrn,
      grn_completed: grnCompleted
    });
  }

  /**
   * Update splitting_of_product status for a PO and catalogue_id
   */
  static async updateSplittingStatus(poId: number, catalogueId: string): Promise<void> {
    console.log(`🔄 Updating splitting status for PO: ${poId}, Catalogue: ${catalogueId}`);
    
    // Get all SKU splits for this PO and catalogue_id
    const skuSplits = await DCSkuSplitted.findAll({
      where: {
        po_id: poId,
        catalogue_id: catalogueId
      }
    });

    console.log(`📊 Found ${skuSplits.length} SKU splits`);
    if (skuSplits.length === 0) return;

    // Get the original product quantity
    const product = await DCPOProduct.findOne({
      where: {
        dcPOId: poId,
        catalogue_id: catalogueId
      }
    });

    if (!product) {
      console.log(`❌ Product not found for PO: ${poId}, Catalogue: ${catalogueId}`);
      return;
    }

    const totalSkuSplittedQuantity = skuSplits.reduce((sum, sku) => sum + sku.sku_splitted_quantity, 0);
    const splittingStatus = totalSkuSplittedQuantity === product.quantity ? 'completely' : 'partially';
    
    console.log(`📈 Product quantity: ${product.quantity}, Total split quantity: ${totalSkuSplittedQuantity}, Status: ${splittingStatus}`);

    // Update all SKU splits for this PO and catalogue_id
    const [affectedRows] = await DCSkuSplitted.update(
      { splitting_of_product: splittingStatus },
      {
        where: {
          po_id: poId,
          catalogue_id: catalogueId
        }
      }
    );
    
    console.log(`✅ Updated ${affectedRows} rows with splitting status: ${splittingStatus}`);
  }

  /**
   * Get SKU splits ready for GRN with pagination
   * ready_for_grn = 1 by default, becomes 0 when number_of_grn_done == received_quantity
   */
  static async getSkuSplitsReadyForGrn(page: number = 1, limit: number = 10): Promise<{
    skuSplits: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const offset = (page - 1) * limit;

    const { count, rows: skuSplits } = await DCSkuSplitted.findAndCountAll({
      where: {
        ready_for_grn: 1
      },
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      skuSplits,
      totalCount: count,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPrevPage
    };
  }

  /**
   * Update ready_for_grn status based on current GRN progress
   * This should be called after GRN processing to update the status
   */
  static async updateReadyForGrnStatus(skuSplitId: number): Promise<void> {
    const skuSplit = await DCSkuSplitted.findByPk(skuSplitId);
    if (!skuSplit) {
      throw new Error('SKU split not found');
    }

    // ready_for_grn = 0 when number_of_grn_done == received_quantity, 1 otherwise
    const readyForGrn = skuSplit.received_quantity === skuSplit.number_of_grn_done ? 0 : 1;
    
    // grn_completed = 1 when received_quantity == number_of_grn_done
    const grnCompleted = skuSplit.received_quantity === skuSplit.number_of_grn_done ? 1 : 0;

    await skuSplit.update({
      ready_for_grn: readyForGrn,
      grn_completed: grnCompleted
    });
  }

  /**
   * Create DC GRN from SKU splits ready for GRN
   */
  static async createDCGrnFromSkuSplits(data: {
    poId: number;
    lines: Array<{
      skuId: string;
      orderedQty: number;
      receivedQty: number;
      rejectedQty?: number;
      qcPassQty: number;
      remarks?: string;
      heldQty?: number;
      rtvQty?: number;
      photos?: string;
      batches?: Array<{
        batchNo?: string | null;
        expiry?: string | null;
        qty: number;
      }>;
    }>;
    closeReason?: string;
    status: 'partial' | 'completed' | 'closed' | 'pending-qc' | 'variance-review' | 'rtv-initiated';
  }, createdBy: number): Promise<{
    grnId: number;
    message: string;
  }> {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate DC PO exists and is approved
      const dcPO = await DCPurchaseOrder.findByPk(data.poId, { transaction });
      if (!dcPO) {
        throw new Error(`DC Purchase Order ${data.poId} not found`);
      }

      if (dcPO.status !== 'APPROVED') {
        throw new Error(`DC Purchase Order ${data.poId} is not approved`);
      }

      // Check if GRN already exists for this PO
      const existingGrn = await DCGrn.findOne({
        where: { dc_po_id: data.poId },
        transaction
      });

      if (existingGrn) {
        throw new Error(`GRN already exists for DC Purchase Order ${data.poId}`);
      }

      // Create DC GRN
      const dcGrn = await DCGrn.create({
        dc_po_id: data.poId,
        status: data.status,
        closeReason: data.closeReason || null,
        created_by: createdBy,
        dc_id: dcPO.dcId
      }, { transaction });

      // Create GRN lines for each line item
      for (const line of data.lines) {
        const pendingQty = line.orderedQty - line.receivedQty;
        const lineStatus = pendingQty === 0 ? 'completed' : (line.receivedQty > 0 ? 'partial' : 'pending');

        const grnLine = await DCGrnLine.create({
          dc_grn_id: dcGrn.id,
          sku_id: line.skuId,
          ordered_qty: line.orderedQty,
          received_qty: line.receivedQty,
          pending_qty: pendingQty,
          rejected_qty: line.rejectedQty || 0,
          qc_pass_qty: line.qcPassQty,
          qc_fail_qty: line.receivedQty - line.qcPassQty,
          line_status: lineStatus,
          putaway_status: 'pending',
          remarks: line.remarks || null
        }, { transaction });

        // Create batches if provided
        if (line.batches && line.batches.length > 0) {
          for (const batch of line.batches) {
            await DCGrnBatch.create({
              dc_grn_line_id: grnLine.id,
              batch_no: batch.batchNo && batch.batchNo.trim() !== '' ? batch.batchNo : `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              expiry_date: batch.expiry && batch.expiry.trim() !== '' ? new Date(batch.expiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
              qty: batch.qty
            }, { transaction });
          }
        }

        // Create photos if provided
        if (line.photos) {
          await DCGrnPhoto.create({
            sku_id: line.skuId,
            dc_grn_id: dcGrn.id,
            dc_po_id: data.poId,
            url: line.photos,
            reason: 'sku-level-photo'
          }, { transaction });
        }

        // Update SKU split status if it exists
        const skuSplit = await DCSkuSplitted.findOne({
          where: {
            po_id: data.poId,
            sku: line.skuId,
            ready_for_grn: 1
          },
          transaction
        });

        if (skuSplit) {
          const newGrnDone = skuSplit.number_of_grn_done + line.receivedQty;
          const readyForGrn = skuSplit.received_quantity > newGrnDone ? 1 : 0;
          const grnCompleted = skuSplit.received_quantity === newGrnDone ? 1 : 0;

          await skuSplit.update({
            number_of_grn_done: newGrnDone,
            ready_for_grn: readyForGrn,
            grn_completed: grnCompleted
          }, { transaction });

          // Update DC Inventory 1 for GRN done
          const grnData = {
            [line.skuId]: line.receivedQty
          };
          await DCInventory1Service.updateOnGRNDone(skuSplit.catalogue_id, grnData, transaction);
        }
      }

      await transaction.commit();

      return {
        grnId: dcGrn.id,
        message: 'DC GRN created successfully'
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

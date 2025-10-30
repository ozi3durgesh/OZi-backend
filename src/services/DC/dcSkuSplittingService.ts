import { Op } from 'sequelize';
import DCSkuSplitted from '../../models/DCSkuSplitted';
import DCPurchaseOrder from '../../models/DCPurchaseOrder';
import DCPOSkuMatrix from '../../models/DCPOSkuMatrix';
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
   * Calculate line status based on business logic
   * @param orderedQty - Ordered quantity
   * @param rejectedQty - Rejected quantity  
   * @param qcPassQty - QC passed quantity
   * @returns line_status: 'pending' | 'partial' | 'rejected' | 'completed'
   */
  static calculateLineStatus(orderedQty: number, rejectedQty: number, qcPassQty: number): 'pending' | 'partial' | 'rejected' | 'completed' {
    // Handle edge case where ordered_qty is 0
    if (orderedQty === 0) {
      return 'pending';
    }
    
    // 1. if "ordered_qty" == "rejected_qty" then "line_status" = rejected
    if (orderedQty === rejectedQty) {
      return 'rejected';
    }
    
    // 2. if "ordered_qty" == "qc_pass_qty" then "line_status" = completed
    if (orderedQty === qcPassQty) {
      return 'completed';
    }
    
    // 3. if "ordered_qty" == "rejected_qty" + "qc_pass_qty" then "line_status" = partial
    if (orderedQty === (rejectedQty + qcPassQty)) {
      return 'partial';
    }
    
    // 4. if "ordered_qty" > "rejected_qty" (but not 0 < ordered_qty) OR "qc_pass_qty" (but not 0 < ordered_qty) then "line_status" = partial
    if ((orderedQty > rejectedQty && rejectedQty > 0) || (qcPassQty > 0 && qcPassQty < orderedQty)) {
      return 'partial';
    }
    
    // 5. if "ordered_qty" > "rejected_qty" == 0 and "qc_pass_qty" == 0 then "line_status" = pending
    if (orderedQty > rejectedQty && rejectedQty === 0 && qcPassQty === 0) {
      return 'pending';
    }
    
    // Default fallback - if none of the above conditions match, return pending
    return 'pending';
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
    // Get SKU matrix entries for this catalogue_id and sum quantities
    const skuMatrixEntries = await DCPOSkuMatrix.findAll({
      where: { 
        dcPOId: poId,
        catalogue_id: catalogueId 
      }
    });

    if (!skuMatrixEntries || skuMatrixEntries.length === 0) {
      throw new Error('Product not found for the given PO and catalogue ID');
    }

    // Sum all quantities for this catalogue_id
    const receivedQuantity = skuMatrixEntries.reduce((sum, entry) => sum + (parseInt(entry.quantity?.toString() || '0') || 0), 0);

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

    // Get SKU matrix entries for this catalogue_id
    const skuMatrixEntries = await DCPOSkuMatrix.findAll({
      where: { 
        dcPOId: poId,
        catalogue_id: catalogueId 
      }
    });

    if (!skuMatrixEntries || skuMatrixEntries.length === 0) {
      throw new Error('Product not found for the given PO and catalogue ID');
    }

    // Use first entry for product details (they all have same catalogue_id)
    const firstEntry = skuMatrixEntries[0];
    const totalQuantity = skuMatrixEntries.reduce((sum, e) => sum + parseInt(e.quantity?.toString() || '0'), 0);
    const product = {
      quantity: totalQuantity,
      productName: firstEntry.product_name || 'Unknown',
      category_id: firstEntry.category ? parseInt(firstEntry.category.toString()) : 0,
      description: firstEntry.description || '',
      hsn: firstEntry.hsn || '',
      image_url: firstEntry.image_url || '',
      mrp: parseFloat(firstEntry.mrp?.toString() || '0'),
      ean_upc: firstEntry.ean_upc || '',
      brand_id: 0, // Will be updated if brand tracking is needed
      weight: parseFloat(firstEntry.weight?.toString() || '0'),
      length: parseFloat(firstEntry.length?.toString() || '0'),
      height: parseFloat(firstEntry.height?.toString() || '0'),
      width: parseFloat(firstEntry.width?.toString() || '0'),
      inventory_threshold: parseFloat(firstEntry.inventory_threshold?.toString() || '0'),
      gst: parseFloat(firstEntry.gst?.toString() || '0'),
      cess: parseFloat(firstEntry.cess?.toString() || '0'),
    };

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
        // SKU split operations removed from DC Inventory 1
        console.log(`🔍 SKU Split Update Hook: SKU split operations removed from DC Inventory 1`);
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
      category_id: Number(product.category_id) || 0,
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
      // SKU split operations removed from DC Inventory 1
      console.log(`🔍 SKU Split Hook: SKU split operations removed from DC Inventory 1`);
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
    // Get SKU matrix entries for this catalogue_id
    const skuMatrixEntries = await DCPOSkuMatrix.findAll({
      where: { 
        dcPOId: poId,
        catalogue_id: catalogueId 
      }
    });

    if (!skuMatrixEntries || skuMatrixEntries.length === 0) {
      throw new Error('Product not found for the given PO and catalogue ID');
    }

    // Sum quantities for this catalogue_id
    const productQuantity = skuMatrixEntries.reduce((sum, e) => sum + parseInt(e.quantity?.toString() || '0'), 0);

    // Get all split SKUs for this PO and catalogue_id
    const splitSkus = await DCSkuSplitted.findAll({
      where: {
        po_id: poId,
        catalogue_id: catalogueId
      },
      order: [['createdAt', 'DESC']]
    });

    const totalSplitQuantity = splitSkus.reduce((sum, sku) => sum + sku.sku_splitted_quantity, 0);
    const remainingQuantity = productQuantity - totalSplitQuantity;

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
      received_quantity: productQuantity,
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
    // Get all SKU matrix entries for this PO and group by catalogue_id
    const skuMatrixEntries = await DCPOSkuMatrix.findAll({
      where: { dcPOId: poId }
    });

    // Group by catalogue_id
    const grouped = skuMatrixEntries.reduce((acc: any, entry: any) => {
      const catId = entry.catalogue_id;
      if (!acc[catId]) {
        acc[catId] = {
          catalogue_id: catId,
          product_name: entry.product_name || 'Unknown',
          quantity: 0
        };
      }
      acc[catId].quantity += parseInt(entry.quantity?.toString() || '0');
      return acc;
    }, {});

    const results: any[] = [];

    for (const product of Object.values(grouped) as any[]) {
      const splittingStatus = await this.getSkuSplittingStatus(poId, product.catalogue_id);
      
      results.push({
        catalogue_id: product.catalogue_id,
        product_name: product.product_name,
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
    // Get SKU matrix entries for this catalogue_id
    const skuMatrixEntries = await DCPOSkuMatrix.findAll({
      where: {
        dcPOId: poId,
        catalogue_id: catalogueId
      }
    });

    if (!skuMatrixEntries || skuMatrixEntries.length === 0) {
      console.log(`❌ Product not found for PO: ${poId}, Catalogue: ${catalogueId}`);
      return;
    }

    const productQuantity = skuMatrixEntries.reduce((sum, e) => sum + parseInt(e.quantity?.toString() || '0'), 0);
    const totalSkuSplittedQuantity = skuSplits.reduce((sum, sku) => sum + sku.sku_splitted_quantity, 0);
    const splittingStatus = totalSkuSplittedQuantity === productQuantity ? 'completely' : 'partially';
    
    console.log(`📈 Product quantity: ${productQuantity}, Total split quantity: ${totalSkuSplittedQuantity}, Status: ${splittingStatus}`);

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
      photos?: string | string[];
      batches?: Array<{
        batchNo?: string | null;
        manufacture?: string | null;
        expiry?: string | null;
        qty: number;
      }>;
    }>;
    closeReason?: string;
    status?: 'partial' | 'completed' | 'closed' | 'pending-qc' | 'variance-review' | 'rtv-initiated';
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

      // Validate each line in the request
      for (const line of data.lines) {
        // Check if this SKU already has a GRN line for this PO
        if (existingGrn) {
          const existingLine = await DCGrnLine.findOne({
            where: {
              dc_grn_id: existingGrn.id,
              sku_id: line.skuId
            },
            transaction
          });
          
          if (existingLine) {
            // Check if the line status allows further GRN processing
            if (existingLine.line_status === 'completed') {
              throw new Error(`GRN line for SKU ${line.skuId} is already completed. Cannot process further GRN for this SKU.`);
            }
            if ((existingLine.line_status as string) === 'rejected') {
              throw new Error(`GRN line for SKU ${line.skuId} is already rejected. Cannot process further GRN for this SKU.`);
            }
            // If partial or pending, we can continue
          }
        }

        // Validate orderedQty matches the PO line - check SKU matrix directly
        const poLine = await DCPOSkuMatrix.findOne({
          where: {
            dcPOId: data.poId,
            sku: line.skuId
          },
          transaction
        });

        if (!poLine) {
          throw new Error(`SKU ${line.skuId} not found in DC Purchase Order ${data.poId}`);
        }

        const poLineQuantity = parseInt(poLine.quantity?.toString() || '0');
        // Use PO line quantity as the source of truth. If client sends a different
        // orderedQty, override instead of failing the request.
        if (line.orderedQty !== poLineQuantity) {
          line.orderedQty = poLineQuantity;
        }
        // Guard against receiving more than ordered in a single call
        if (line.receivedQty > poLineQuantity) {
          throw new Error(
            `Received quantity for SKU ${line.skuId} (${line.receivedQty}) cannot exceed PO line quantity (${poLineQuantity})`
          );
        }
      }

      // Create or get existing DC GRN
      let dcGrn;
      if (existingGrn) {
        dcGrn = existingGrn;
      } else {
        dcGrn = await DCGrn.create({
          dc_po_id: data.poId,
          status: data.status || 'partial',
          closeReason: data.closeReason || null,
          created_by: createdBy,
          dc_id: dcPO.dcId
        }, { transaction });
      }

      // Create or update GRN lines for each line item
      for (const line of data.lines) {
        const pendingQty = line.orderedQty - line.receivedQty;
        const rejectedQty = line.rejectedQty || 0;
        const qcPassQty = line.qcPassQty || 0;
        
        // Calculate line status using business logic
        const lineStatus = this.calculateLineStatus(line.orderedQty, rejectedQty, qcPassQty);

        // Check if GRN line already exists for this SKU
        let grnLine = await DCGrnLine.findOne({
          where: {
            dc_grn_id: dcGrn.id,
            sku_id: line.skuId
          },
          transaction
        });

        if (grnLine) {
          // Update existing line - accumulate quantities
          const newReceivedQty = grnLine.received_qty + line.receivedQty;
          const newRejectedQty = grnLine.rejected_qty + rejectedQty;
          const newQcPassQty = grnLine.qc_pass_qty + qcPassQty;
          const newPendingQty = line.orderedQty - newReceivedQty;
          
          // Recalculate line status with accumulated quantities
          const newLineStatus = this.calculateLineStatus(line.orderedQty, newRejectedQty, newQcPassQty);

          await grnLine.update({
            received_qty: newReceivedQty,
            pending_qty: newPendingQty,
            rejected_qty: newRejectedQty,
            qc_pass_qty: newQcPassQty,
            qc_fail_qty: newReceivedQty - newQcPassQty,
            line_status: newLineStatus as 'pending' | 'partial' | 'completed' | 'rejected',
            remarks: line.remarks || grnLine.remarks
          }, { transaction });
        } else {
          // Create new line
          grnLine = await DCGrnLine.create({
            dc_grn_id: dcGrn.id,
            sku_id: line.skuId,
            ordered_qty: line.orderedQty,
            received_qty: line.receivedQty,
            pending_qty: pendingQty,
            rejected_qty: rejectedQty,
            qc_pass_qty: qcPassQty,
            qc_fail_qty: line.receivedQty - qcPassQty,
            line_status: lineStatus as 'pending' | 'partial' | 'completed' | 'rejected',
            putaway_status: 'pending',
            remarks: line.remarks || null
          }, { transaction });
        }

        // Create batches if provided
        if (line.batches && line.batches.length > 0) {
          for (const batch of line.batches) {
            await DCGrnBatch.create({
              dc_grn_line_id: grnLine.id,
              batch_no: batch.batchNo && batch.batchNo.trim() !== '' ? batch.batchNo : `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              manufacture: batch.manufacture && batch.manufacture.trim() !== '' ? new Date(batch.manufacture) : null,
              expiry_date: batch.expiry && batch.expiry.trim() !== '' ? new Date(batch.expiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
              qty: batch.qty
            }, { transaction });
          }
        }

        // Create photos if provided
        if (line.photos) {
          // Handle both array and comma-separated string
          let photoUrls: string[] = [];
          
          if (Array.isArray(line.photos)) {
            // If it's already an array, use it directly
            photoUrls = line.photos.filter(url => url && typeof url === 'string' && url.trim() !== '');
          } else if (typeof line.photos === 'string') {
            // If it's a string, check if it contains commas (comma-separated) or is a single URL
            if (line.photos.includes(',')) {
              photoUrls = line.photos.split(',').map(url => url.trim()).filter(url => url !== '');
            } else {
              photoUrls = [line.photos.trim()];
            }
          }

          // Create a separate photo record for each URL
          let photosCreated = 0;
          for (const photoUrl of photoUrls) {
            if (photoUrl && photoUrl.trim() !== '') {
              await DCGrnPhoto.create({
                sku_id: line.skuId,
                dc_grn_id: dcGrn.id,
                dc_po_id: data.poId,
                url: photoUrl.trim(),
                reason: 'sku-level-photo'
              }, { transaction });
              photosCreated++;
            }
          }
          console.log(`Created ${photosCreated} photo records for SKU ${line.skuId}`);
        }

        // Update SKU split status if splitting feature/table exists
        try {
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
          }
        } catch (err: any) {
          // If dc_sku_splitted table is not present, ignore and continue
          const msg = err?.message || '';
          const code = err?.original?.code || '';
          if (
            msg.includes("doesn't exist") ||
            msg.includes('does not exist') ||
            code === 'ER_NO_SUCH_TABLE'
          ) {
            console.warn('dc_sku_splitted table not found; skipping split-status update');
          } else {
            throw err;
          }
        }

        // Always update DC Inventory 1 for GRN done with QC passed quantity only
        // Only count QC passed quantities, not rejected ones
        // Note: We need to get the dcId from the PO, but for now using default dcId = 1
        // TODO: Pass dcId from the PO context
        await DCInventory1Service.updateOnGRNDone(line.skuId, 1, line.qcPassQty, transaction);
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

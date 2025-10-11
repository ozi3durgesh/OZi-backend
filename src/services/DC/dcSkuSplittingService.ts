import { Op } from 'sequelize';
import DCSkuSplitted from '../../models/DCSkuSplitted';
import DCPurchaseOrder from '../../models/DCPurchaseOrder';
import DCPOProduct from '../../models/DCPOProduct';
import ParentProductMasterDC from '../../models/ParentProductMasterDC';
import { DC_PO_CONSTANTS } from '../../constants/dcPOConstants';

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
        updatedBy: JSON.stringify([...JSON.parse(existingSkuSplit.updatedBy), createdBy])
      });

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
      updatedBy: JSON.stringify([createdBy])
    };

    const skuSplit = await DCSkuSplitted.create(skuSplitData);
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

    let splittingStatus: 'pending' | 'partial' | 'completed';
    
    if (totalSplitQuantity === 0) {
      splittingStatus = 'pending';
    } else if (totalSplitQuantity < product.quantity) {
      splittingStatus = 'partial';
    } else {
      splittingStatus = 'completed';
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
}

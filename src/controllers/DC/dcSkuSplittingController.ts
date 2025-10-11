import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { DCSkuSplittingService } from '../../services/DC/dcSkuSplittingService';
import DCSkuSplitted from '../../models/DCSkuSplitted';
import DCPOProduct from '../../models/DCPOProduct';
import ParentProductMasterDC from '../../models/ParentProductMasterDC';

interface AuthRequest extends Request {
  user?: any;
}

export class DCSkuSplittingController {
  /**
   * Create a new SKU split
   * POST /api/dc/purchase-orders/:poId/sku-splitting
   */
  static async createSkuSplit(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { poId } = req.params;
      const { sku, sku_splitted_quantity } = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!sku || !sku_splitted_quantity) {
        return ResponseHandler.error(res, 'SKU and split quantity are required', 400);
      }

      if (typeof sku_splitted_quantity !== 'number' || sku_splitted_quantity <= 0) {
        return ResponseHandler.error(res, 'Split quantity must be a positive number', 400);
      }

      if (typeof sku !== 'string' || sku.length !== 12) {
        return ResponseHandler.error(res, 'SKU must be exactly 12 digits', 400);
      }

      // Get catalogue_id from query params
      const { catalogue_id } = req.query;
      if (!catalogue_id || typeof catalogue_id !== 'string') {
        return ResponseHandler.error(res, 'Catalogue ID is required', 400);
      }

      const result = await DCSkuSplittingService.createSkuSplit({
        poId: parseInt(poId),
        catalogueId: catalogue_id,
        sku,
        skuSplittedQuantity: sku_splitted_quantity,
        createdBy
      });

      // Check if it's an update or create
      const isUpdate = result.id && result.sku_splitted_quantity !== sku_splitted_quantity;

      return ResponseHandler.success(res, {
        message: isUpdate ? 'SKU split updated successfully' : 'SKU split created successfully',
        data: {
          id: result.id,
          sku: result.sku,
          sku_splitted_quantity: result.sku_splitted_quantity,
          status: result.status,
          remaining_quantity: (result as any).remaining_quantity,
          total_split_quantity: (result as any).total_split_quantity
        }
      });

    } catch (error: any) {
      console.error('Create SKU split error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to create SKU split', 500);
    }
  }

  /**
   * Get SKU split details for a specific PO and catalogue_id
   * GET /api/dc/purchase-orders/:poId/sku-splitting/:catalogueId
   */
  static async getSkuSplitDetails(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { poId, catalogueId } = req.params;

      if (!poId || !catalogueId) {
        return ResponseHandler.error(res, 'PO ID and Catalogue ID are required', 400);
      }

      const splitDetails = await DCSkuSplittingService.getSkuSplitDetails(
        parseInt(poId), 
        catalogueId
      );

      return ResponseHandler.success(res, {
        message: 'SKU split details retrieved successfully',
        data: splitDetails
      });

    } catch (error: any) {
      console.error('Get SKU split details error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch SKU split details', 500);
    }
  }

  /**
   * Get SKU splitting status for all products in a PO
   * GET /api/dc/purchase-orders/:poId/sku-splitting-status
   */
  static async getPOSSkuSplittingStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { poId } = req.params;

      if (!poId) {
        return ResponseHandler.error(res, 'PO ID is required', 400);
      }

      const splittingStatus = await DCSkuSplittingService.getPOSSkuSplittingStatus(parseInt(poId));

      return ResponseHandler.success(res, {
        message: 'SKU splitting status retrieved successfully',
        data: {
          po_id: parseInt(poId),
          products: splittingStatus
        }
      });

    } catch (error: any) {
      console.error('Get PO SKU splitting status error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch SKU splitting status', 500);
    }
  }

  /**
   * Generate a unique SKU for a category
   * GET /api/dc/sku-splitting/generate-sku/:categoryId
   */
  static async generateUniqueSku(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { categoryId } = req.params;

      if (!categoryId || isNaN(parseInt(categoryId))) {
        return ResponseHandler.error(res, 'Valid category ID is required', 400);
      }

      const sku = await DCSkuSplittingService.generateUniqueSkuForCategory(parseInt(categoryId));

      return ResponseHandler.success(res, {
        message: 'Unique SKU generated successfully',
        data: {
          sku,
          category_id: parseInt(categoryId)
        }
      });

    } catch (error: any) {
      console.error('Generate unique SKU error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to generate unique SKU', 500);
    }
  }

  /**
   * Generate a unique SKU for a catalogue_id
   * GET /api/dc/sku-splitting/generate-sku-catalogue/:catalogueId
   */
  static async generateUniqueSkuForCatalogue(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { catalogueId } = req.params;

      if (!catalogueId) {
        return ResponseHandler.error(res, 'Catalogue ID is required', 400);
      }

      const sku = await DCSkuSplittingService.generateUniqueSkuForCatalogueId(catalogueId);

      return ResponseHandler.success(res, {
        message: 'Unique SKU generated successfully',
        data: {
          sku,
          catalogue_id: catalogueId
        }
      });

    } catch (error: any) {
      console.error('Generate unique SKU for catalogue error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to generate unique SKU', 500);
    }
  }

  /**
   * Get all SKU splits for a specific PO
   * GET /api/dc/purchase-orders/:poId/sku-splits
   */
  static async getPOSSkuSplits(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { poId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!poId) {
        return ResponseHandler.error(res, 'PO ID is required', 400);
      }

      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await DCSkuSplitted.findAndCountAll({
        where: { po_id: parseInt(poId) },
        limit: limitNum,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return ResponseHandler.success(res, {
        message: 'SKU splits retrieved successfully',
        data: {
          sku_splits: rows,
          pagination: {
            total: count,
            page: pageNum,
            pages: Math.ceil(count / limitNum),
            limit: limitNum,
          }
        }
      });

    } catch (error: any) {
      console.error('Get PO SKU splits error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch SKU splits', 500);
    }
  }

  /**
   * Validate SKU format
   * POST /api/dc/sku-splitting/validate-sku
   */
  static async validateSku(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { sku, category_id } = req.body;

      if (!sku || !category_id) {
        return ResponseHandler.error(res, 'SKU and category ID are required', 400);
      }

      const isValidFormat = DCSkuSplittingService.validateSkuFormat(sku, parseInt(category_id));
      const isUnique = await DCSkuSplittingService.isSkuUnique(sku);

      return ResponseHandler.success(res, {
        message: 'SKU validation completed',
        data: {
          sku,
          category_id: parseInt(category_id),
          is_valid_format: isValidFormat,
          is_unique: isUnique,
          is_valid: isValidFormat && isUnique
        }
      });

    } catch (error: any) {
      console.error('Validate SKU error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to validate SKU', 500);
    }
  }

  /**
   * Get product category_id for a given catalogue_id
   * GET /api/dc/purchase-orders/:poId/product-category/:catalogueId
   */
  static async getProductCategory(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { poId, catalogueId } = req.params;

      if (!poId || !catalogueId) {
        return ResponseHandler.error(res, 'PO ID and Catalogue ID are required', 400);
      }

      // Get product details to find category_id
      const product = await DCPOProduct.findOne({
        where: { 
          dcPOId: parseInt(poId),
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
        return ResponseHandler.error(res, 'Product not found for the given PO and catalogue ID', 404);
      }

      const categoryId = product.category_id || 0;

      return ResponseHandler.success(res, {
        message: 'Product category retrieved successfully',
        data: {
          catalogue_id: catalogueId,
          category_id: categoryId,
          product_name: product.productName
        }
      });

    } catch (error: any) {
      console.error('Get product category error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to get product category', 500);
    }
  }
}

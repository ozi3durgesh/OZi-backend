import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { DCSkuSplittingService } from '../../services/DC/dcSkuSplittingService';
import DCSkuSplitted from '../../models/DCSkuSplitted';
import DCPOSkuMatrix from '../../models/DCPOSkuMatrix';
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

      // Get SKU matrix entry to find category_id
      const skuMatrixEntry = await DCPOSkuMatrix.findOne({
        where: { 
          dcPOId: parseInt(poId),
          catalogue_id: catalogueId 
        }
      });

      if (!skuMatrixEntry) {
        return ResponseHandler.error(res, 'Product not found for the given PO and catalogue ID', 404);
      }

      // Get category_id from SKU matrix entry or ParentProductMasterDC
      let categoryId: number | null = null;
      if (skuMatrixEntry.category) {
        categoryId = parseInt(skuMatrixEntry.category.toString());
      } else {
        // Fallback: try to get from ParentProductMasterDC if catalogue_id exists
        const parentProduct = await ParentProductMasterDC.findOne({
          where: { catalogue_id: catalogueId }
        });
        if (parentProduct) {
          categoryId = parentProduct.category_id;
        }
      }

      if (!categoryId) {
        return ResponseHandler.error(res, 'Category ID not found for this product', 404);
      }

      return ResponseHandler.success(res, {
        message: 'Product category retrieved successfully',
        data: {
          catalogue_id: catalogueId,
          category_id: categoryId,
          product_name: skuMatrixEntry.product_name || 'Unknown'
        }
      });

    } catch (error: any) {
      console.error('Get product category error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to get product category', 500);
    }
  }

  /**
   * Get SKU splits ready for GRN with pagination
   * GET /api/dc/sku-splitting/ready-for-grn?page=1&limit=10
   */
  static async getSkuSplitsReadyForGrn(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      if (page < 1) {
        return ResponseHandler.error(res, 'Page number must be greater than 0', 400);
      }
      if (limit < 1 || limit > 100) {
        return ResponseHandler.error(res, 'Limit must be between 1 and 100', 400);
      }

      const result = await DCSkuSplittingService.getSkuSplitsReadyForGrn(page, limit);

      return ResponseHandler.success(res, {
        message: 'SKU splits ready for GRN retrieved successfully',
        data: {
          sku_splits: result.skuSplits,
          pagination: {
            total_count: result.totalCount,
            total_pages: result.totalPages,
            current_page: result.currentPage,
            has_next_page: result.hasNextPage,
            has_prev_page: result.hasPrevPage,
            limit: limit
          }
        }
      });

    } catch (error: any) {
      console.error('Get SKU splits ready for GRN error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch SKU splits ready for GRN', 500);
    }
  }

  /**
   * Create DC GRN from SKU splits
   * POST /api/dc/grn/create-flow
   */
  static async createDCGrnFlow(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const { poId, lines, closeReason, status } = req.body;

      // Log incoming request for debugging
      console.log('DC GRN Create Flow - Request received:', {
        poId,
        linesCount: lines?.length,
        status
      });

      // Validation
      if (!poId || !Number.isInteger(poId) || poId <= 0) {
        return ResponseHandler.error(res, 'Valid PO ID is required', 400);
      }

      if (!lines || !Array.isArray(lines) || lines.length === 0) {
        return ResponseHandler.error(res, 'Lines array is required and must not be empty', 400);
      }

      // Status is now optional - will be auto-calculated if not provided
      if (status && !['partial', 'completed', 'closed', 'pending-qc', 'variance-review', 'rtv-initiated'].includes(status)) {
        return ResponseHandler.error(res, 'Invalid status provided', 400);
      }

      // Validate each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line.skuId || typeof line.skuId !== 'string') {
          return ResponseHandler.error(res, `Line ${i + 1}: skuId is required and must be a string`, 400);
        }

        if (!Number.isInteger(line.orderedQty) || line.orderedQty <= 0) {
          return ResponseHandler.error(res, `Line ${i + 1}: orderedQty must be a positive integer`, 400);
        }

        if (!Number.isInteger(line.receivedQty) || line.receivedQty < 0) {
          return ResponseHandler.error(res, `Line ${i + 1}: receivedQty must be a non-negative integer`, 400);
        }

        if (!Number.isInteger(line.qcPassQty) || line.qcPassQty < 0) {
          return ResponseHandler.error(res, `Line ${i + 1}: qcPassQty must be a non-negative integer`, 400);
        }

        if (line.receivedQty > line.orderedQty) {
          return ResponseHandler.error(res, `Line ${i + 1}: receivedQty cannot exceed orderedQty`, 400);
        }

        if (line.qcPassQty > line.receivedQty) {
          return ResponseHandler.error(res, `Line ${i + 1}: qcPassQty cannot exceed receivedQty`, 400);
        }

        // Validate batches if provided
        if (line.batches && Array.isArray(line.batches)) {
          for (let j = 0; j < line.batches.length; j++) {
            const batch = line.batches[j];
            if (!Number.isInteger(batch.qty) || batch.qty <= 0) {
              return ResponseHandler.error(res, `Line ${i + 1}, Batch ${j + 1}: qty is required and must be a positive integer`, 400);
            }
            // batchNo and expiry can be null, but if provided they should be strings
            if (batch.batchNo !== null && batch.batchNo !== undefined && typeof batch.batchNo !== 'string') {
              return ResponseHandler.error(res, `Line ${i + 1}, Batch ${j + 1}: batchNo must be a string or null`, 400);
            }
            if (batch.expiry !== null && batch.expiry !== undefined && typeof batch.expiry !== 'string') {
              return ResponseHandler.error(res, `Line ${i + 1}, Batch ${j + 1}: expiry must be a string or null`, 400);
            }
          }
        }
      }

      // Auto-calculate status if not provided
      let calculatedStatus = status;
      if (!status) {
        let allCompleted = true;
        let hasPartial = false;
        
        for (const line of lines) {
          const totalProcessed = (line.qcPassQty || 0) + (line.rejectedQty || 0);
          if (totalProcessed < line.orderedQty) {
            allCompleted = false;
            if (totalProcessed > 0) {
              hasPartial = true;
            }
          }
        }
        
        if (allCompleted) {
          calculatedStatus = 'completed';
        } else if (hasPartial) {
          calculatedStatus = 'partial';
        } else {
          calculatedStatus = 'pending';
        }
      }

      const result = await DCSkuSplittingService.createDCGrnFromSkuSplits({
        poId,
        lines,
        closeReason,
        status: calculatedStatus
      }, userId);

      return ResponseHandler.success(res, {
        message: result.message,
        data: {
          grn_id: result.grnId,
          po_id: poId,
          status: calculatedStatus,
          lines_processed: lines.length
        }
      });

    } catch (error: any) {
      console.error('Create DC GRN flow error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to create DC GRN', 500);
    }
  }
}

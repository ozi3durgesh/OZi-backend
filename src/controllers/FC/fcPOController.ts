import { Request, Response } from 'express';
import { FCPOService } from '../../services/FC/fcPOService';
import { ResponseHandler } from '../../middleware/responseHandler';
import { FC_PO_CONSTANTS } from '../../constants/fcPOConstants';

interface AuthRequest extends Request {
  user?: any;
}

export class FCPOController {
  /**
   * Create a new FC Purchase Order
   */
  static async createFCPO(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const {
        fcId,
        dcId,
        dcPoId,
        products,
        description,
        notes,
        priority
      } = req.body;

      // Validation
      if (!fcId || !dcId || !products || !Array.isArray(products) || products.length === 0) {
        return ResponseHandler.error(res, 'FC ID, DC ID, and products are required', 400);
      }

      // Validate products array with new structure
      for (const product of products) {
        // Check for new structure with catelogue_id and total_quantity
        if (!product.catelogue_id || !product.total_quantity || !product.totalPrice) {
          return ResponseHandler.error(res, 'Each product must have catelogue_id, total_quantity, and totalPrice', 400);
        }

        // Validate total_quantity
        if (product.total_quantity < FC_PO_CONSTANTS.VALIDATION.MIN_QUANTITY || 
            product.total_quantity > FC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY) {
          return ResponseHandler.error(res, `Total quantity must be between ${FC_PO_CONSTANTS.VALIDATION.MIN_QUANTITY} and ${FC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY}`, 400);
        }

        // Validate total price
        if (product.totalPrice < FC_PO_CONSTANTS.VALIDATION.MIN_AMOUNT || 
            product.totalPrice > FC_PO_CONSTANTS.VALIDATION.MAX_AMOUNT) {
          return ResponseHandler.error(res, `Total price must be between ₹${FC_PO_CONSTANTS.VALIDATION.MIN_AMOUNT} and ₹${FC_PO_CONSTANTS.VALIDATION.MAX_AMOUNT}`, 400);
        }

        // Validate SKU matrix if provided
        if (product.sku_matrix_on_catelogue_id && Array.isArray(product.sku_matrix_on_catelogue_id)) {
          // Validate each SKU in the matrix
          for (const sku of product.sku_matrix_on_catelogue_id) {
            if (!sku.quantity || !sku.catalogue_id || !sku.sku) {
              return ResponseHandler.error(res, 'Each SKU in matrix must have quantity, catalogue_id, and sku', 400);
            }

            // Validate catalogue_id prefix matches SKU prefix (first 7 digits)
            const cataloguePrefix = product.catelogue_id.toString().substring(0, 7);
            const skuPrefix = sku.sku.toString().substring(0, 7);
            if (cataloguePrefix !== skuPrefix) {
              return ResponseHandler.error(res, `Catalogue ID prefix (${cataloguePrefix}) must match SKU prefix (${skuPrefix}) for SKU ${sku.sku}`, 400);
            }

            // Validate SKU quantity
            if (sku.quantity < 1 || sku.quantity > FC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY) {
              return ResponseHandler.error(res, `SKU quantity must be between 1 and ${FC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY}`, 400);
            }

            // Validate new required fields for SKU matrix
            if (!sku.rlp || !sku.rlp_w_o_tax || !sku.gstType) {
              return ResponseHandler.error(res, 'Each SKU in matrix must have rlp, rlp_w_o_tax, and gstType', 400);
            }

            // Validate gstType for SKU
            const validGstTypes = ['SGST+CGST', 'IGST', 'NONE'];
            if (sku.gstType && !validGstTypes.includes(sku.gstType)) {
              return ResponseHandler.error(res, 'SKU gstType must be one of: SGST+CGST, IGST, NONE', 400);
            }
          }
        }
      }

      // Validate description length
      if (description && description.length > FC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH) {
        return ResponseHandler.error(res, `Description must be less than ${FC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH} characters`, 400);
      }

      // Validate notes length
      if (notes && notes.length > FC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH) {
        return ResponseHandler.error(res, `Notes must be less than ${FC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH} characters`, 400);
      }

      // Validate priority
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (priority && !validPriorities.includes(priority)) {
        return ResponseHandler.error(res, 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT', 400);
      }

      const fcPO = await FCPOService.createFCPO({
        fcId,
        dcId,
        dcPoId,
        products,
        description,
        notes,
        priority,
        createdBy: userId,
      });

      return ResponseHandler.success(res, {
        message: FC_PO_CONSTANTS.SUCCESS.CREATED,
        data: fcPO,
      }, 201);

    } catch (error: any) {
      console.error('Create FC-PO error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to create FC Purchase Order', error.statusCode || 500);
    }
  }

  /**
   * Submit FC Purchase Order for approval
   */
  static async submitForApproval(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!id) {
        return ResponseHandler.error(res, 'FC Purchase Order ID is required', 400);
      }

      const fcPO = await FCPOService.submitForApproval(parseInt(id), userId);

      return ResponseHandler.success(res, {
        message: FC_PO_CONSTANTS.SUCCESS.SUBMITTED,
        data: fcPO,
      });

    } catch (error: any) {
      console.error('Submit FC-PO for approval error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to submit FC Purchase Order for approval', error.statusCode || 500);
    }
  }

  /**
   * Approve/Reject FC Purchase Order (DC Dashboard)
   */
  static async processApproval(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { action, comments } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!id) {
        return ResponseHandler.error(res, 'FC Purchase Order ID is required', 400);
      }

      if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
        return ResponseHandler.error(res, 'Action must be either APPROVED or REJECTED', 400);
      }

      if (action === 'REJECTED' && !comments) {
        return ResponseHandler.error(res, 'Comments are required for rejection', 400);
      }

      const approverRole = 'dc_manager'; // Default approver role

      const fcPO = await FCPOService.processApproval(
        parseInt(id),
        action,
        userId,
        approverRole,
        comments
      );

      return ResponseHandler.success(res, {
        message: action === 'APPROVED' 
          ? FC_PO_CONSTANTS.SUCCESS.APPROVED 
          : FC_PO_CONSTANTS.SUCCESS.REJECTED,
        data: fcPO,
      });

    } catch (error: any) {
      console.error('Process FC-PO approval error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to process FC Purchase Order approval', error.statusCode || 500);
    }
  }

  /**
   * Get FC Purchase Orders with filters and pagination
   */
  static async getFCPOs(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const {
        page = FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit = FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        search,
        status,
        fcId,
        dcId,
        dcPoId,
        sku,
        priority
      } = req.query;

      const filters = {
        search: search as string,
        status: status as string,
        fcId: fcId ? parseInt(fcId as string) : undefined,
        dcId: dcId ? parseInt(dcId as string) : undefined,
        dcPoId: dcPoId ? parseInt(dcPoId as string) : undefined,
        sku: sku as string,
        priority: priority as string,
      };

      const pageNum = parseInt(page as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const limitNum = Math.min(
        parseInt(limit as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        FC_PO_CONSTANTS.PAGINATION.MAX_LIMIT
      );

      const result = await FCPOService.getFCPOs(filters as any, pageNum, limitNum);

      return ResponseHandler.success(res, {
        message: FC_PO_CONSTANTS.SUCCESS.FETCHED,
        ...result,
      });

    } catch (error: any) {
      console.error('Get FC-POs error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Orders', 500);
    }
  }

  /**
   * Get FC Purchase Order by ID
   */
  static async getFCPOById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseHandler.error(res, 'FC Purchase Order ID is required', 400);
      }

      const fcPO = await FCPOService.getFCPOById(parseInt(id));

      if (!fcPO) {
        return ResponseHandler.error(res, FC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND, 404);
      }

      return ResponseHandler.success(res, {
        message: FC_PO_CONSTANTS.SUCCESS.FETCHED,
        data: fcPO,
      });

    } catch (error: any) {
      console.error('Get FC-PO by ID error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Order', 500);
    }
  }

  /**
   * Update FC Purchase Order
   */
  static async updateFCPO(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!id) {
        return ResponseHandler.error(res, 'FC Purchase Order ID is required', 400);
      }

      // Validate description length if provided
      if (updateData.description && updateData.description.length > FC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH) {
        return ResponseHandler.error(res, `Description must be less than ${FC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH} characters`, 400);
      }

      // Validate notes length if provided
      if (updateData.notes && updateData.notes.length > FC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH) {
        return ResponseHandler.error(res, `Notes must be less than ${FC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH} characters`, 400);
      }

      // Validate priority if provided
      if (updateData.priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (!validPriorities.includes(updateData.priority)) {
          return ResponseHandler.error(res, 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT', 400);
        }
      }

      const fcPO = await FCPOService.updateFCPO(parseInt(id), updateData, userId);

      return ResponseHandler.success(res, {
        message: FC_PO_CONSTANTS.SUCCESS.UPDATED,
        data: fcPO,
      });

    } catch (error: any) {
      console.error('Update FC-PO error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to update FC Purchase Order', error.statusCode || 500);
    }
  }

  /**
   * Delete FC Purchase Order
   */
  static async deleteFCPO(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseHandler.error(res, 'FC Purchase Order ID is required', 400);
      }

      await FCPOService.deleteFCPO(parseInt(id));

      return ResponseHandler.success(res, {
        message: FC_PO_CONSTANTS.SUCCESS.DELETED,
      });

    } catch (error: any) {
      console.error('Delete FC-PO error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to delete FC Purchase Order', error.statusCode || 500);
    }
  }

  /**
   * Get available products for FC PO (products that have been GRN'd from DC)
   */
  static async getAvailableProducts(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { dcId } = req.query;

      if (!dcId) {
        return ResponseHandler.error(res, 'DC ID is required', 400);
      }

      const products = await FCPOService.getAvailableProductsForFCPO(parseInt(dcId as string));

      return ResponseHandler.success(res, {
        message: 'Available products for FC PO retrieved successfully',
        data: products,
      });

    } catch (error: any) {
      console.error('Get available products error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch available products', 500);
    }
  }

  /**
   * Raise FC Purchase Order (Main endpoint)
   */
  static async raiseFCPO(req: AuthRequest, res: Response): Promise<Response> {
    // This is the same as createFCPO but with a more specific name
    return FCPOController.createFCPO(req, res);
  }
}

import { Request, Response } from 'express';
import { DCPOService } from '../../services/DC/dcPOService';
import { ResponseHandler } from '../../middleware/responseHandler';
import { DC_PO_CONSTANTS } from '../../constants/dcPOConstants';

interface AuthRequest extends Request {
  user?: any;
}

export class DCPOController {
  /**
   * Create a new DC Purchase Order
   */
  static async createDCPO(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const {
        vendorId,
        dcId,
        gstType,
        products,
        description,
        notes,
        priority
      } = req.body;

      // Validation
      if (!vendorId || !dcId || !products || !Array.isArray(products) || products.length === 0) {
        return ResponseHandler.error(res, 'Vendor ID, DC ID, and products are required', 400);
      }

      // Validate products array with new structure
      for (const product of products) {
        // Check for new structure with catalogue_id and total_quantity
        if (!product.catelogue_id || !product.totoal_quantity || !product.totalPrice) {
          return ResponseHandler.error(res, 'Each product must have catelogue_id, totoal_quantity, and totalPrice', 400);
        }

        // Validate total_quantity
        if (product.totoal_quantity < DC_PO_CONSTANTS.VALIDATION.MIN_QUANTITY || 
            product.totoal_quantity > DC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY) {
          return ResponseHandler.error(res, `Total quantity must be between ${DC_PO_CONSTANTS.VALIDATION.MIN_QUANTITY} and ${DC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY}`, 400);
        }

        // Validate total price
        if (product.totalPrice < DC_PO_CONSTANTS.VALIDATION.MIN_AMOUNT || 
            product.totalPrice > DC_PO_CONSTANTS.VALIDATION.MAX_AMOUNT) {
          return ResponseHandler.error(res, `Total price must be between ₹${DC_PO_CONSTANTS.VALIDATION.MIN_AMOUNT} and ₹${DC_PO_CONSTANTS.VALIDATION.MAX_AMOUNT}`, 400);
        }

        // Validate SKU matrix if provided
        if (product.sku_matrix_on_catelogue_id && Array.isArray(product.sku_matrix_on_catelogue_id)) {
          // Validate total quantity matches sum of SKU matrix quantities
          const skuMatrixTotal = product.sku_matrix_on_catelogue_id.reduce((sum: number, sku: any) => sum + (sku.quantity || 0), 0);
          if (skuMatrixTotal !== product.totoal_quantity) {
            return ResponseHandler.error(res, `Total quantity (${product.totoal_quantity}) must equal sum of SKU matrix quantities (${skuMatrixTotal})`, 400);
          }

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
            if (sku.quantity < 1 || sku.quantity > DC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY) {
              return ResponseHandler.error(res, `SKU quantity must be between 1 and ${DC_PO_CONSTANTS.VALIDATION.MAX_QUANTITY}`, 400);
            }
          }
        }
      }

      // Validate description length
      if (description && description.length > DC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH) {
        return ResponseHandler.error(res, `Description must be less than ${DC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH} characters`, 400);
      }

      // Validate notes length
      if (notes && notes.length > DC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH) {
        return ResponseHandler.error(res, `Notes must be less than ${DC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH} characters`, 400);
      }

      // Validate priority
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (priority && !validPriorities.includes(priority)) {
        return ResponseHandler.error(res, 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT', 400);
      }

      // Validate gstType
      const validGstTypes = ['SGST+CGST', 'IGST', 'NONE'];
      if (gstType && !validGstTypes.includes(gstType)) {
        return ResponseHandler.error(res, 'GST Type must be one of: SGST+CGST, IGST, NONE', 400);
      }

      const po = await DCPOService.createDCPO({
        vendorId,
        dcId,
        gstType,
        products,
        description,
        notes,
        priority,
        createdBy: userId,
      });

      return ResponseHandler.success(res, {
        message: DC_PO_CONSTANTS.SUCCESS.CREATED,
        data: po,
      }, 201);

    } catch (error: any) {
      console.error('Create DC-PO error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to create DC Purchase Order', error.statusCode || 500);
    }
  }

  /**
   * Submit DC Purchase Order for approval
   */
  static async submitForApproval(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!id) {
        return ResponseHandler.error(res, 'Purchase Order ID is required', 400);
      }

      const po = await DCPOService.submitForApproval(parseInt(id), userId);

      return ResponseHandler.success(res, {
        message: 'Purchase Order submitted for approval successfully',
        data: po,
      });

    } catch (error: any) {
      console.error('Submit DC-PO for approval error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to submit Purchase Order for approval', error.statusCode || 500);
    }
  }

  /**
   * Process approval/rejection via token
   */
  static async processApproval(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      const { action, comments, password } = req.body;

      if (!token) {
        return ResponseHandler.error(res, 'Approval token is required', 400);
      }

      if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
        return ResponseHandler.error(res, 'Action must be either APPROVED or REJECTED', 400);
      }

      if (action === 'REJECTED' && !comments) {
        return ResponseHandler.error(res, 'Comments are required for rejection', 400);
      }

      const po = await DCPOService.processApproval(token, action, comments, password);

      return ResponseHandler.success(res, {
        message: action === 'APPROVED' 
          ? DC_PO_CONSTANTS.SUCCESS.APPROVED 
          : DC_PO_CONSTANTS.SUCCESS.REJECTED,
        data: po,
      });

    } catch (error: any) {
      console.error('Process approval error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to process approval', error.statusCode || 500);
    }
  }

  /**
   * Get DC Purchase Orders with filters and pagination
   */
  static async getDCPOs(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const {
        page = DC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit = DC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        search,
        status,
        dcId,
        vendorId,
        priority
      } = req.query;

      const filters = {
        search: search as string,
        status: status as string,
        dcId: dcId ? parseInt(dcId as string) : undefined,
        vendorId: vendorId ? parseInt(vendorId as string) : undefined,
        priority: priority as string,
      };

      const pageNum = parseInt(page as string) || DC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const limitNum = Math.min(
        parseInt(limit as string) || DC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        DC_PO_CONSTANTS.PAGINATION.MAX_LIMIT
      );

      const result = await DCPOService.getDCPOs(filters, pageNum, limitNum);

      return ResponseHandler.success(res, {
        message: DC_PO_CONSTANTS.SUCCESS.FETCHED,
        ...result,
      });

    } catch (error: any) {
      console.error('Get DC-POs error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch Purchase Orders', 500);
    }
  }

  /**
   * Get DC Purchase Order by ID
   */
  static async getDCPOById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseHandler.error(res, 'Purchase Order ID is required', 400);
      }

      const po = await DCPOService.getDCPOById(parseInt(id));

      if (!po) {
        return ResponseHandler.error(res, DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND, 404);
      }

      return ResponseHandler.success(res, {
        message: DC_PO_CONSTANTS.SUCCESS.FETCHED,
        data: po,
      });

    } catch (error: any) {
      console.error('Get DC-PO by ID error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch Purchase Order', 500);
    }
  }

  /**
   * Update DC Purchase Order
   */
  static async updateDCPO(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!id) {
        return ResponseHandler.error(res, 'Purchase Order ID is required', 400);
      }

      // Validate description length if provided
      if (updateData.description && updateData.description.length > DC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH) {
        return ResponseHandler.error(res, `Description must be less than ${DC_PO_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH} characters`, 400);
      }

      // Validate notes length if provided
      if (updateData.notes && updateData.notes.length > DC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH) {
        return ResponseHandler.error(res, `Notes must be less than ${DC_PO_CONSTANTS.VALIDATION.NOTES_MAX_LENGTH} characters`, 400);
      }

      // Validate priority if provided
      if (updateData.priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (!validPriorities.includes(updateData.priority)) {
          return ResponseHandler.error(res, 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT', 400);
        }
      }

      const po = await DCPOService.updateDCPO(parseInt(id), updateData, userId);

      return ResponseHandler.success(res, {
        message: DC_PO_CONSTANTS.SUCCESS.UPDATED,
        data: po,
      });

    } catch (error: any) {
      console.error('Update DC-PO error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to update Purchase Order', error.statusCode || 500);
    }
  }

  /**
   * Delete DC Purchase Order
   */
  static async deleteDCPO(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseHandler.error(res, 'Purchase Order ID is required', 400);
      }

      await DCPOService.deleteDCPO(parseInt(id));

      return ResponseHandler.success(res, {
        message: DC_PO_CONSTANTS.SUCCESS.DELETED,
      });

    } catch (error: any) {
      console.error('Delete DC-PO error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to delete Purchase Order', error.statusCode || 500);
    }
  }

  /**
   * Get approval details by token (for frontend approval page)
   */
  static async getApprovalDetails(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;

      if (!token) {
        return ResponseHandler.error(res, 'Approval token is required', 400);
      }

      // Decrypt token to get PO ID
      const tokenData = DCPOService.decryptApprovalToken(token);
      
      if (Date.now() > tokenData.exp) {
        return ResponseHandler.error(res, DC_PO_CONSTANTS.ERRORS.TOKEN_EXPIRED, 400);
      }

      const { po_id, role } = tokenData;

      // Get PO details
      const po = await DCPOService.getDCPOById(po_id);

      if (!po) {
        return ResponseHandler.error(res, DC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND, 404);
      }

      return ResponseHandler.success(res, {
        message: 'Approval details retrieved successfully',
        data: {
          po,
          approverRole: role,
          tokenExpiry: new Date(tokenData.exp),
        },
      });

    } catch (error: any) {
      console.error('Get approval details error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to get approval details', error.statusCode || 500);
    }
  }

  /**
   * Get complete product details for a DC Purchase Order
   */
  static async getDCPOProductDetails(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseHandler.error(res, 'Purchase Order ID is required', 400);
      }

      const productDetails = await DCPOService.getDCPOProductDetails(parseInt(id));

      return ResponseHandler.success(res, {
        message: 'Product details retrieved successfully',
        data: productDetails,
      });

    } catch (error: any) {
      console.error('Get DC-PO product details error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch product details', error.statusCode || 500);
    }
  }

  /**
   * Creator upload PI and set delivery date
   */
  static async uploadPIAndSetDeliveryDate(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { expectedDeliveryDate, piNotes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!id) {
        return ResponseHandler.error(res, 'Purchase Order ID is required', 400);
      }

      if (!expectedDeliveryDate) {
        return ResponseHandler.error(res, 'Expected delivery date is required', 400);
      }

      // Handle file upload if present
      let piFileUrl: string | undefined = undefined;
      if (req.file) {
        // Upload file to S3
        const { S3Service } = await import('../../services/s3Service.js');
        piFileUrl = await S3Service.uploadFile(
          req.file.buffer,
          `dc-po-pi/${id}/${Date.now()}-${req.file.originalname}`,
          'dc-po-documents'
        );
      }

      const po = await DCPOService.uploadPIAndSetDeliveryDate(parseInt(id), {
        expectedDeliveryDate: new Date(expectedDeliveryDate),
        piNotes,
        piFileUrl,
        updatedBy: userId,
      });

      return ResponseHandler.success(res, {
        message: 'PI uploaded and delivery date set successfully',
        data: po,
      });

    } catch (error: any) {
      console.error('Upload PI and set delivery date error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to upload PI and set delivery date', error.statusCode || 500);
    }
  }
}

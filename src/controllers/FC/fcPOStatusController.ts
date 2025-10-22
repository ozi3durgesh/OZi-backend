import { Request, Response } from 'express';
import { FCPOService } from '../../services/FC/fcPOService';
import { ResponseHandler } from '../../middleware/responseHandler';
import { FC_PO_CONSTANTS } from '../../constants/fcPOConstants';

interface AuthRequest extends Request {
  user?: any;
}

interface StatusHistoryItem {
  status: string;
  timestamp: Date;
  user: number;
  description: string;
  rejectionReason?: string;
}

export class FCPOStatusController {
  /**
   * Get FC-PO status summary with detailed FC-PO data (approved, rejected, pending)
   * GET /api/fc-po/status
   */
  static async getFCPOStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const {
        fcId,
        dcId,
        page = FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit = FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT
      } = req.query;

      // Validate DC ID if provided
      if (dcId && isNaN(parseInt(dcId as string))) {
        return ResponseHandler.error(res, 'Valid DC ID is required', 400);
      }

      // Validate FC ID if provided
      if (fcId && isNaN(parseInt(fcId as string))) {
        return ResponseHandler.error(res, 'Valid FC ID is required', 400);
      }

      const pageNum = parseInt(page as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const limitNum = Math.min(
        parseInt(limit as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        FC_PO_CONSTANTS.PAGINATION.MAX_LIMIT
      );

      // Get detailed FC-PO data for each status
      const [approved, rejected, pending, draft, total] = await Promise.all([
        FCPOService.getFCPOs({ 
          fcId: fcId ? parseInt(fcId as string) : undefined,
          dcId: dcId ? parseInt(dcId as string) : undefined,
          status: 'APPROVED' 
        }, pageNum, limitNum),
        FCPOService.getFCPOs({ 
          fcId: fcId ? parseInt(fcId as string) : undefined,
          dcId: dcId ? parseInt(dcId as string) : undefined,
          status: 'REJECTED' 
        }, pageNum, limitNum),
        FCPOService.getFCPOs({ 
          fcId: fcId ? parseInt(fcId as string) : undefined,
          dcId: dcId ? parseInt(dcId as string) : undefined,
          status: 'PENDING_APPROVAL' 
        }, pageNum, limitNum),
        FCPOService.getFCPOs({ 
          fcId: fcId ? parseInt(fcId as string) : undefined,
          dcId: dcId ? parseInt(dcId as string) : undefined,
          status: 'DRAFT' 
        }, pageNum, limitNum),
        FCPOService.getFCPOs({ 
          fcId: fcId ? parseInt(fcId as string) : undefined,
          dcId: dcId ? parseInt(dcId as string) : undefined
        }, pageNum, limitNum)
      ]);

      const statusSummary = {
        summary: {
          total: total.total,
          approved: approved.total,
          rejected: rejected.total,
          pending: pending.total,
          draft: draft.total,
          percentages: {
            approved: total.total > 0 ? Math.round((approved.total / total.total) * 100) : 0,
            rejected: total.total > 0 ? Math.round((rejected.total / total.total) * 100) : 0,
            pending: total.total > 0 ? Math.round((pending.total / total.total) * 100) : 0,
            draft: total.total > 0 ? Math.round((draft.total / total.total) * 100) : 0,
          }
        },
        categorizedData: {
          approved: {
            count: approved.total,
            data: approved.data.map(fcpo => ({
              id: fcpo.id,
              poId: fcpo.poId,
              fcId: fcpo.fcId,
              dcId: fcpo.dcId,
              status: fcpo.status,
              priority: fcpo.priority,
              totalAmount: fcpo.totalAmount,
              description: fcpo.description,
              notes: fcpo.notes,
              createdAt: fcpo.createdAt,
              updatedAt: fcpo.updatedAt,
              approvedAt: fcpo.approvedAt,
              createdBy: fcpo.createdBy,
              approvedBy: fcpo.approvedBy,
              fulfillmentCenter: fcpo.FulfillmentCenter,
              distributionCenter: fcpo.DistributionCenter,
              products: fcpo.Products?.map(product => ({
                id: product.id,
                productId: product.productId,
                catalogueId: product.catalogueId,
                productName: product.productName,
                description: product.description,
                quantity: product.quantity,
                unitPrice: product.unitPrice,
                totalAmount: product.totalAmount,
                mrp: product.mrp,
                notes: product.notes,
                skuMatrixOnCatalogueId: product.skuMatrixOnCatalogueId,
                product: product.Product ? {
                  id: product.Product.id,
                  catalogueId: product.Product.catalogue_id,
                  name: product.Product.name,
                  description: product.Product.description,
                  mrp: product.Product.mrp
                } : null
              })) || []
            }))
          },
          rejected: {
            count: rejected.total,
            data: rejected.data.map(fcpo => ({
              id: fcpo.id,
              poId: fcpo.poId,
              fcId: fcpo.fcId,
              dcId: fcpo.dcId,
              status: fcpo.status,
              priority: fcpo.priority,
              totalAmount: fcpo.totalAmount,
              description: fcpo.description,
              notes: fcpo.notes,
              createdAt: fcpo.createdAt,
              updatedAt: fcpo.updatedAt,
              rejectedAt: fcpo.rejectedAt,
              rejectionReason: fcpo.rejectionReason,
              createdBy: fcpo.createdBy,
              rejectedBy: fcpo.rejectedBy,
              fulfillmentCenter: fcpo.FulfillmentCenter,
              distributionCenter: fcpo.DistributionCenter,
              products: fcpo.Products?.map(product => ({
                id: product.id,
                productId: product.productId,
                catalogueId: product.catalogueId,
                productName: product.productName,
                description: product.description,
                quantity: product.quantity,
                unitPrice: product.unitPrice,
                totalAmount: product.totalAmount,
                mrp: product.mrp,
                notes: product.notes,
                skuMatrixOnCatalogueId: product.skuMatrixOnCatalogueId,
                product: product.Product ? {
                  id: product.Product.id,
                  catalogueId: product.Product.catalogue_id,
                  name: product.Product.name,
                  description: product.Product.description,
                  mrp: product.Product.mrp
                } : null
              })) || []
            }))
          },
          pending: {
            count: pending.total,
            data: pending.data.map(fcpo => ({
              id: fcpo.id,
              poId: fcpo.poId,
              fcId: fcpo.fcId,
              dcId: fcpo.dcId,
              status: fcpo.status,
              priority: fcpo.priority,
              totalAmount: fcpo.totalAmount,
              description: fcpo.description,
              notes: fcpo.notes,
              createdAt: fcpo.createdAt,
              updatedAt: fcpo.updatedAt,
              createdBy: fcpo.createdBy,
              fulfillmentCenter: fcpo.FulfillmentCenter,
              distributionCenter: fcpo.DistributionCenter,
              products: fcpo.Products?.map(product => ({
                id: product.id,
                productId: product.productId,
                catalogueId: product.catalogueId,
                productName: product.productName,
                description: product.description,
                quantity: product.quantity,
                unitPrice: product.unitPrice,
                totalAmount: product.totalAmount,
                mrp: product.mrp,
                notes: product.notes,
                skuMatrixOnCatalogueId: product.skuMatrixOnCatalogueId,
                product: product.Product ? {
                  id: product.Product.id,
                  catalogueId: product.Product.catalogue_id,
                  name: product.Product.name,
                  description: product.Product.description,
                  mrp: product.Product.mrp
                } : null
              })) || []
            }))
          },
          draft: {
            count: draft.total,
            data: draft.data.map(fcpo => ({
              id: fcpo.id,
              poId: fcpo.poId,
              fcId: fcpo.fcId,
              dcId: fcpo.dcId,
              status: fcpo.status,
              priority: fcpo.priority,
              totalAmount: fcpo.totalAmount,
              description: fcpo.description,
              notes: fcpo.notes,
              createdAt: fcpo.createdAt,
              updatedAt: fcpo.updatedAt,
              createdBy: fcpo.createdBy,
              fulfillmentCenter: fcpo.FulfillmentCenter,
              distributionCenter: fcpo.DistributionCenter,
              products: fcpo.Products?.map(product => ({
                id: product.id,
                productId: product.productId,
                catalogueId: product.catalogueId,
                productName: product.productName,
                description: product.description,
                quantity: product.quantity,
                unitPrice: product.unitPrice,
                totalAmount: product.totalAmount,
                mrp: product.mrp,
                notes: product.notes,
                skuMatrixOnCatalogueId: product.skuMatrixOnCatalogueId,
                product: product.Product ? {
                  id: product.Product.id,
                  catalogueId: product.Product.catalogue_id,
                  name: product.Product.name,
                  description: product.Product.description,
                  mrp: product.Product.mrp
                } : null
              })) || []
            }))
          }
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total.total,
          pages: Math.ceil(total.total / limitNum)
        }
      };

      return ResponseHandler.success(res, {
        message: 'FC Purchase Order status summary with detailed data retrieved successfully',
        data: statusSummary,
      });

    } catch (error: any) {
      console.error('Get FC-PO status error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Order status', 500);
    }
  }

  /**
   * Get FC-POs by specific status
   * GET /api/fc-po/status/:status
   */
  static async getFCPOsByStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { status } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return ResponseHandler.error(res, 'Invalid status. Valid statuses: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED', 400);
      }

      const {
        fcId,
        dcId,
        page = FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit = FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        search,
        priority
      } = req.query;

      // Validate DC ID if provided
      if (dcId && isNaN(parseInt(dcId as string))) {
        return ResponseHandler.error(res, 'Valid DC ID is required', 400);
      }

      // Validate FC ID if provided
      if (fcId && isNaN(parseInt(fcId as string))) {
        return ResponseHandler.error(res, 'Valid FC ID is required', 400);
      }

      const filters = {
        search: search as string,
        status: status.toUpperCase(),
        fcId: fcId ? parseInt(fcId as string) : undefined,
        dcId: dcId ? parseInt(dcId as string) : undefined,
        priority: priority as string,
      };

      const pageNum = parseInt(page as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const limitNum = Math.min(
        parseInt(limit as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        FC_PO_CONSTANTS.PAGINATION.MAX_LIMIT
      );

      const result = await FCPOService.getFCPOs(filters, pageNum, limitNum);

      return ResponseHandler.success(res, {
        message: `FC Purchase Orders with status ${status.toUpperCase()} retrieved successfully`,
        ...result,
      });

    } catch (error: any) {
      console.error('Get FC-POs by status error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Orders by status', 500);
    }
  }

  /**
   * Get FC-PO status history/timeline
   * GET /api/fc-po/:id/status-history
   */
  static async getFCPOStatusHistory(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      if (!id) {
        return ResponseHandler.error(res, 'FC Purchase Order ID is required', 400);
      }

      const fcPO = await FCPOService.getFCPOById(parseInt(id));

      if (!fcPO) {
        return ResponseHandler.error(res, FC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND, 404);
      }

      // Build status history timeline
      const statusHistory: StatusHistoryItem[] = [
        {
          status: 'DRAFT',
          timestamp: fcPO.createdAt,
          user: fcPO.createdBy,
          description: 'FC Purchase Order created'
        }
      ];

      if (fcPO.status === 'PENDING_APPROVAL' || fcPO.status === 'APPROVED' || fcPO.status === 'REJECTED') {
        statusHistory.push({
          status: 'PENDING_APPROVAL',
          timestamp: fcPO.updatedAt,
          user: fcPO.createdBy,
          description: 'Submitted for DC approval'
        });
      }

      if (fcPO.status === 'APPROVED' && fcPO.approvedAt) {
        statusHistory.push({
          status: 'APPROVED',
          timestamp: fcPO.approvedAt,
          user: fcPO.approvedBy || 0,
          description: 'Approved by DC'
        });
      }

      if (fcPO.status === 'REJECTED' && fcPO.rejectedAt) {
        statusHistory.push(        {
          status: 'REJECTED',
          timestamp: fcPO.rejectedAt,
          user: fcPO.rejectedBy || 0,
          description: 'Rejected by DC',
          rejectionReason: fcPO.rejectionReason
        });
      }

      return ResponseHandler.success(res, {
        message: 'FC Purchase Order status history retrieved successfully',
        data: {
          fcPO: {
            id: fcPO.id,
            poId: fcPO.poId,
            currentStatus: fcPO.status,
            totalAmount: fcPO.totalAmount,
            priority: fcPO.priority
          },
          statusHistory: statusHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        },
      });

    } catch (error: any) {
      console.error('Get FC-PO status history error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Order status history', 500);
    }
  }
}

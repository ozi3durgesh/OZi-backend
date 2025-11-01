import { Request, Response } from 'express';
import { FCPOService } from '../../services/FC/fcPOService';
import { ResponseHandler } from '../../middleware/responseHandler';
import { FC_PO_CONSTANTS } from '../../constants/fcPOConstants';

interface AuthRequest extends Request {
  user?: any;
}

export class DCFCPOController {
  /**
   * Get all FC-POs assigned to DC for approval
   * GET /api/dc/fc-pos
   */
  static async getFCPOsForApproval(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const {
        page = FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit = FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        search,
        status,
        priority,
        fcId
      } = req.query;

      // Get DC ID from user context or query
      const dcId = req.user?.currentDcId || req.query.dcId;

      if (!dcId || isNaN(parseInt(dcId as string))) {
        return ResponseHandler.error(res, 'Valid DC ID is required', 400);
      }

      const filters = {
        search: search as string,
        status: status as string,
        dcId: parseInt(dcId as string),
        fcId: fcId ? parseInt(fcId as string) : undefined,
        priority: priority as string,
      };

      const pageNum = parseInt(page as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const limitNum = Math.min(
        parseInt(limit as string) || FC_PO_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        FC_PO_CONSTANTS.PAGINATION.MAX_LIMIT
      );

      const result = await FCPOService.getFCPOs(filters, pageNum, limitNum);

      return ResponseHandler.success(res, {
        message: 'FC Purchase Orders for DC approval retrieved successfully',
        ...result,
      });

    } catch (error: any) {
      console.error('Get FC-POs for DC approval error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Orders for approval', 500);
    }
  }

  /**
   * Get FC-PO details for approval
   * GET /api/dc/fc-pos/:id
   */
  static async getFCPOForApproval(req: AuthRequest, res: Response): Promise<Response> {
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

      // Check if this FC-PO is assigned to the current DC
      const dcId = req.user?.currentDcId || req.query.dcId;
      if (fcPO.dcId !== parseInt(dcId as string)) {
        return ResponseHandler.error(res, 'This FC Purchase Order is not assigned to your DC', 403);
      }

      return ResponseHandler.success(res, {
        message: 'FC Purchase Order details retrieved successfully',
        data: fcPO,
      });

    } catch (error: any) {
      console.error('Get FC-PO for approval error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Order details', 500);
    }
  }

  /**
   * Get FC-PO statistics for DC dashboard
   * GET /api/dc/fc-pos/statistics
   */
  static async getFCPOStatistics(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const dcId = req.user?.currentDcId || req.query.dcId;

      if (!dcId || isNaN(parseInt(dcId as string))) {
        return ResponseHandler.error(res, 'Valid DC ID is required', 400);
      }

      // Get statistics for different statuses
      const [pending, approved, rejected, total] = await Promise.all([
        FCPOService.getFCPOs({ dcId: parseInt(dcId as string), status: 'PENDING_APPROVAL' }, 1, 1),
        FCPOService.getFCPOs({ dcId: parseInt(dcId as string), status: 'APPROVED' }, 1, 1),
        FCPOService.getFCPOs({ dcId: parseInt(dcId as string), status: 'REJECTED' }, 1, 1),
        FCPOService.getFCPOs({ dcId: parseInt(dcId as string) }, 1, 1),
      ]);

      const statistics = {
        total: total.total,
        pending: pending.total,
        approved: approved.total,
        rejected: rejected.total,
        pendingPercentage: total.total > 0 ? Math.round((pending.total / total.total) * 100) : 0,
        approvedPercentage: total.total > 0 ? Math.round((approved.total / total.total) * 100) : 0,
        rejectedPercentage: total.total > 0 ? Math.round((rejected.total / total.total) * 100) : 0,
      };

      return ResponseHandler.success(res, {
        message: 'FC Purchase Order statistics retrieved successfully',
        data: statistics,
      });

    } catch (error: any) {
      console.error('Get FC-PO statistics error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch FC Purchase Order statistics', 500);
    }
  }

  /**
   * Approve/Reject FC Purchase Order (DC Dashboard)
   * POST /api/dc/fc-pos/:id/approve
   */
  static async approveRejectFCPO(req: AuthRequest, res: Response): Promise<Response> {
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

      // Get FC-PO to verify it belongs to current DC
      const fcPO = await FCPOService.getFCPOById(parseInt(id));
      if (!fcPO) {
        return ResponseHandler.error(res, FC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND, 404);
      }

      const dcId = req.user?.currentDcId || req.query.dcId;
      if (!dcId || isNaN(parseInt(dcId as string))) {
        return ResponseHandler.error(res, 'Valid DC ID is required', 400);
      }
      
      if (fcPO.dcId !== parseInt(dcId as string)) {
        return ResponseHandler.error(res, 'This FC Purchase Order is not assigned to your DC', 403);
      }

      const approverRole = 'dc_manager'; // Default approver role

      const result = await FCPOService.processApproval(
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
        data: result,
      });

    } catch (error: any) {
      console.error('Approve/Reject FC-PO error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to process FC Purchase Order approval', error.statusCode || 500);
    }
  }
}

import { Response } from 'express';
import { Op } from 'sequelize';
import { ResponseHandler } from '../../middleware/responseHandler';
import { VendorDCService } from '../../services/DC/vendorService';
import { AuthRequest } from '../../types';
import { VENDOR_CONSTANTS } from '../../constants/vendorConstants';

export class DCVendorController {
  /**
   * Create a new vendor under a Distribution Center
   * Only admin users can create vendors
   */
  static async createVendor(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return ResponseHandler.error(res, 'User not authenticated', 401);
      }

      // Ensure only admin can create vendors
      if (userRole !== 'admin') {
        return ResponseHandler.error(res, VENDOR_CONSTANTS.ERRORS.UNAUTHORIZED, 403);
      }

      const vendorData = {
        ...req.body,
        createdBy: userId,
      };

      const newVendor = await VendorDCService.createVendor(vendorData);

      return ResponseHandler.success(
        res,
        {
          message: VENDOR_CONSTANTS.SUCCESS.CREATED,
          data: newVendor,
        },
        201
      );
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      return ResponseHandler.error(
        res,
        error.message || VENDOR_CONSTANTS.ERRORS.CREATION_FAILED,
        error.statusCode || 500
      );
    }
  }

  /**
   * Get all vendors with optional filtering
   */
  static async getVendors(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, search, dcId, vendorType } = req.query;

      const filters: any = {};

      if (search) {
        filters.search = search as string;
      }
      if (dcId) {
        filters.dcId = parseInt(dcId as string, 10);
      }
      if (vendorType) {
        filters.vendorType = vendorType as string;
      }

      const result = await VendorDCService.getVendors(
        filters,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      return ResponseHandler.success(res, {
        message: VENDOR_CONSTANTS.SUCCESS.FETCHED,
        data: result,
      });
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      return ResponseHandler.error(
        res,
        error.message || 'Failed to fetch vendors',
        500
      );
    }
  }

  /**
   * Get a single vendor by ID
   */
  static async getVendorById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const vendor = await VendorDCService.getVendorById(parseInt(id, 10));

      if (!vendor) {
        return ResponseHandler.error(res, VENDOR_CONSTANTS.ERRORS.VENDOR_NOT_FOUND, 404);
      }

      return ResponseHandler.success(res, {
        message: VENDOR_CONSTANTS.SUCCESS.FETCHED,
        data: vendor,
      });
    } catch (error: any) {
      console.error('Error fetching vendor:', error);
      return ResponseHandler.error(
        res,
        error.message || 'Failed to fetch vendor',
        500
      );
    }
  }

  /**
   * Get vendor by vendor ID (OZIVID format)
   */
  static async getVendorByVendorId(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.params;

      const vendor = await VendorDCService.getVendorByVendorId(vendorId);

      if (!vendor) {
        return ResponseHandler.error(res, VENDOR_CONSTANTS.ERRORS.VENDOR_NOT_FOUND, 404);
      }

      return ResponseHandler.success(res, {
        message: VENDOR_CONSTANTS.SUCCESS.FETCHED,
        data: vendor,
      });
    } catch (error: any) {
      console.error('Error fetching vendor:', error);
      return ResponseHandler.error(
        res,
        error.message || 'Failed to fetch vendor',
        500
      );
    }
  }

  /**
   * Update a vendor
   * Only admin users can update vendors
   */
  static async updateVendor(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return ResponseHandler.error(res, 'User not authenticated', 401);
      }

      // Ensure only admin can update vendors
      if (userRole !== 'admin') {
        return ResponseHandler.error(res, VENDOR_CONSTANTS.ERRORS.UNAUTHORIZED, 403);
      }

      const updateData = {
        ...req.body,
        updatedBy: userId,
      };

      const updatedVendor = await VendorDCService.updateVendor(
        parseInt(id, 10),
        updateData
      );

      return ResponseHandler.success(res, {
        message: VENDOR_CONSTANTS.SUCCESS.UPDATED,
        data: updatedVendor,
      });
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      return ResponseHandler.error(
        res,
        error.message || 'Failed to update vendor',
        error.statusCode || 500
      );
    }
  }

  /**
   * Delete a vendor
   * Only admin users can delete vendors
   */
  static async deleteVendor(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;

      // Ensure only admin can delete vendors
      if (userRole !== 'admin') {
        return ResponseHandler.error(res, VENDOR_CONSTANTS.ERRORS.UNAUTHORIZED, 403);
      }

      await VendorDCService.deleteVendor(parseInt(id, 10));

      return ResponseHandler.success(res, {
        message: VENDOR_CONSTANTS.SUCCESS.DELETED,
      });
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      return ResponseHandler.error(
        res,
        error.message || 'Failed to delete vendor',
        error.statusCode || 500
      );
    }
  }

}


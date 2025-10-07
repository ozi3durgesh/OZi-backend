import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseHandler } from '../middleware/responseHandler';
import { User } from '../models';
// ⚠️ WARNING: DistributionCenter table has been dropped - this controller is non-functional
import DistributionCenter from '../models/DistributionCenter'; // Direct import (table dropped)
import { 
  CreateDistributionCenterRequest, 
  DistributionCenterAttributes,
  AuthRequest 
} from '../types';

export const createDistributionCenter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const dcData: CreateDistributionCenterRequest = req.body;

    // Check if DC code already exists
    const existingDC = await DistributionCenter.findOne({
      where: { dc_code: dcData.dc_code }
    });

    if (existingDC) {
      return ResponseHandler.error(res, 'Distribution Center code already exists', 400);
    }

    const newDC = await DistributionCenter.create({
      ...dcData,
      created_by: userId,
      status: 'ACTIVE',
      current_utilization_percentage: 0,
      integration_status: 'PENDING',
      country: dcData.country || 'India',
      is_auto_assignment_enabled: dcData.is_auto_assignment_enabled !== undefined ? dcData.is_auto_assignment_enabled : true,
      max_orders_per_day: dcData.max_orders_per_day || 1000,
      sla_hours: dcData.sla_hours || 24,
    });

    const createdDC = await DistributionCenter.findByPk(newDC.id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] }
      ]
    });

    return ResponseHandler.success(res, {
      message: 'Distribution Center created successfully',
      data: createdDC
    }, 201);

  } catch (error) {
    console.error('Error creating Distribution Center:', error);
    return ResponseHandler.error(res, 'Failed to create Distribution Center', 500);
  }
};

export const getDistributionCenters = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status, type, city, state } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { dc_code: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (city) whereClause.city = city;
    if (state) whereClause.state = state;

    const { count, rows } = await DistributionCenter.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'UpdatedBy', attributes: ['id', 'email', 'name'] }
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    return ResponseHandler.success(res, {
      message: 'Distribution Centers retrieved successfully',
      data: {
        distribution_centers: rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching Distribution Centers:', error);
    return ResponseHandler.error(res, 'Failed to fetch Distribution Centers', 500);
  }
};

export const getDistributionCenterById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dc = await DistributionCenter.findByPk(id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'UpdatedBy', attributes: ['id', 'email', 'name'] },
        { 
          model: DistributionCenter.associations.FulfillmentCenters.target,
          as: 'FulfillmentCenters',
          attributes: ['id', 'fc_code', 'name', 'type', 'status', 'city', 'state']
        }
      ]
    });

    if (!dc) {
      return ResponseHandler.error(res, 'Distribution Center not found', 404);
    }

    return ResponseHandler.success(res, {
      message: 'Distribution Center retrieved successfully',
      data: dc
    });

  } catch (error) {
    console.error('Error fetching Distribution Center:', error);
    return ResponseHandler.error(res, 'Failed to fetch Distribution Center', 500);
  }
};

export const updateDistributionCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const dc = await DistributionCenter.findByPk(id);
    if (!dc) {
      return ResponseHandler.error(res, 'Distribution Center not found', 404);
    }

    // Check if DC code is being updated and if it already exists
    if (updateData.dc_code && updateData.dc_code !== dc.dc_code) {
      const existingDC = await DistributionCenter.findOne({
        where: { 
          dc_code: updateData.dc_code,
          id: { [Op.ne]: id }
        }
      });

      if (existingDC) {
        return ResponseHandler.error(res, 'Distribution Center code already exists', 400);
      }
    }

    await dc.update({
      ...updateData,
      updated_by: userId,
    });

    const updatedDC = await DistributionCenter.findByPk(id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'UpdatedBy', attributes: ['id', 'email', 'name'] }
      ]
    });

    return ResponseHandler.success(res, {
      message: 'Distribution Center updated successfully',
      data: updatedDC
    });

  } catch (error) {
    console.error('Error updating Distribution Center:', error);
    return ResponseHandler.error(res, 'Failed to update Distribution Center', 500);
  }
};

export const deleteDistributionCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dc = await DistributionCenter.findByPk(id);
    if (!dc) {
      return ResponseHandler.error(res, 'Distribution Center not found', 404);
    }

    // Check if DC has any fulfillment centers
    const fulfillmentCentersCount = await DistributionCenter.associations.FulfillmentCenters.target.count({
      where: { dc_id: id }
    });

    if (fulfillmentCentersCount > 0) {
      return ResponseHandler.error(res, 'Cannot delete Distribution Center with existing Fulfillment Centers', 400);
    }

    await dc.destroy();

    return ResponseHandler.success(res, {
      message: 'Distribution Center deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Distribution Center:', error);
    return ResponseHandler.error(res, 'Failed to delete Distribution Center', 500);
  }
};

export const updateDistributionCenterStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'];
    if (!validStatuses.includes(status)) {
      return ResponseHandler.error(res, 'Invalid status', 400);
    }

    const dc = await DistributionCenter.findByPk(id);
    if (!dc) {
      return ResponseHandler.error(res, 'Distribution Center not found', 404);
    }

    await dc.update({
      status,
      updated_by: userId,
    });

    return ResponseHandler.success(res, {
      message: 'Distribution Center status updated successfully',
      data: { id: dc.id, status: dc.status }
    });

  } catch (error) {
    console.error('Error updating Distribution Center status:', error);
    return ResponseHandler.error(res, 'Failed to update Distribution Center status', 500);
  }
};

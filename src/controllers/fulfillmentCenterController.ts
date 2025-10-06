import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseHandler } from '../middleware/responseHandler';
import { FulfillmentCenter, DistributionCenter, User } from '../models';
import { 
  CreateFulfillmentCenterRequest, 
  FulfillmentCenterAttributes,
  AuthRequest 
} from '../types';

export const createFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const fcData: CreateFulfillmentCenterRequest = req.body;

    // Check if FC code already exists
    const existingFC = await FulfillmentCenter.findOne({
      where: { fc_code: fcData.fc_code }
    });

    if (existingFC) {
      return ResponseHandler.error(res, 'Fulfillment Center code already exists', 400);
    }

    // Verify DC exists
    const dc = await DistributionCenter.findByPk(fcData.dc_id);
    if (!dc) {
      return ResponseHandler.error(res, 'Distribution Center not found', 404);
    }

    const newFC = await FulfillmentCenter.create({
      ...fcData,
      created_by: userId,
      status: 'ACTIVE',
      current_utilization_percentage: 0,
      integration_status: 'PENDING',
      country: fcData.country || 'India',
      is_auto_assignment_enabled: fcData.is_auto_assignment_enabled !== undefined ? fcData.is_auto_assignment_enabled : true,
      max_orders_per_day: fcData.max_orders_per_day || 1000,
      sla_hours: fcData.sla_hours || 24,
    });

    const createdFC = await FulfillmentCenter.findByPk(newFC.id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] },
        { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
      ]
    });

    return ResponseHandler.success(res, {
      message: 'Fulfillment Center created successfully',
      data: createdFC
    }, 201);

  } catch (error) {
    console.error('Error creating Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to create Fulfillment Center', 500);
  }
};

export const getFulfillmentCenters = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status, type, dc_id, city, state } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { fc_code: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (dc_id) whereClause.dc_id = dc_id;
    if (city) whereClause.city = city;
    if (state) whereClause.state = state;

    const { count, rows } = await FulfillmentCenter.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'UpdatedBy', attributes: ['id', 'email', 'name'] },
        { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    return ResponseHandler.success(res, {
      message: 'Fulfillment Centers retrieved successfully',
      data: {
        fulfillment_centers: rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching Fulfillment Centers:', error);
    return ResponseHandler.error(res, 'Failed to fetch Fulfillment Centers', 500);
  }
};

export const getFulfillmentCenterById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const fc = await FulfillmentCenter.findByPk(id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'UpdatedBy', attributes: ['id', 'email', 'name'] },
        { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name', 'type'] }
      ]
    });

    if (!fc) {
      return ResponseHandler.error(res, 'Fulfillment Center not found', 404);
    }

    return ResponseHandler.success(res, {
      message: 'Fulfillment Center retrieved successfully',
      data: fc
    });

  } catch (error) {
    console.error('Error fetching Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to fetch Fulfillment Center', 500);
  }
};

export const updateFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const fc = await FulfillmentCenter.findByPk(id);
    if (!fc) {
      return ResponseHandler.error(res, 'Fulfillment Center not found', 404);
    }

    // Check if FC code is being updated and if it already exists
    if (updateData.fc_code && updateData.fc_code !== fc.fc_code) {
      const existingFC = await FulfillmentCenter.findOne({
        where: { 
          fc_code: updateData.fc_code,
          id: { [Op.ne]: id }
        }
      });

      if (existingFC) {
        return ResponseHandler.error(res, 'Fulfillment Center code already exists', 400);
      }
    }

    // Verify DC exists if dc_id is being updated
    if (updateData.dc_id && updateData.dc_id !== fc.dc_id) {
      const dc = await DistributionCenter.findByPk(updateData.dc_id);
      if (!dc) {
        return ResponseHandler.error(res, 'Distribution Center not found', 404);
      }
    }

    await fc.update({
      ...updateData,
      updated_by: userId,
    });

    const updatedFC = await FulfillmentCenter.findByPk(id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'UpdatedBy', attributes: ['id', 'email', 'name'] },
        { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
      ]
    });

    return ResponseHandler.success(res, {
      message: 'Fulfillment Center updated successfully',
      data: updatedFC
    });

  } catch (error) {
    console.error('Error updating Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to update Fulfillment Center', 500);
  }
};

export const deleteFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const fc = await FulfillmentCenter.findByPk(id);
    if (!fc) {
      return ResponseHandler.error(res, 'Fulfillment Center not found', 404);
    }

    // Check if FC has any user assignments
    const userAssignmentsCount = await FulfillmentCenter.associations.UserFulfillmentCenters.target.count({
      where: { fc_id: id }
    });

    if (userAssignmentsCount > 0) {
      return ResponseHandler.error(res, 'Cannot delete Fulfillment Center with existing user assignments', 400);
    }

    await fc.destroy();

    return ResponseHandler.success(res, {
      message: 'Fulfillment Center deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to delete Fulfillment Center', 500);
  }
};

export const updateFulfillmentCenterStatus = async (req: AuthRequest, res: Response) => {
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

    const fc = await FulfillmentCenter.findByPk(id);
    if (!fc) {
      return ResponseHandler.error(res, 'Fulfillment Center not found', 404);
    }

    await fc.update({
      status,
      updated_by: userId,
    });

    return ResponseHandler.success(res, {
      message: 'Fulfillment Center status updated successfully',
      data: { id: fc.id, status: fc.status }
    });

  } catch (error) {
    console.error('Error updating Fulfillment Center status:', error);
    return ResponseHandler.error(res, 'Failed to update Fulfillment Center status', 500);
  }
};

export const getFulfillmentCentersByDC = async (req: AuthRequest, res: Response) => {
  try {
    const { dc_id } = req.params;
    const { status = 'ACTIVE' } = req.query;

    const fcs = await FulfillmentCenter.findAll({
      where: { 
        dc_id,
        status: status as string
      },
      include: [
        { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
      ],
      order: [['name', 'ASC']]
    });

    return ResponseHandler.success(res, {
      message: 'Fulfillment Centers retrieved successfully',
      data: fcs
    });

  } catch (error) {
    console.error('Error fetching Fulfillment Centers by DC:', error);
    return ResponseHandler.error(res, 'Failed to fetch Fulfillment Centers', 500);
  }
};

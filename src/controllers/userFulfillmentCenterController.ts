import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseHandler } from '../middleware/responseHandler';
import { UserFulfillmentCenter, User, FulfillmentCenter, DistributionCenter } from '../models';
import { 
  AssignUserToFulfillmentCenterRequest, 
  UserFulfillmentCenterAttributes,
  AuthRequest,
  FulfillmentCenterSelectionResponse 
} from '../types';

export const assignUserToFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const assignmentData: AssignUserToFulfillmentCenterRequest = req.body;

    // Verify user exists
    const user = await User.findByPk(assignmentData.user_id);
    if (!user) {
      return ResponseHandler.error(res, 'User not found', 404);
    }

    // Verify FC exists
    const fc = await FulfillmentCenter.findByPk(assignmentData.fc_id);
    if (!fc) {
      return ResponseHandler.error(res, 'Fulfillment Center not found', 404);
    }

    // Check if assignment already exists
    const existingAssignment = await UserFulfillmentCenter.findOne({
      where: { 
        user_id: assignmentData.user_id,
        fc_id: assignmentData.fc_id
      }
    });

    if (existingAssignment) {
      return ResponseHandler.error(res, 'User is already assigned to this Fulfillment Center', 400);
    }

    // If this is set as default, unset other defaults for this user
    if (assignmentData.is_default) {
      await UserFulfillmentCenter.update(
        { is_default: false },
        { where: { user_id: assignmentData.user_id } }
      );
    }

    const newAssignment = await UserFulfillmentCenter.create({
      ...assignmentData,
      created_by: userId,
    });

    const createdAssignment = await UserFulfillmentCenter.findByPk(newAssignment.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'name', 'phone'] },
        { 
          model: FulfillmentCenter, 
          as: 'FulfillmentCenter',
          include: [
            { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
          ]
        }
      ]
    });

    return ResponseHandler.success(res, {
      message: 'User assigned to Fulfillment Center successfully',
      data: createdAssignment
    }, 201);

  } catch (error) {
    console.error('Error assigning user to Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to assign user to Fulfillment Center', 500);
  }
};

export const getUserFulfillmentCenters = async (req: AuthRequest, res: Response) => {
  try {
    const { user_id } = req.params;
    const { is_active = true } = req.query;

    const assignments = await UserFulfillmentCenter.findAll({
      where: { 
        user_id,
        is_active: is_active === 'true'
      },
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'name', 'phone'] },
        { 
          model: FulfillmentCenter, 
          as: 'FulfillmentCenter',
          include: [
            { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
          ]
        }
      ],
      order: [['is_default', 'DESC'], ['assigned_date', 'DESC']]
    });

    return ResponseHandler.success(res, {
      message: 'User Fulfillment Center assignments retrieved successfully',
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching user Fulfillment Center assignments:', error);
    return ResponseHandler.error(res, 'Failed to fetch user assignments', 500);
  }
};

export const getFulfillmentCenterUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { fc_id } = req.params;
    const { is_active = true } = req.query;

    const assignments = await UserFulfillmentCenter.findAll({
      where: { 
        fc_id,
        is_active: is_active === 'true'
      },
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'name', 'phone'] },
        { 
          model: FulfillmentCenter, 
          as: 'FulfillmentCenter',
          include: [
            { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
          ]
        }
      ],
      order: [['role', 'ASC'], ['assigned_date', 'DESC']]
    });

    return ResponseHandler.success(res, {
      message: 'Fulfillment Center user assignments retrieved successfully',
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching Fulfillment Center user assignments:', error);
    return ResponseHandler.error(res, 'Failed to fetch FC assignments', 500);
  }
};

export const updateUserFulfillmentCenterAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const assignment = await UserFulfillmentCenter.findByPk(id);
    if (!assignment) {
      return ResponseHandler.error(res, 'Assignment not found', 404);
    }

    // If setting as default, unset other defaults for this user
    if (updateData.is_default) {
      await UserFulfillmentCenter.update(
        { is_default: false },
        { where: { 
          user_id: assignment.user_id,
          id: { [Op.ne]: id }
        }}
      );
    }

    await assignment.update({
      ...updateData,
      updated_by: userId,
    });

    const updatedAssignment = await UserFulfillmentCenter.findByPk(id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'name', 'phone'] },
        { 
          model: FulfillmentCenter, 
          as: 'FulfillmentCenter',
          include: [
            { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
          ]
        }
      ]
    });

    return ResponseHandler.success(res, {
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    return ResponseHandler.error(res, 'Failed to update assignment', 500);
  }
};

export const removeUserFromFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await UserFulfillmentCenter.findByPk(id);
    if (!assignment) {
      return ResponseHandler.error(res, 'Assignment not found', 404);
    }

    await assignment.destroy();

    return ResponseHandler.success(res, {
      message: 'User removed from Fulfillment Center successfully'
    });

  } catch (error) {
    console.error('Error removing user from Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to remove user from Fulfillment Center', 500);
  }
};

export const getUserAvailableFulfillmentCenters = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    const assignments = await UserFulfillmentCenter.findAll({
      where: { 
        user_id: userId,
        is_active: true
      },
      include: [
        { 
          model: FulfillmentCenter, 
          as: 'FulfillmentCenter',
          where: { status: 'ACTIVE' },
          include: [
            { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
          ]
        }
      ],
      order: [['is_default', 'DESC'], ['assigned_date', 'DESC']]
    });

    const fcSelections: FulfillmentCenterSelectionResponse[] = assignments.map(assignment => ({
      id: assignment.FulfillmentCenter!.id,
      fc_code: assignment.FulfillmentCenter!.fc_code,
      name: assignment.FulfillmentCenter!.name,
      dc_id: assignment.FulfillmentCenter!.dc_id,
      distribution_center: {
        id: assignment.FulfillmentCenter!.DistributionCenter!.id,
        dc_code: assignment.FulfillmentCenter!.DistributionCenter!.dc_code,
        name: assignment.FulfillmentCenter!.DistributionCenter!.name
      },
      role: assignment.role,
      is_default: assignment.is_default
    }));

    return ResponseHandler.success(res, {
      message: 'Available Fulfillment Centers retrieved successfully',
      data: fcSelections
    });

  } catch (error) {
    console.error('Error fetching user available Fulfillment Centers:', error);
    return ResponseHandler.error(res, 'Failed to fetch available Fulfillment Centers', 500);
  }
};

export const setDefaultFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fc_id } = req.body;

    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    // Verify assignment exists
    const assignment = await UserFulfillmentCenter.findOne({
      where: { 
        user_id: userId,
        fc_id,
        is_active: true
      }
    });

    if (!assignment) {
      return ResponseHandler.error(res, 'Assignment not found or inactive', 404);
    }

    // Unset all other defaults for this user
    await UserFulfillmentCenter.update(
      { is_default: false },
      { where: { user_id: userId } }
    );

    // Set this as default
    await assignment.update({ is_default: true });

    return ResponseHandler.success(res, {
      message: 'Default Fulfillment Center set successfully',
      data: { fc_id, is_default: true }
    });

  } catch (error) {
    console.error('Error setting default Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to set default Fulfillment Center', 500);
  }
};

import { Request, Response } from 'express';
import { ResponseHandler } from '../middleware/responseHandler';
import UserFulfillmentCenter from '../models/UserFulfillmentCenter';
import User from '../models/User';
import FulfillmentCenter from '../models/FulfillmentCenter';
import DistributionCenter from '../models/DistributionCenter';
import { JwtUtils } from '../utils/jwt';
import { AuthRequest, FulfillmentCenterSelectionResponse } from '../types';
import sequelize from '../config/database';

export const selectFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fc_id } = req.body;

    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    // Verify user has access to this FC
    const assignment = await UserFulfillmentCenter.findOne({
      where: { 
        user_id: userId,
        fc_id,
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
      ]
    });

    if (!assignment) {
      return ResponseHandler.error(res, 'Access denied to this Fulfillment Center', 403);
    }

    // Generate new tokens with FC context
    const user = await User.findByPk(userId);
    if (!user) {
      return ResponseHandler.error(res, 'User not found', 404);
    }

    // Get user's available FCs for the token
    const userAssignments = await UserFulfillmentCenter.findAll({
      where: { 
        user_id: userId,
        is_active: true
      },
      include: [
        { 
          model: FulfillmentCenter, 
          as: 'FulfillmentCenter',
          where: { status: 'ACTIVE' },
          attributes: ['id']
        }
      ]
    });

    const availableFcIds = userAssignments.map(assignment => assignment.FulfillmentCenter!.id);

    // Generate tokens with FC context
    const accessToken = await JwtUtils.generateAccessTokenWithFC(user, fc_id, availableFcIds);
    const refreshToken = await JwtUtils.generateRefreshToken(user);

    return ResponseHandler.success(res, {
      message: 'Fulfillment Center selected successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          roleId: user.roleId,
          isActive: user.isActive
        },
        fulfillment_center: {
          id: assignment.FulfillmentCenter!.id,
          fc_code: assignment.FulfillmentCenter!.fc_code,
          name: assignment.FulfillmentCenter!.name,
          dc_id: assignment.FulfillmentCenter!.dc_id,
          distribution_center: {
            id: assignment.FulfillmentCenter!.DistributionCenter!.id,
            dc_code: assignment.FulfillmentCenter!.DistributionCenter!.dc_code,
            name: assignment.FulfillmentCenter!.DistributionCenter!.name
          }
        },
        role: assignment.role,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Error selecting Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to select Fulfillment Center', 500);
  }
};

export const debugFcQuery = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    console.log('Debug: User ID from token:', userId);

    // Test direct database query
    const [results] = await sequelize.query(`
      SELECT 
        ufc.id as assignment_id,
        ufc.role,
        ufc.is_default,
        fc.id as fc_id,
        fc.code as fc_code,
        fc.name as fc_name,
        fc.dc_id,
        dc.code as dc_code,
        dc.name as dc_name
      FROM UserFulfillmentCenters ufc
      JOIN fulfillment_centers fc ON ufc.fc_id = fc.id
      JOIN distribution_centers dc ON fc.dc_id = dc.id
      WHERE ufc.user_id = :userId 
        AND ufc.is_active = 1 
        AND fc.status = 'active'
      ORDER BY ufc.is_default DESC, ufc.assigned_date DESC
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    console.log('Debug: Raw query results:', results);
    console.log('Debug: Results count:', results.length);

    return ResponseHandler.success(res, {
      message: 'Debug query results',
      data: {
        userId,
        resultsCount: results.length,
        results: results
      }
    });

  } catch (error) {
    console.error('Debug query error:', error);
    return ResponseHandler.error(res, 'Debug query failed', 500);
  }
};

export const getAvailableFulfillmentCenters = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    console.log('🔍 Fetching FCs for user:', userId);
    console.log('🔍 User object:', req.user);

    // Use raw SQL query to avoid Sequelize association issues
    const results = await sequelize.query(`
      SELECT 
        ufc.id as assignment_id,
        ufc.role,
        ufc.is_default,
        fc.id as fc_id,
        fc.code as fc_code,
        fc.name as fc_name,
        fc.dc_id,
        dc.code as dc_code,
        dc.name as dc_name
      FROM UserFulfillmentCenters ufc
      JOIN fulfillment_centers fc ON ufc.fc_id = fc.id
      JOIN distribution_centers dc ON fc.dc_id = dc.id
      WHERE ufc.user_id = :userId 
        AND ufc.is_active = 1 
        AND fc.status = 'active'
      ORDER BY ufc.is_default DESC, ufc.assigned_date DESC
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    // Ensure results is an array
    const resultsArray = Array.isArray(results) ? results : [results];

    const fcSelections: FulfillmentCenterSelectionResponse[] = resultsArray.map((row: any) => ({
      id: row.fc_id,
      fc_code: row.fc_code,
      name: row.fc_name,
      dc_id: row.dc_id,
      distribution_center: {
        id: row.dc_id,
        dc_code: row.dc_code,
        name: row.dc_name
      },
      role: row.role,
      is_default: row.is_default
    }));

    return ResponseHandler.success(res, {
      message: 'Available Fulfillment Centers retrieved successfully',
      data: fcSelections
    });

  } catch (error) {
    console.error('❌ Error fetching available Fulfillment Centers:', error);
    console.error('❌ Error stack:', error.stack);
    return ResponseHandler.error(res, 'Failed to fetch available Fulfillment Centers', 500);
  }
};

export const getCurrentFulfillmentCenter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const currentFcId = req.user?.currentFcId;

    if (!userId) {
      return ResponseHandler.error(res, 'User not authenticated', 401);
    }

    if (!currentFcId) {
      return ResponseHandler.success(res, {
        message: 'No Fulfillment Center selected',
        data: null
      });
    }

    const assignment = await UserFulfillmentCenter.findOne({
      where: { 
        user_id: userId,
        fc_id: currentFcId,
        is_active: true
      },
      include: [
        { 
          model: FulfillmentCenter, 
          as: 'FulfillmentCenter',
          include: [
            { model: DistributionCenter, as: 'DistributionCenter', attributes: ['id', 'dc_code', 'name'] }
          ]
        }
      ]
    });

    if (!assignment) {
      return ResponseHandler.error(res, 'Current Fulfillment Center assignment not found', 404);
    }

    return ResponseHandler.success(res, {
      message: 'Current Fulfillment Center retrieved successfully',
      data: {
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
      }
    });

  } catch (error) {
    console.error('Error fetching current Fulfillment Center:', error);
    return ResponseHandler.error(res, 'Failed to fetch current Fulfillment Center', 500);
  }
};
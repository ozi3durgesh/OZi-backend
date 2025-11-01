// controllers/userController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Role } from '../models';
import { ResponseHandler } from '../middleware/responseHandler';

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    permissions: string[];
  };
}

export class UserController {
  static async createUser(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { email, password, roleId, roleName } = req.body;

      if (!email || !password) {
        return ResponseHandler.error(res, 'Email and password are required', 400);
      }

      // Check if requester has permission to create users
      if (!req.user?.permissions.includes('users_roles:manage')) {
        return ResponseHandler.error(res, 'Insufficient permissions', 403);
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseHandler.error(res, 'User already exists', 409);
      }

      // Determine role
      let finalRoleId = roleId;
      if (roleName) {
        const role = await Role.findOne({ where: { name: roleName } });
        if (!role) {
          return ResponseHandler.error(res, 'Invalid role name', 400);
        }
        finalRoleId = role.id;
      }

      if (!finalRoleId) {
        return ResponseHandler.error(res, 'Role ID or role name is required', 400);
      }

      const role = await Role.findByPk(finalRoleId);
      if (!role) {
        return ResponseHandler.error(res, 'Role not found', 404);
      }

      // Prevent creating admin users through this endpoint
      if (role.name === 'admin') {
        return ResponseHandler.error(res, 'Admin users must be created through registration endpoint', 403);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await User.create({
        email,
        password: hashedPassword,
        roleId: finalRoleId,
        isActive: true,
        availabilityStatus: 'available'
      });

      return ResponseHandler.success(res, {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        role: role.name,
        createdAt: user.createdAt,
      }, 201);
    } catch (error) {
      console.error('Create user error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { availabilityStatus } = req.body;

      if (!userId || !availabilityStatus) {
        return ResponseHandler.error(res, 'User ID and availability status are required', 400);
      }

      // Users can only update their own status
      if (parseInt(userId) !== req.user?.id) {
        return ResponseHandler.error(res, 'You can only update your own status', 403);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      user.availabilityStatus = availabilityStatus;
      await user.save();

      return ResponseHandler.success(res, {
        id: user.id,
        availabilityStatus: user.availabilityStatus,
      });
    } catch (error) {
      console.error('Update user status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async changeUserRole(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { roleId, roleName } = req.body;

      // Check if requester has permission to manage users
      if (!req.user?.permissions.includes('users_roles:manage')) {
        return ResponseHandler.error(res, 'Insufficient permissions', 403);
      }

      if (!userId) {
        return ResponseHandler.error(res, 'User ID is required', 400);
      }

      // Determine new role
      let finalRoleId = roleId;
      if (roleName) {
        const role = await Role.findOne({ where: { name: roleName } });
        if (!role) {
          return ResponseHandler.error(res, 'Invalid role name', 400);
        }
        finalRoleId = role.id;
      }

      if (!finalRoleId) {
        return ResponseHandler.error(res, 'Role ID or role name is required', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      const newRole = await Role.findByPk(finalRoleId);
      if (!newRole) {
        return ResponseHandler.error(res, 'Role not found', 404);
      }

      // Prevent changing to admin role through this endpoint
      if (newRole.name === 'admin') {
        return ResponseHandler.error(res, 'Admin role changes must be done through registration endpoint', 403);
      }

      user.roleId = finalRoleId;
      await user.save();

      return ResponseHandler.success(res, {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        role: newRole.name,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error('Change user role error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async listUsers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, role } = req.query;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      const whereClause: any = {};
      if (role) {
        const roleRecord = await Role.findOne({ where: { name: role.toString() } });
        if (roleRecord) {
          whereClause.roleId = roleRecord.id;
        }
      }

      const users = await User.findAll({
        where: whereClause,
        include: [
          {
            association: 'Role',
            attributes: ['id', 'name', 'description']
          }
        ],
        attributes: ['id', 'email', 'roleId', 'isActive', 'availabilityStatus', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit.toString()),
        offset
      });

      const totalUsers = await User.count({ where: whereClause });

      return ResponseHandler.success(res, {
        users,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / parseInt(limit.toString()))
        }
      });
    } catch (error) {
      console.error('List users error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async deactivateUser(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      // Check if requester has permission to manage users
      if (!req.user?.permissions.includes('users_roles:manage')) {
        return ResponseHandler.error(res, 'Insufficient permissions', 403);
      }

      if (!userId) {
        return ResponseHandler.error(res, 'User ID is required', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      // Prevent deactivating self
      if (parseInt(userId) === req.user?.id) {
        return ResponseHandler.error(res, 'Cannot deactivate your own account', 403);
      }

      user.isActive = false;
      await user.save();

      return ResponseHandler.success(res, {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Toggle user's isActive status (activate/deactivate)
   */
  static async toggleUserStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (!userId) {
        return ResponseHandler.error(res, 'User ID is required', 400);
      }

      // Validate isActive parameter
      if (typeof isActive !== 'boolean') {
        return ResponseHandler.error(res, 'isActive must be a boolean value (true or false)', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      // Check permissions based on action and user
      const isSelfAction = parseInt(userId) === req.user?.id;
      const hasManagePermission = req.user?.permissions.includes('users_roles:manage');

      // Allow users to deactivate themselves, but require admin permission for activation
      if (isSelfAction && isActive && !hasManagePermission) {
        return ResponseHandler.error(res, 'Only administrators can activate accounts', 403);
      }

      // Require admin permission for managing other users
      if (!isSelfAction && !hasManagePermission) {
        return ResponseHandler.error(res, 'Insufficient permissions', 403);
      }

      // Update the user's isActive status
      user.isActive = isActive;
      await user.save();

      const statusText = isActive ? 'activated' : 'deactivated';

      return ResponseHandler.success(res, {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        message: `User ${statusText} successfully`
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Self-deactivation endpoint - allows users to deactivate their own account
   */
  static async selfDeactivate(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User ID not found in request', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      // Check if user is already deactivated
      if (!user.isActive) {
        return ResponseHandler.error(res, 'Account is already deactivated', 400);
      }

      // Deactivate the user
      user.isActive = false;
      user.availabilityStatus = 'off-shift'; // Also set availability to off-shift
      await user.save();

      return ResponseHandler.success(res, {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        message: 'Account deactivated successfully. Please contact an administrator to reactivate your account.',
        deactivatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Self-deactivation error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }


  /**
   * Self-manage availability status (available/off-shift)
   * Users can set their own availability status
   */
  static async selfManageStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { isActive } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseHandler.error(res, 'User not authenticated', 401);
      }

      if (typeof isActive !== 'boolean') {
        return ResponseHandler.error(res, 'isActive must be a boolean value (true or false)', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      // Convert isActive boolean to availabilityStatus
      const newAvailabilityStatus = isActive ? 'available' : 'off-shift';

      // Special handling for off-shift users trying to go available
      if (user.availabilityStatus === 'off-shift' && isActive) {
        console.log(`Off-shift user ${user.email} attempting to go available`);
      }

      // Update only the availability status, not isActive (idempotent operation)
      user.availabilityStatus = newAvailabilityStatus;
      await user.save();

      const statusText = isActive ? 'available' : 'off-shift';
      const actionText = isActive ? 'available' : 'off-shift';

      return ResponseHandler.success(res, {
        message: `Availability status set to ${actionText} successfully`,
        id: user.id,
        email: user.email,
        isActive: user.isActive, // Keep original isActive value
        availabilityStatus: user.availabilityStatus,
        [`${statusText}At`]: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Self-manage status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}
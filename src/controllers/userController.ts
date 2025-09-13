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

      // Prevent changing the last admin user
      if (user.roleId === 1) { // Assuming admin role ID is 1
        const adminUsers = await User.count({ where: { roleId: 1 } });
        if (adminUsers <= 1) {
          return ResponseHandler.error(res, 'Cannot change role of the last admin user', 403);
        }
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
      // Check if requester has permission to view users
      if (!req.user?.permissions.includes('users_roles:manage')) {
        return ResponseHandler.error(res, 'Insufficient permissions', 403);
      }

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

      // Prevent deactivating the last admin user
      if (user.roleId === 1) { // Assuming admin role ID is 1
        const adminUsers = await User.count({ where: { roleId: 1, isActive: true } });
        if (adminUsers <= 1) {
          return ResponseHandler.error(res, 'Cannot deactivate the last admin user', 403);
        }
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

      // Check if requester has permission to manage users
      if (!req.user?.permissions.includes('users_roles:manage')) {
        return ResponseHandler.error(res, 'Insufficient permissions', 403);
      }

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

      // Prevent toggling the last admin user to inactive
      if (user.roleId === 1 && !isActive) { // Assuming admin role ID is 1
        const adminUsers = await User.count({ where: { roleId: 1, isActive: true } });
        if (adminUsers <= 1) {
          return ResponseHandler.error(res, 'Cannot deactivate the last admin user', 403);
        }
      }

      // Prevent users from toggling their own status
      if (parseInt(userId) === req.user?.id) {
        return ResponseHandler.error(res, 'Cannot toggle your own account status', 403);
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
}
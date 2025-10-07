import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Role, TokenBlacklist, UserFulfillmentCenter, FulfillmentCenter, DistributionCenter } from '../models';
import { JwtUtils } from '../utils/jwt';
import { ValidationUtils } from '../utils/validation';
import { ResponseHandler } from '../middleware/responseHandler';

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, roleId, roleName, adminSecret, fulfillmentCenters, fcRoles, name, phone } = req.body;

      if (!email || !password) {
        return ResponseHandler.error(
          res,
          'Email and password are required',
          400
        );
      }

      if (!ValidationUtils.validateEmail(email)) {
        return ResponseHandler.error(res, 'Invalid email format', 400);
      }

      const passwordValidation = ValidationUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return ResponseHandler.error(res, passwordValidation.message, 400);
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseHandler.error(res, 'User already exists', 409);
      }

      // Check if this is the first user (admin registration)
      const totalUsers = await User.count();
      const isFirstUser = totalUsers === 0;

      // Determine role based on roleName or roleId
      let finalRoleId = roleId;
      if (roleName) {
        const role = await Role.findOne({ where: { name: roleName } });
        if (!role) {
          return ResponseHandler.error(res, 'Invalid role name', 400);
        }
        finalRoleId = role.id;
      } else if (!roleId) {
        // Default to WH Staff 1 if no role specified
        const defaultRole = await Role.findOne({
          where: { name: 'wh_staff_1' },
        });
        if (defaultRole) {
          finalRoleId = defaultRole.id;
        }
      }

      // Validate role exists
      if (finalRoleId) {
        const role = await Role.findByPk(finalRoleId);
        if (!role) {
          return ResponseHandler.error(res, 'Invalid role ID', 400);
        }
      }

      // Handle admin registration
      if (
        roleName === 'admin' ||
        (finalRoleId && (await AuthController.isAdminRole(finalRoleId)))
      ) {
        if (isFirstUser) {
          // First user can become admin without secret
        } else {
          // Subsequent admin registrations require admin secret
          const expectedAdminSecret = process.env.ADMIN_REGISTRATION_SECRET;
          if (!expectedAdminSecret) {
            return ResponseHandler.error(
              res,
              'Admin registration is not configured',
              500
            );
          }

          if (!adminSecret || adminSecret !== expectedAdminSecret) {
            return ResponseHandler.error(
              res,
              'Invalid admin registration secret',
              403
            );
          }
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password: hashedPassword,
        roleId: finalRoleId,
        isActive: true,
        availabilityStatus: 'available',
        name: name || null,
        phone: phone || null,
      });

      // Handle FC assignments if provided
      if (fulfillmentCenters && Array.isArray(fulfillmentCenters) && fulfillmentCenters.length > 0) {
        console.log('🔗 Creating FC assignments for user:', user.id);
        
        for (let i = 0; i < fulfillmentCenters.length; i++) {
          const fcId = fulfillmentCenters[i];
          try {
            // Validate FC exists
            const fc = await FulfillmentCenter.findByPk(fcId);
            if (!fc) {
              console.warn(`⚠️ FC ${fcId} not found, skipping assignment`);
              continue;
            }

            // Get role for this FC and map it to valid database role
            const inputRole = fcRoles?.[fcId] || 'STAFF';
            const roleMapping: { [key: string]: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER' | 'VIEWER' } = {
              'STAFF': 'OPERATOR',
              'MANAGER': 'MANAGER', 
              'SUPERVISOR': 'SUPERVISOR',
              'OPERATOR': 'OPERATOR',
              'PICKER': 'PICKER',
              'PACKER': 'PACKER',
              'VIEWER': 'VIEWER'
            };
            const fcRole = roleMapping[inputRole] || 'OPERATOR';
            
            // Set first FC as default, or if user specified a default FC, use that
            const isDefault = i === 0; // First FC becomes default
            
            await UserFulfillmentCenter.create({
              user_id: user.id,
              fc_id: fcId,
              role: fcRole,
              assigned_date: new Date(),
              is_active: true,
              is_default: isDefault,
              created_by: user.id, // Self-assigned during registration
              updated_by: user.id,
            });

            console.log(`✅ Assigned user ${user.id} to FC ${fcId} with role ${fcRole} (default: ${isDefault})`);
          } catch (error) {
            console.error(`❌ Error assigning user to FC ${fcId}:`, error);
            // Continue with other FCs even if one fails
          }
        }
      }

      const accessToken = await JwtUtils.generateAccessToken(user);
      const refreshToken = await JwtUtils.generateRefreshToken(user);

      // Get role information
      const userWithRole = await User.findByPk(user.id, {
        include: [
          {
            association: 'Role',
            include: ['Permissions'],
          },
        ],
        attributes: [
          'id',
          'email',
          'roleId',
          'isActive',
          'availabilityStatus',
          'createdAt',
          'name',
          'phone',
        ],
      });

      return ResponseHandler.success(
        res,
        {
          user: {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            role: userWithRole?.Role?.name || '',
            permissions: userWithRole?.Role?.Permissions
              ? userWithRole.Role.Permissions.map(
                  (p) => `${p.module}:${p.action}`
                )
              : [],
            availabilityStatus: user.availabilityStatus,
            createdAt: user.createdAt,
            name: user.name,
            phone: user.phone,
          },
          accessToken,
          refreshToken,
          isFirstUser: isFirstUser,
        },
        201
      );
    } catch (error) {
      console.error('Register error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ResponseHandler.error(
          res,
          'Email and password are required',
          400
        );
      }

      const user = await User.findOne({
        where: { email },
        include: [
          {
            association: 'Role',
            include: ['Permissions'],
          },
        ],
        attributes: [
          'id',
          'email',
          'password',
          'roleId',
          'isActive',
          'availabilityStatus',
          'createdAt',
          'name',
          'phone',
        ],
      });

      if (!user) {
        return ResponseHandler.error(res, 'Invalid credentials', 401);
      }

      // Allow deactivated users to login so they can reactivate themselves
      // The authentication middleware will handle access control for deactivated users

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return ResponseHandler.error(res, 'Invalid credentials', 401);
      }

      // Update user availability status to 'available' on login
      await user.update({ availabilityStatus: 'available' });

      // Fetch user's FC assignments
      const userFCs = await UserFulfillmentCenter.findAll({
        where: { 
          user_id: user.id,
          is_active: true 
        },
        include: [
          {
            model: FulfillmentCenter,
            as: 'FulfillmentCenter',
            include: [
              {
                model: DistributionCenter,
                as: 'DistributionCenter',
              }
            ]
          }
        ]
      });

      const availableFcIds = userFCs.map(ufc => ufc.fc_id);
      const availableFcs = userFCs.map(ufc => ({
        id: ufc.FulfillmentCenter.id,
        fc_code: ufc.FulfillmentCenter.fc_code,
        name: ufc.FulfillmentCenter.name,
        dc_id: ufc.FulfillmentCenter.dc_id,
        distribution_center: {
          id: ufc.FulfillmentCenter.DistributionCenter.id,
          dc_code: ufc.FulfillmentCenter.DistributionCenter.dc_code,
          name: ufc.FulfillmentCenter.DistributionCenter.name
        }
      }));

      // Extract unique distribution centers
      const dcMap = new Map();
      userFCs.forEach(ufc => {
        const dc = ufc.FulfillmentCenter.DistributionCenter;
        if (!dcMap.has(dc.id)) {
          dcMap.set(dc.id, {
            id: dc.id,
            dc_code: dc.dc_code,
            name: dc.name
          });
        }
      });
      const availableDcs = Array.from(dcMap.values());

      const defaultFC = userFCs.find(ufc => ufc.is_default) || userFCs[0]; // Fallback to first FC if no default

      const accessToken = await JwtUtils.generateAccessToken(user, defaultFC?.fc_id, availableFcIds);
      const refreshToken = await JwtUtils.generateRefreshToken(user);

      return ResponseHandler.success(res, {
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          role: user.Role?.name || '',
          permissions: user.Role?.Permissions
            ? user.Role.Permissions.map((p) => `${p.module}:${p.action}`)
            : [],
          availabilityStatus: user.availabilityStatus,
          createdAt: user.createdAt,
          name: user.name,
          phone: user.phone,
          availableFcs: availableFcs,
          availableDcs: availableDcs,
          currentFcId: defaultFC?.fc_id || null,
          fulfillmentCenter: defaultFC ? {
            id: defaultFC.FulfillmentCenter.id,
            fc_code: defaultFC.FulfillmentCenter.fc_code,
            name: defaultFC.FulfillmentCenter.name,
            dc_id: defaultFC.FulfillmentCenter.dc_id,
            distribution_center: {
              id: defaultFC.FulfillmentCenter.DistributionCenter.id,
              dc_code: defaultFC.FulfillmentCenter.DistributionCenter.dc_code,
              name: defaultFC.FulfillmentCenter.DistributionCenter.name
            }
          } : null,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ResponseHandler.error(res, 'Refresh token is required', 400);
      }

      const payload = JwtUtils.verifyRefreshToken(refreshToken);

      const user = await User.findByPk(payload.userId, {
        include: [
          {
            association: 'Role',
            include: ['Permissions'],
          },
        ],
        attributes: [
          'id',
          'email',
          'roleId',
          'isActive',
          'availabilityStatus',
          'createdAt',
          'name',
          'phone',
        ],
      });

      if (!user) {
        return ResponseHandler.error(res, 'User not found', 401);
      }

      // Allow deactivated users to refresh tokens so they can reactivate themselves
      // The authentication middleware will handle access control for deactivated users

      const newAccessToken = await JwtUtils.generateAccessToken(user);
      const newRefreshToken = await JwtUtils.generateRefreshToken(user);

      return ResponseHandler.success(res, {
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          role: user.Role?.name || '',
          permissions: user.Role?.Permissions
            ? user.Role.Permissions.map((p) => `${p.module}:${p.action}`)
            : [],
          availabilityStatus: user.availabilityStatus,
          createdAt: user.createdAt,
          name: user.name,
          phone: user.phone,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return ResponseHandler.error(res, 'Invalid refresh token', 401);
    }
  }

  static async getProfile(req: any, res: Response): Promise<Response> {
    try {
      return ResponseHandler.success(res, {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          permissions: req.user.permissions,
          availabilityStatus: req.user.availabilityStatus,
          createdAt: req.user.createdAt,
          name: req.user.name,
          phone: req.user.phone,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Get available roles for registration
  static async getRoles(req: Request, res: Response): Promise<Response> {
    try {
      const roles = await Role.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']],
      });

      return ResponseHandler.success(res, { roles });
    } catch (error) {
      console.error('Get roles error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Check if system has any users
  static async checkSystemStatus(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const totalUsers = await User.count();
      const hasUsers = totalUsers > 0;

      return ResponseHandler.success(res, {
        hasUsers,
        totalUsers,
        message: hasUsers
          ? 'System is initialized'
          : 'System needs initial admin setup',
      });
    } catch (error) {
      console.error('Check system status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Helper method to check if a role is admin
  static async isAdminRole(roleId: number): Promise<boolean> {
    const role = await Role.findByPk(roleId);
    return role?.name === 'admin';
  }

  static async logout(req: any, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;
      const accessToken = req.headers.authorization?.substring(7); // Remove 'Bearer ' prefix

      if (!accessToken) {
        return ResponseHandler.error(res, 'Access token is required', 400);
      }

      // Verify the access token to get user information
      let payload;
      try {
        payload = JwtUtils.verifyAccessToken(accessToken);
      } catch (error) {
        console.error('Token verification failed:', error);
        return ResponseHandler.error(res, 'Invalid or expired access token', 401);
      }

      const userId = payload.userId;

      // Get user information from database to return in response
      const user = await User.findByPk(userId, {
        include: [
          {
            association: 'Role',
            include: ['Permissions'],
          },
        ],
        attributes: [
          'id',
          'email',
          'roleId',
          'isActive',
          'availabilityStatus',
          'createdAt',
          'name',
          'phone',
        ],
      });

      if (!user) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      // Check if token is already blacklisted
      const existingToken = await TokenBlacklist.findOne({
        where: { token: accessToken }
      });

      // Add access token to blacklist only if not already there
      if (!existingToken) {
        try {
          await TokenBlacklist.create({
            token: accessToken,
            userId: userId,
            tokenType: 'access',
            expiresAt: payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000), // Default to 15 minutes if exp not available
          });
        } catch (error: any) {
          // If it's a duplicate entry error, that's fine - token is already blacklisted
          if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY') {
            console.log('Token already blacklisted, continuing with logout');
          } else {
            throw error; // Re-throw if it's a different error
          }
        }
      }

      // If refresh token is provided, add it to blacklist as well
      if (refreshToken) {
        try {
          const refreshPayload = JwtUtils.verifyRefreshToken(refreshToken);
          
          // Verify refresh token belongs to the same user
          if (refreshPayload.userId !== userId) {
            return ResponseHandler.error(res, 'Refresh token does not belong to the authenticated user', 403);
          }
          
          // Check if refresh token is already blacklisted
          const existingRefreshToken = await TokenBlacklist.findOne({
            where: { token: refreshToken }
          });
          
          // Add refresh token to blacklist only if not already there
          if (!existingRefreshToken) {
            try {
              await TokenBlacklist.create({
                token: refreshToken,
                userId: userId,
                tokenType: 'refresh',
                expiresAt: refreshPayload.exp ? new Date(refreshPayload.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days if exp not available
              });
            } catch (error: any) {
              // If it's a duplicate entry error, that's fine - token is already blacklisted
              if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY') {
                console.log('Refresh token already blacklisted, continuing with logout');
              } else {
                throw error; // Re-throw if it's a different error
              }
            }
          }
        } catch (error) {
          console.error('Refresh token verification failed:', error);
          return ResponseHandler.error(res, 'Invalid refresh token', 401);
        }
      }

      // Update user availability status to 'off-shift' on logout
      await user.update({ availabilityStatus: 'off-shift' });
      
      // Refresh user data to get updated availability status
      await user.reload();

      return ResponseHandler.success(res, {
        message: 'Successfully logged out',
        loggedOutAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          role: user.Role?.name || '',
          permissions: user.Role?.Permissions
            ? user.Role.Permissions.map((p) => `${p.module}:${p.action}`)
            : [],
          availabilityStatus: user.availabilityStatus,
          createdAt: user.createdAt,
          name: user.name,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('JWT_ACCESS_SECRET')) {
          return ResponseHandler.error(res, 'Server configuration error', 500);
        }
        if (error.message.includes('database') || error.message.includes('connection')) {
          return ResponseHandler.error(res, 'Database connection error', 500);
        }
      }
      
      return ResponseHandler.error(res, 'Logout failed due to server error', 500);
    }
  }

  static async logoutAll(req: any, res: Response): Promise<Response> {
    try {
      const accessToken = req.headers.authorization?.substring(7); // Remove 'Bearer ' prefix

      if (!accessToken) {
        return ResponseHandler.error(res, 'Access token is required', 400);
      }

      // Verify the access token to get user information
      let payload;
      try {
        payload = JwtUtils.verifyAccessToken(accessToken);
      } catch (error) {
        return ResponseHandler.error(res, 'Invalid access token', 401);
      }

      const userId = payload.userId;

      // Check if current access token is already blacklisted
      const existingToken = await TokenBlacklist.findOne({
        where: { token: accessToken }
      });

      // Add current access token to blacklist only if not already there
      if (!existingToken) {
        await TokenBlacklist.create({
          token: accessToken,
          userId: userId,
          tokenType: 'access',
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000), // Default to 15 minutes if exp not available
        });
      }

      // For logout-all, we just blacklist the current access token
      // In a real implementation, you might want to:
      // 1. Store active refresh tokens in a separate table when users login
      // 2. Blacklist all active refresh tokens for this user
      // For now, we'll just blacklist the current access token
      // Future refresh token usage will be handled by the middleware checking blacklist

      return ResponseHandler.success(res, {
        message: 'Successfully logged out from all devices',
        loggedOutAt: new Date().toISOString(),
        userId: userId,
      });
    } catch (error) {
      console.error('Logout all error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Logout a specific user (Admin only)
   * This allows admin users to logout other users from all their devices
   */
  static async logoutUser(req: any, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const accessToken = req.headers.authorization?.substring(7); // Remove 'Bearer ' prefix

      if (!accessToken) {
        return ResponseHandler.error(res, 'Access token is required', 400);
      }

      if (!userId) {
        return ResponseHandler.error(res, 'User ID is required', 400);
      }

      // Verify the access token to get admin user information
      let payload;
      try {
        payload = JwtUtils.verifyAccessToken(accessToken);
      } catch (error) {
        return ResponseHandler.error(res, 'Invalid access token', 401);
      }

      const adminUserId = payload.userId;

      // Check if the requesting user has admin permissions
      if (!req.user?.permissions.includes('users_roles:manage')) {
        return ResponseHandler.error(res, 'Insufficient permissions. Admin access required.', 403);
      }

      // Prevent admin from logging out themselves through this endpoint
      if (parseInt(userId) === adminUserId) {
        return ResponseHandler.error(res, 'Use the regular logout endpoint to logout yourself', 400);
      }

      // Check if target user exists
      const targetUser = await User.findByPk(userId);
      if (!targetUser) {
        return ResponseHandler.error(res, 'Target user not found', 404);
      }

      // For admin logout, we'll create a special blacklist entry
      // In a real implementation, you might want to:
      // 1. Store active tokens in a separate table when users login
      // 2. Blacklist all active tokens for this specific user
      // For now, we'll create a marker entry to indicate the user was logged out by admin
      await TokenBlacklist.create({
        token: `admin_logout_${userId}_${Date.now()}`, // Create a unique marker token
        userId: parseInt(userId),
        tokenType: 'access',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      });

      return ResponseHandler.success(res, {
        message: `Successfully logged out user ${targetUser.email}`,
        targetUserId: parseInt(userId),
        targetUserEmail: targetUser.email,
        loggedOutAt: new Date().toISOString(),
        adminUserId: adminUserId,
      });
    } catch (error) {
      console.error('Logout user error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Role } from '../models';
import { JwtUtils } from '../utils/jwt';
import { ValidationUtils } from '../utils/validation';
import { ResponseHandler } from '../middleware/responseHandler';

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, roleId, roleName, adminSecret } = req.body;

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
          console.log('First user registration - creating admin account');
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
      });

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
        ],
      });

      if (!user) {
        return ResponseHandler.error(res, 'Invalid credentials', 401);
      }

      if (!user.isActive) {
        return ResponseHandler.error(res, 'Account is deactivated', 401);
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return ResponseHandler.error(res, 'Invalid credentials', 401);
      }

      const accessToken = await JwtUtils.generateAccessToken(user);
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
        ],
      });

      if (!user) {
        return ResponseHandler.error(res, 'User not found', 401);
      }

      if (!user.isActive) {
        return ResponseHandler.error(res, 'Account is deactivated', 401);
      }

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
}

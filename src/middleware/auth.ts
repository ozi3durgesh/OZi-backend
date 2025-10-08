// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt';
import { User, TokenBlacklist } from '../models';
import { ResponseHandler } from './responseHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseHandler.error(res, 'Access token required', 401);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({
      where: { token }
    });

    if (blacklistedToken) {
      ResponseHandler.error(res, 'Token has been revoked', 401);
      return;
    }
    
    const payload = JwtUtils.verifyAccessToken(token);
    
    // Get user with role and permissions
    const user = await User.findByPk(payload.userId, {
      include: [
        {
          association: 'Role',
          include: ['Permissions'],
        }
      ],
      attributes: ['id', 'email', 'roleId', 'isActive', 'availabilityStatus', 'createdAt']
    });

    if (!user) {
      ResponseHandler.error(res, 'User not found', 401);
      return;
    }

    // Allow deactivated users to access only self-reactivation endpoint
    if (!user.isActive) {
      // Check if this is the self-reactivation endpoint
      const isSelfReactivationEndpoint = req.path === '/api/users/self/isActive' && req.method === 'POST';
      
      if (!isSelfReactivationEndpoint) {
        ResponseHandler.error(res, 'User account is deactivated', 401);
        return;
      }
      
      // For self-reactivation endpoint, allow access but with limited user data
      req.user = {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        role: user.Role?.name || '',
        permissions: [], // No permissions for deactivated users
        availabilityStatus: user.availabilityStatus,
        createdAt: user.createdAt,
        isActive: false // Explicitly mark as inactive
      };
      next();
      return;
    }

    // Attach user and permissions to request
    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.Role?.name || '',
      permissions: user.Role?.Permissions 
        ? user.Role.Permissions.map(p => `${p.module}:${p.action}`)
        : [],
      availabilityStatus: user.availabilityStatus,
      createdAt: user.createdAt,
      currentFcId: payload.currentFcId,
      availableFcs: payload.availableFcs
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    ResponseHandler.error(res, 'Invalid access token', 401);
  }
};

export const hasPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        ResponseHandler.error(res, 'Authentication required', 401);
        return;
      }

      const userPermissions = req.user.permissions || [];
      
      // Check if user has the required permission
      const hasRequiredPermission = userPermissions.includes(requiredPermission);
      
      if (!hasRequiredPermission) {
        ResponseHandler.error(res, 'Insufficient permissions', 403);
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      ResponseHandler.error(res, 'Permission check failed', 500);
    }
  };
};

export const checkAvailability = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      ResponseHandler.error(res, 'Authentication required', 401);
      return;
    }

    const availabilityStatus = req.user.availabilityStatus;
    
    if (availabilityStatus === 'off-shift') {
      ResponseHandler.error(res, 'User is currently off-shift', 403);
      return;
    }

    next();
  } catch (error) {
    console.error('Availability check error:', error);
    ResponseHandler.error(res, 'Availability check failed', 500);
  }
};

export const checkFulfillmentCenterAccess = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      ResponseHandler.error(res, 'Authentication required', 401);
      return;
    }

    const currentFcId = req.user.currentFcId;
    const availableFcs = req.user.availableFcs || [];

    if (!currentFcId) {
      ResponseHandler.error(res, 'No Fulfillment Center selected. Please select a Fulfillment Center first.', 403);
      return;
    }

    if (!availableFcs.includes(currentFcId)) {
      ResponseHandler.error(res, 'Access denied to current Fulfillment Center', 403);
      return;
    }

    next();
  } catch (error) {
    console.error('FC access check error:', error);
    ResponseHandler.error(res, 'FC access check failed', 500);
  }
};

/**
 * Middleware to check if user has specific role(s)
 * @param allowedRoles - String or array of allowed role names (e.g., 'admin' or ['admin', 'manager'])
 */
export const hasRole = (allowedRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        ResponseHandler.error(res, 'Authentication required', 401);
        return;
      }

      const userRole = req.user.role;
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user has one of the allowed roles
      const hasRequiredRole = rolesArray.includes(userRole);
      
      if (!hasRequiredRole) {
        ResponseHandler.error(
          res, 
          `Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${userRole}`, 
          403
        );
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      ResponseHandler.error(res, 'Role check failed', 500);
    }
  };
};

/**
 * Middleware specifically for admin-only routes
 */
export const isAdmin = hasRole('admin');

/**
 * Middleware for routes that require admin or manager roles
 */
export const isAdminOrManager = hasRole(['admin', 'manager']);

export const authenticateToken = authenticate;
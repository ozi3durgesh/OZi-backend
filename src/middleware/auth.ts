// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt';
import { User } from '../models';
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

    if (!user.isActive) {
      ResponseHandler.error(res, 'User account is deactivated', 401);
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
      createdAt: user.createdAt
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
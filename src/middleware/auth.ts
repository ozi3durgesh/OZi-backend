import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt';
import { ResponseHandler } from './responseHandler';
import { User } from '../models';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(res, 'Access token required', 401);
    }

    const token = authHeader.substring(7);
    const payload = JwtUtils.verifyAccessToken(token);
    
    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'email', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return ResponseHandler.error(res, 'User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return ResponseHandler.error(res, 'Invalid or expired token', 401);
  }
};
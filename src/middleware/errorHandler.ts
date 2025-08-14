import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from './responseHandler';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', error);

  if (error.name === 'JsonWebTokenError') {
    return ResponseHandler.error(res, 'Invalid token', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return ResponseHandler.error(res, 'Token expired', 401);
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return ResponseHandler.error(res, 'Email already exists', 409);
  }

  if (error.name === 'SequelizeValidationError') {
    return ResponseHandler.error(res, 'Validation error', 400);
  }

  return ResponseHandler.error(res, 'Internal server error', 500);
};
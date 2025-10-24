import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from './responseHandler';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', error);

  // JWT Token Errors
  if (error.name === 'JsonWebTokenError') {
    return ResponseHandler.error(res, 'Invalid authentication token', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return ResponseHandler.error(res, 'Authentication token has expired', 401);
  }

  // Database Constraint Errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    const sequelizeError = error as any;
    if (sequelizeError.errors && sequelizeError.errors.length > 0) {
      const field = sequelizeError.errors[0].path;
      return ResponseHandler.error(res, `${field} already exists`, 409);
    }
    return ResponseHandler.error(res, 'Duplicate entry found', 409);
  }

  // Database Validation Errors
  if (error.name === 'SequelizeValidationError') {
    const sequelizeError = error as any;
    console.error('SequelizeValidationError details:', {
      errors: sequelizeError.errors,
      message: sequelizeError.message
    });
    if (sequelizeError.errors && sequelizeError.errors.length > 0) {
      const validationErrors = sequelizeError.errors.map((err: any) => {
        if (err.type === 'notNull Violation') {
          return `${err.path} is required`;
        }
        if (err.type === 'Validation error') {
          return `${err.path}: ${err.message}`;
        }
        return err.message;
      });
      return ResponseHandler.error(res, `Validation failed: ${validationErrors.join(', ')}`, 400);
    }
    return ResponseHandler.error(res, 'Data validation failed', 400);
  }

  // Database Constraint Violations (including notNull)
  if (error.name === 'SequelizeDatabaseError') {
    const sequelizeError = error as any;
    
    // Handle notNull violations specifically
    if (sequelizeError.message && sequelizeError.message.includes('notNull Violation')) {
      const matches = sequelizeError.message.match(/OrderDetail\.(\w+) cannot be null/g);
      if (matches) {
        const fields = matches.map((match: string) => match.replace('OrderDetail.', '').replace(' cannot be null', ''));
        return ResponseHandler.error(res, `Missing required fields: ${fields.join(', ')}`, 400);
      }
      return ResponseHandler.error(res, 'Required fields are missing', 400);
    }

    // Handle foreign key constraint violations
    if (sequelizeError.message && sequelizeError.message.includes('foreign key constraint fails')) {
      return ResponseHandler.error(res, 'Referenced record not found', 400);
    }

    // Handle other database errors
    if (sequelizeError.message && sequelizeError.message.includes('Duplicate entry')) {
      return ResponseHandler.error(res, 'Record already exists', 409);
    }

    return ResponseHandler.error(res, 'Database operation failed', 500);
  }

  // Handle specific error messages
  if (error.message) {
    // Order-specific errors
    if (error.message.includes('Store not found')) {
      return ResponseHandler.error(res, 'Selected store is not available', 400);
    }
    if (error.message.includes('Product with SKU')) {
      return ResponseHandler.error(res, 'One or more products are not available', 400);
    }
    if (error.message.includes('Insufficient stock')) {
      return ResponseHandler.error(res, 'Some products are out of stock', 400);
    }
    if (error.message.includes('User not found')) {
      return ResponseHandler.error(res, 'User account not found', 404);
    }
  }

  // Default error response
  return ResponseHandler.error(res, 'An unexpected error occurred', 500);
};
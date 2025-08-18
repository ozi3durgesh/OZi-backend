// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
  enum?: string[];
  items?: ValidationRule;
  properties?: Record<string, ValidationRule>;
}

interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body
      if (schema.body) {
        for (const [field, rule] of Object.entries(schema.body)) {
          const value = req.body[field];
          
          if (rule.required && (value === undefined || value === null || value === '')) {
            res.status(400).json({
              statusCode: 400,
              success: false,
              error: `${field} is required`
            });
            return;
          }
          
          if (value !== undefined && value !== null) {
            if (rule.type === 'number' && typeof value !== 'number') {
              res.status(400).json({
                statusCode: 400,
                success: false,
                error: `${field} must be a number`
              });
              return;
            }
            
            if (rule.type === 'string' && typeof value !== 'string') {
              res.status(400).json({
                statusCode: 400,
                success: false,
                error: `${field} must be a string`
              });
              return;
            }
            
            if (rule.type === 'array' && !Array.isArray(value)) {
              res.status(400).json({
                statusCode: 400,
                success: false,
                error: `${field} must be an array`
              });
              return;
            }
            
            if (rule.enum && !rule.enum.includes(value)) {
              res.status(400).json({
                statusCode: 400,
                success: false,
                error: `${field} must be one of: ${rule.enum.join(', ')}`
              });
              return;
            }
            
            if (rule.min !== undefined && value < rule.min) {
              res.status(400).json({
                statusCode: 400,
                success: false,
                error: `${field} must be at least ${rule.min}`
              });
              return;
            }
            
            if (rule.max !== undefined && value > rule.max) {
              res.status(400).json({
                statusCode: 400,
                success: false,
                error: `${field} must be at most ${rule.max}`
              });
              return;
            }
          }
        }
      }
      
      // Validate params
      if (schema.params) {
        for (const [field, rule] of Object.entries(schema.params)) {
          const value = req.params[field];
          
          if (rule.required && !value) {
            res.status(400).json({
              statusCode: 400,
              success: false,
              error: `${field} parameter is required`
            });
            return;
          }
          
          if (rule.type === 'number' && value) {
            const numValue = parseInt(value);
            if (isNaN(numValue)) {
              res.status(400).json({
                statusCode: 400,
                success: false,
                error: `${field} parameter must be a number`
              });
              return;
            }
            // Update req.params with parsed number
            req.params[field] = numValue as any;
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Validation failed'
      });
      return;
    }
  };
};

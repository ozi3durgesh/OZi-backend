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
    // Skip all validation - accept any data as-is
    next();
  };
};

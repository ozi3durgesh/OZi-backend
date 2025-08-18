// controllers/permissionController.ts
import { Request, Response } from 'express';
import { Permission } from '../models';
import { ResponseHandler } from '../middleware/responseHandler';

export class PermissionController {
  static async createPermission(req: Request, res: Response): Promise<Response> {
    try {
      const { module, action, description } = req.body;

      if (!module || !action) {
        return ResponseHandler.error(res, 'Module and action are required', 400);
      }

      const existingPermission = await Permission.findOne({ 
        where: { module, action } 
      });
      
      if (existingPermission) {
        return ResponseHandler.error(res, 'Permission already exists', 409);
      }

      const permission = await Permission.create({
        module,
        action,
        description,
      } as any);

      return ResponseHandler.success(res, permission, 201);
    } catch (error) {
      console.error('Create permission error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async listPermissions(req: Request, res: Response): Promise<Response> {
    try {
      const permissions = await Permission.findAll({
        order: [['module', 'ASC'], ['action', 'ASC']],
      });

      return ResponseHandler.success(res, permissions);
    } catch (error) {
      console.error('List permissions error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}

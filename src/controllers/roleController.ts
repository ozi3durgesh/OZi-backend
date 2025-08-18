// controllers/roleController.ts
import { Request, Response } from 'express';
import { Role, Permission, RolePermission } from '../models';
import { ResponseHandler } from '../middleware/responseHandler';

export class RoleController {
  static async createRole(req: Request, res: Response): Promise<Response> {
    try {
      const { name, description, isActive = true } = req.body;

      if (!name) {
        return ResponseHandler.error(res, 'Role name is required', 400);
      }

      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return ResponseHandler.error(res, 'Role with this name already exists', 409);
      }

      const role = await Role.create({
        name,
        description,
        isActive,
      } as any);

      return ResponseHandler.success(res, role, 201);
    } catch (error) {
      console.error('Create role error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async assignPermissions(req: Request, res: Response): Promise<Response> {
    try {
      const { roleId, permissionIds } = req.body;

      if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
        return ResponseHandler.error(res, 'Role ID and permission IDs array are required', 400);
      }

      // First remove all existing permissions for this role
      await RolePermission.destroy({ where: { roleId } });

      // Add new permissions
      const rolePermissions = permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      }));

      await RolePermission.bulkCreate(rolePermissions as any);

      const updatedRole = await Role.findByPk(roleId, {
        include: [Permission],
      });

      return ResponseHandler.success(res, updatedRole);
    } catch (error) {
      console.error('Assign permissions error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async listRoles(req: Request, res: Response): Promise<Response> {
    try {
      const roles = await Role.findAll({
        include: [Permission],
        order: [['name', 'ASC']],
      });

      return ResponseHandler.success(res, roles);
    } catch (error) {
      console.error('List roles error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}

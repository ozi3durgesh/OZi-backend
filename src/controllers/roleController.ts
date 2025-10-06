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

      console.log('Assign permissions request:', { roleId, permissionIds });

      if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
        return ResponseHandler.error(res, 'Role ID and permission IDs array are required', 400);
      }

      // Validate that the role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        console.error(`Role with ID ${roleId} not found`);
        return ResponseHandler.error(res, `Role with ID ${roleId} not found`, 404);
      }

      // Validate that all permissions exist
      const existingPermissions = await Permission.findAll({
        where: { id: permissionIds }
      });

      if (existingPermissions.length !== permissionIds.length) {
        const foundPermissionIds = existingPermissions.map(p => p.id);
        const missingPermissionIds = permissionIds.filter(id => !foundPermissionIds.includes(id));
        console.error(`Permissions not found: ${missingPermissionIds.join(', ')}`);
        return ResponseHandler.error(res, `Permissions not found: ${missingPermissionIds.join(', ')}`, 404);
      }

      console.log('Validations passed, proceeding with assignment');

      // First remove all existing permissions for this role
      const deletedCount = await RolePermission.destroy({ where: { roleId } });
      console.log(`Removed ${deletedCount} existing permissions for role ${roleId}`);

      // Add new permissions
      const rolePermissions = permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      }));

      const createdPermissions = await RolePermission.bulkCreate(rolePermissions as any);
      console.log(`Created ${createdPermissions.length} new role permissions`);

      const updatedRole = await Role.findByPk(roleId, {
        include: [Permission],
      });

      return ResponseHandler.success(res, updatedRole);
    } catch (error) {
      console.error('Assign permissions error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const models_1 = require("../models");
const responseHandler_1 = require("../middleware/responseHandler");
class RoleController {
    static async createRole(req, res) {
        try {
            const { name, description, isActive = true } = req.body;
            if (!name) {
                return responseHandler_1.ResponseHandler.error(res, 'Role name is required', 400);
            }
            const existingRole = await models_1.Role.findOne({ where: { name } });
            if (existingRole) {
                return responseHandler_1.ResponseHandler.error(res, 'Role with this name already exists', 409);
            }
            const role = await models_1.Role.create({
                name,
                description,
                isActive,
            });
            return responseHandler_1.ResponseHandler.success(res, role, 201);
        }
        catch (error) {
            console.error('Create role error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async assignPermissions(req, res) {
        try {
            const { roleId, permissionIds } = req.body;
            if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
                return responseHandler_1.ResponseHandler.error(res, 'Role ID and permission IDs array are required', 400);
            }
            await models_1.RolePermission.destroy({ where: { roleId } });
            const rolePermissions = permissionIds.map(permissionId => ({
                roleId,
                permissionId,
            }));
            await models_1.RolePermission.bulkCreate(rolePermissions);
            const updatedRole = await models_1.Role.findByPk(roleId, {
                include: [models_1.Permission],
            });
            return responseHandler_1.ResponseHandler.success(res, updatedRole);
        }
        catch (error) {
            console.error('Assign permissions error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async listRoles(req, res) {
        try {
            const roles = await models_1.Role.findAll({
                include: [models_1.Permission],
                order: [['name', 'ASC']],
            });
            return responseHandler_1.ResponseHandler.success(res, roles);
        }
        catch (error) {
            console.error('List roles error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
}
exports.RoleController = RoleController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const models_1 = require("../models");
const responseHandler_1 = require("../middleware/responseHandler");
class PermissionController {
    static async createPermission(req, res) {
        try {
            const { module, action, description } = req.body;
            if (!module || !action) {
                return responseHandler_1.ResponseHandler.error(res, 'Module and action are required', 400);
            }
            const existingPermission = await models_1.Permission.findOne({
                where: { module, action }
            });
            if (existingPermission) {
                return responseHandler_1.ResponseHandler.error(res, 'Permission already exists', 409);
            }
            const permission = await models_1.Permission.create({
                module,
                action,
                description,
            });
            return responseHandler_1.ResponseHandler.success(res, permission, 201);
        }
        catch (error) {
            console.error('Create permission error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async listPermissions(req, res) {
        try {
            const permissions = await models_1.Permission.findAll({
                order: [['module', 'ASC'], ['action', 'ASC']],
            });
            return responseHandler_1.ResponseHandler.success(res, permissions);
        }
        catch (error) {
            console.error('List permissions error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
}
exports.PermissionController = PermissionController;

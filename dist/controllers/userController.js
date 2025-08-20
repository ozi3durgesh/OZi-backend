"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const responseHandler_1 = require("../middleware/responseHandler");
class UserController {
    static async createUser(req, res) {
        try {
            const { email, password, roleId, roleName } = req.body;
            if (!email || !password) {
                return responseHandler_1.ResponseHandler.error(res, 'Email and password are required', 400);
            }
            if (!req.user?.permissions.includes('users_roles:manage')) {
                return responseHandler_1.ResponseHandler.error(res, 'Insufficient permissions', 403);
            }
            const existingUser = await models_1.User.findOne({ where: { email } });
            if (existingUser) {
                return responseHandler_1.ResponseHandler.error(res, 'User already exists', 409);
            }
            let finalRoleId = roleId;
            if (roleName) {
                const role = await models_1.Role.findOne({ where: { name: roleName } });
                if (!role) {
                    return responseHandler_1.ResponseHandler.error(res, 'Invalid role name', 400);
                }
                finalRoleId = role.id;
            }
            if (!finalRoleId) {
                return responseHandler_1.ResponseHandler.error(res, 'Role ID or role name is required', 400);
            }
            const role = await models_1.Role.findByPk(finalRoleId);
            if (!role) {
                return responseHandler_1.ResponseHandler.error(res, 'Role not found', 404);
            }
            if (role.name === 'admin') {
                return responseHandler_1.ResponseHandler.error(res, 'Admin users must be created through registration endpoint', 403);
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const user = await models_1.User.create({
                email,
                password: hashedPassword,
                roleId: finalRoleId,
                isActive: true,
                availabilityStatus: 'available'
            });
            return responseHandler_1.ResponseHandler.success(res, {
                id: user.id,
                email: user.email,
                roleId: user.roleId,
                role: role.name,
                createdAt: user.createdAt,
            }, 201);
        }
        catch (error) {
            console.error('Create user error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async updateUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { availabilityStatus } = req.body;
            if (!userId || !availabilityStatus) {
                return responseHandler_1.ResponseHandler.error(res, 'User ID and availability status are required', 400);
            }
            if (parseInt(userId) !== req.user?.id) {
                return responseHandler_1.ResponseHandler.error(res, 'You can only update your own status', 403);
            }
            const user = await models_1.User.findByPk(userId);
            if (!user) {
                return responseHandler_1.ResponseHandler.error(res, 'User not found', 404);
            }
            user.availabilityStatus = availabilityStatus;
            await user.save();
            return responseHandler_1.ResponseHandler.success(res, {
                id: user.id,
                availabilityStatus: user.availabilityStatus,
            });
        }
        catch (error) {
            console.error('Update user status error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async changeUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { roleId, roleName } = req.body;
            if (!req.user?.permissions.includes('users_roles:manage')) {
                return responseHandler_1.ResponseHandler.error(res, 'Insufficient permissions', 403);
            }
            if (!userId) {
                return responseHandler_1.ResponseHandler.error(res, 'User ID is required', 400);
            }
            let finalRoleId = roleId;
            if (roleName) {
                const role = await models_1.Role.findOne({ where: { name: roleName } });
                if (!role) {
                    return responseHandler_1.ResponseHandler.error(res, 'Invalid role name', 400);
                }
                finalRoleId = role.id;
            }
            if (!finalRoleId) {
                return responseHandler_1.ResponseHandler.error(res, 'Role ID or role name is required', 400);
            }
            const user = await models_1.User.findByPk(userId);
            if (!user) {
                return responseHandler_1.ResponseHandler.error(res, 'User not found', 404);
            }
            const newRole = await models_1.Role.findByPk(finalRoleId);
            if (!newRole) {
                return responseHandler_1.ResponseHandler.error(res, 'Role not found', 404);
            }
            if (newRole.name === 'admin') {
                return responseHandler_1.ResponseHandler.error(res, 'Admin role changes must be done through registration endpoint', 403);
            }
            if (user.roleId === 1) {
                const adminUsers = await models_1.User.count({ where: { roleId: 1 } });
                if (adminUsers <= 1) {
                    return responseHandler_1.ResponseHandler.error(res, 'Cannot change role of the last admin user', 403);
                }
            }
            user.roleId = finalRoleId;
            await user.save();
            return responseHandler_1.ResponseHandler.success(res, {
                id: user.id,
                email: user.email,
                roleId: user.roleId,
                role: newRole.name,
                updatedAt: user.updatedAt,
            });
        }
        catch (error) {
            console.error('Change user role error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async listUsers(req, res) {
        try {
            if (!req.user?.permissions.includes('users_roles:manage')) {
                return responseHandler_1.ResponseHandler.error(res, 'Insufficient permissions', 403);
            }
            const { page = 1, limit = 10, role } = req.query;
            const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
            const whereClause = {};
            if (role) {
                const roleRecord = await models_1.Role.findOne({ where: { name: role.toString() } });
                if (roleRecord) {
                    whereClause.roleId = roleRecord.id;
                }
            }
            const users = await models_1.User.findAll({
                where: whereClause,
                include: [
                    {
                        association: 'Role',
                        attributes: ['id', 'name', 'description']
                    }
                ],
                attributes: ['id', 'email', 'roleId', 'isActive', 'availabilityStatus', 'createdAt'],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit.toString()),
                offset
            });
            const totalUsers = await models_1.User.count({ where: whereClause });
            return responseHandler_1.ResponseHandler.success(res, {
                users,
                pagination: {
                    page: parseInt(page.toString()),
                    limit: parseInt(limit.toString()),
                    total: totalUsers,
                    totalPages: Math.ceil(totalUsers / parseInt(limit.toString()))
                }
            });
        }
        catch (error) {
            console.error('List users error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async deactivateUser(req, res) {
        try {
            const { userId } = req.params;
            if (!req.user?.permissions.includes('users_roles:manage')) {
                return responseHandler_1.ResponseHandler.error(res, 'Insufficient permissions', 403);
            }
            if (!userId) {
                return responseHandler_1.ResponseHandler.error(res, 'User ID is required', 400);
            }
            const user = await models_1.User.findByPk(userId);
            if (!user) {
                return responseHandler_1.ResponseHandler.error(res, 'User not found', 404);
            }
            if (user.roleId === 1) {
                const adminUsers = await models_1.User.count({ where: { roleId: 1, isActive: true } });
                if (adminUsers <= 1) {
                    return responseHandler_1.ResponseHandler.error(res, 'Cannot deactivate the last admin user', 403);
                }
            }
            if (parseInt(userId) === req.user?.id) {
                return responseHandler_1.ResponseHandler.error(res, 'Cannot deactivate your own account', 403);
            }
            user.isActive = false;
            await user.save();
            return responseHandler_1.ResponseHandler.success(res, {
                id: user.id,
                email: user.email,
                isActive: user.isActive,
                message: 'User deactivated successfully'
            });
        }
        catch (error) {
            console.error('Deactivate user error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
}
exports.UserController = UserController;

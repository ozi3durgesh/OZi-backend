"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const validation_1 = require("../utils/validation");
const responseHandler_1 = require("../middleware/responseHandler");
class AuthController {
    static async register(req, res) {
        try {
            const { email, password, roleId, roleName, adminSecret } = req.body;
            if (!email || !password) {
                return responseHandler_1.ResponseHandler.error(res, 'Email and password are required', 400);
            }
            if (!validation_1.ValidationUtils.validateEmail(email)) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid email format', 400);
            }
            const passwordValidation = validation_1.ValidationUtils.validatePassword(password);
            if (!passwordValidation.isValid) {
                return responseHandler_1.ResponseHandler.error(res, passwordValidation.message, 400);
            }
            const existingUser = await models_1.User.findOne({ where: { email } });
            if (existingUser) {
                return responseHandler_1.ResponseHandler.error(res, 'User already exists', 409);
            }
            const totalUsers = await models_1.User.count();
            const isFirstUser = totalUsers === 0;
            let finalRoleId = roleId;
            if (roleName) {
                const role = await models_1.Role.findOne({ where: { name: roleName } });
                if (!role) {
                    return responseHandler_1.ResponseHandler.error(res, 'Invalid role name', 400);
                }
                finalRoleId = role.id;
            }
            else if (!roleId) {
                const defaultRole = await models_1.Role.findOne({ where: { name: 'wh_staff_1' } });
                if (defaultRole) {
                    finalRoleId = defaultRole.id;
                }
            }
            if (finalRoleId) {
                const role = await models_1.Role.findByPk(finalRoleId);
                if (!role) {
                    return responseHandler_1.ResponseHandler.error(res, 'Invalid role ID', 400);
                }
            }
            if (roleName === 'admin' || (finalRoleId && await AuthController.isAdminRole(finalRoleId))) {
                if (isFirstUser) {
                    console.log('First user registration - creating admin account');
                }
                else {
                    const expectedAdminSecret = process.env.ADMIN_REGISTRATION_SECRET;
                    if (!expectedAdminSecret) {
                        return responseHandler_1.ResponseHandler.error(res, 'Admin registration is not configured', 500);
                    }
                    if (!adminSecret || adminSecret !== expectedAdminSecret) {
                        return responseHandler_1.ResponseHandler.error(res, 'Invalid admin registration secret', 403);
                    }
                }
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const user = await models_1.User.create({
                email,
                password: hashedPassword,
                roleId: finalRoleId,
                isActive: true,
                availabilityStatus: 'available'
            });
            const accessToken = await jwt_1.JwtUtils.generateAccessToken(user);
            const refreshToken = await jwt_1.JwtUtils.generateRefreshToken(user);
            const userWithRole = await models_1.User.findByPk(user.id, {
                include: [
                    {
                        association: 'Role',
                        include: ['Permissions'],
                    }
                ],
                attributes: ['id', 'email', 'roleId', 'isActive', 'availabilityStatus', 'createdAt']
            });
            return responseHandler_1.ResponseHandler.success(res, {
                user: {
                    id: user.id,
                    email: user.email,
                    roleId: user.roleId,
                    role: userWithRole?.Role?.name || '',
                    permissions: userWithRole?.Role?.Permissions
                        ? userWithRole.Role.Permissions.map(p => `${p.module}:${p.action}`)
                        : [],
                    availabilityStatus: user.availabilityStatus,
                    createdAt: user.createdAt,
                },
                accessToken,
                refreshToken,
                isFirstUser: isFirstUser
            }, 201);
        }
        catch (error) {
            console.error('Register error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return responseHandler_1.ResponseHandler.error(res, 'Email and password are required', 400);
            }
            const user = await models_1.User.findOne({
                where: { email },
                include: [
                    {
                        association: 'Role',
                        include: ['Permissions'],
                    }
                ],
                attributes: ['id', 'email', 'password', 'roleId', 'isActive', 'availabilityStatus', 'createdAt']
            });
            if (!user) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid credentials', 401);
            }
            if (!user.isActive) {
                return responseHandler_1.ResponseHandler.error(res, 'Account is deactivated', 401);
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid credentials', 401);
            }
            const accessToken = await jwt_1.JwtUtils.generateAccessToken(user);
            const refreshToken = await jwt_1.JwtUtils.generateRefreshToken(user);
            return responseHandler_1.ResponseHandler.success(res, {
                user: {
                    id: user.id,
                    email: user.email,
                    roleId: user.roleId,
                    role: user.Role?.name || '',
                    permissions: user.Role?.Permissions
                        ? user.Role.Permissions.map(p => `${p.module}:${p.action}`)
                        : [],
                    availabilityStatus: user.availabilityStatus,
                    createdAt: user.createdAt,
                },
                accessToken,
                refreshToken,
            });
        }
        catch (error) {
            console.error('Login error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return responseHandler_1.ResponseHandler.error(res, 'Refresh token is required', 400);
            }
            const payload = jwt_1.JwtUtils.verifyRefreshToken(refreshToken);
            const user = await models_1.User.findByPk(payload.userId, {
                include: [
                    {
                        association: 'Role',
                        include: ['Permissions'],
                    }
                ],
                attributes: ['id', 'email', 'roleId', 'isActive', 'availabilityStatus', 'createdAt']
            });
            if (!user) {
                return responseHandler_1.ResponseHandler.error(res, 'User not found', 401);
            }
            if (!user.isActive) {
                return responseHandler_1.ResponseHandler.error(res, 'Account is deactivated', 401);
            }
            const newAccessToken = await jwt_1.JwtUtils.generateAccessToken(user);
            const newRefreshToken = await jwt_1.JwtUtils.generateRefreshToken(user);
            return responseHandler_1.ResponseHandler.success(res, {
                user: {
                    id: user.id,
                    email: user.email,
                    roleId: user.roleId,
                    role: user.Role?.name || '',
                    permissions: user.Role?.Permissions
                        ? user.Role.Permissions.map(p => `${p.module}:${p.action}`)
                        : [],
                    availabilityStatus: user.availabilityStatus,
                    createdAt: user.createdAt,
                },
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        }
        catch (error) {
            console.error('Refresh token error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Invalid refresh token', 401);
        }
    }
    static async getProfile(req, res) {
        try {
            return responseHandler_1.ResponseHandler.success(res, {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role,
                    permissions: req.user.permissions,
                    availabilityStatus: req.user.availabilityStatus,
                    createdAt: req.user.createdAt,
                },
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async getRoles(req, res) {
        try {
            const roles = await models_1.Role.findAll({
                where: { isActive: true },
                attributes: ['id', 'name', 'description'],
                order: [['name', 'ASC']]
            });
            return responseHandler_1.ResponseHandler.success(res, { roles });
        }
        catch (error) {
            console.error('Get roles error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async checkSystemStatus(req, res) {
        try {
            const totalUsers = await models_1.User.count();
            const hasUsers = totalUsers > 0;
            return responseHandler_1.ResponseHandler.success(res, {
                hasUsers,
                totalUsers,
                message: hasUsers ? 'System is initialized' : 'System needs initial admin setup'
            });
        }
        catch (error) {
            console.error('Check system status error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async isAdminRole(roleId) {
        const role = await models_1.Role.findByPk(roleId);
        return role?.name === 'admin';
    }
}
exports.AuthController = AuthController;

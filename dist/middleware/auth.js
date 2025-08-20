"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability = exports.hasPermission = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const models_1 = require("../models");
const responseHandler_1 = require("./responseHandler");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            responseHandler_1.ResponseHandler.error(res, 'Access token required', 401);
            return;
        }
        const token = authHeader.substring(7);
        const payload = jwt_1.JwtUtils.verifyAccessToken(token);
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
            responseHandler_1.ResponseHandler.error(res, 'User not found', 401);
            return;
        }
        if (!user.isActive) {
            responseHandler_1.ResponseHandler.error(res, 'User account is deactivated', 401);
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            role: user.Role?.name || '',
            permissions: user.Role?.Permissions
                ? user.Role.Permissions.map(p => `${p.module}:${p.action}`)
                : [],
            availabilityStatus: user.availabilityStatus,
            createdAt: user.createdAt
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        responseHandler_1.ResponseHandler.error(res, 'Invalid access token', 401);
    }
};
exports.authenticate = authenticate;
const hasPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                responseHandler_1.ResponseHandler.error(res, 'Authentication required', 401);
                return;
            }
            const userPermissions = req.user.permissions || [];
            const hasRequiredPermission = userPermissions.includes(requiredPermission);
            if (!hasRequiredPermission) {
                responseHandler_1.ResponseHandler.error(res, 'Insufficient permissions', 403);
                return;
            }
            next();
        }
        catch (error) {
            console.error('Permission check error:', error);
            responseHandler_1.ResponseHandler.error(res, 'Permission check failed', 500);
        }
    };
};
exports.hasPermission = hasPermission;
const checkAvailability = (req, res, next) => {
    try {
        if (!req.user) {
            responseHandler_1.ResponseHandler.error(res, 'Authentication required', 401);
            return;
        }
        const availabilityStatus = req.user.availabilityStatus;
        if (availabilityStatus === 'off-shift') {
            responseHandler_1.ResponseHandler.error(res, 'User is currently off-shift', 403);
            return;
        }
        next();
    }
    catch (error) {
        console.error('Availability check error:', error);
        responseHandler_1.ResponseHandler.error(res, 'Availability check failed', 500);
    }
};
exports.checkAvailability = checkAvailability;

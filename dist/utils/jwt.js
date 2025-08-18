"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
class JwtUtils {
    static async generateAccessToken(user) {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            throw new Error('JWT_ACCESS_SECRET is not defined');
        }
        const userWithPermissions = await models_1.User.findByPk(user.id, {
            include: [
                {
                    association: 'Role',
                    include: ['Permissions'],
                }
            ],
            attributes: ['id', 'email']
        });
        if (!userWithPermissions) {
            throw new Error('User not found');
        }
        const permissions = userWithPermissions.Role?.Permissions
            ? userWithPermissions.Role.Permissions.map((p) => `${p.module}:${p.action}`)
            : [];
        const payload = {
            userId: user.id,
            email: user.email,
            role: userWithPermissions.Role?.name || '',
            permissions
        };
        const options = {
            expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m')
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    static async generateRefreshToken(user) {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }
        const payload = {
            userId: user.id,
            email: user.email,
            role: '',
            permissions: []
        };
        const options = {
            expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d')
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    static verifyAccessToken(token) {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            throw new Error('JWT_ACCESS_SECRET is not defined');
        }
        try {
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
    static verifyRefreshToken(token) {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }
        try {
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
}
exports.JwtUtils = JwtUtils;

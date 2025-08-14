import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { JwtUtils } from '../utils/jwt';
import { ValidationUtils } from '../utils/validation';
import { ResponseHandler } from '../middleware/responseHandler';

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ResponseHandler.error(res, 'Email and password are required', 400);
      }

      if (!ValidationUtils.validateEmail(email)) {
        return ResponseHandler.error(res, 'Invalid email format', 400);
      }

      const passwordValidation = ValidationUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return ResponseHandler.error(res, passwordValidation.message, 400);
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseHandler.error(res, 'User already exists', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await User.create({
        email,
        password: hashedPassword,
      });

      const payload = { userId: user.id, email: user.email };
      const accessToken = JwtUtils.generateAccessToken(payload);
      const refreshToken = JwtUtils.generateRefreshToken(payload);

      return ResponseHandler.success(res, {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      }, 201);
    } catch (error) {
      console.error('Register error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ResponseHandler.error(res, 'Email and password are required', 400);
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return ResponseHandler.error(res, 'Invalid credentials', 401);
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return ResponseHandler.error(res, 'Invalid credentials', 401);
      }

      const payload = { userId: user.id, email: user.email };
      const accessToken = JwtUtils.generateAccessToken(payload);
      const refreshToken = JwtUtils.generateRefreshToken(payload);

      return ResponseHandler.success(res, {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ResponseHandler.error(res, 'Refresh token is required', 400);
      }

      const payload = JwtUtils.verifyRefreshToken(refreshToken);
      
      const user = await User.findByPk(payload.userId);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', 401);
      }

      const newPayload = { userId: user.id, email: user.email };
      const newAccessToken = JwtUtils.generateAccessToken(newPayload);
      const newRefreshToken = JwtUtils.generateRefreshToken(newPayload);

      return ResponseHandler.success(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return ResponseHandler.error(res, 'Invalid refresh token', 401);
    }
  }

  static async getProfile(req: any, res: Response): Promise<Response> {
    try {
      return ResponseHandler.success(res, {
        user: {
          id: req.user.id,
          email: req.user.email,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}
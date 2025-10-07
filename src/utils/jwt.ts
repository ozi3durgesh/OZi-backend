// utils/jwt.ts
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { User } from '../models';
import { UserAttributes } from '../types';

export class JwtUtils {
  static async generateAccessToken(user: any, currentFcId?: number, availableFcs?: number[], currentDcId?: number): Promise<string> {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    // Get user with role and permissions
    const userWithPermissions = await User.findByPk(user.id, {
      include: [
        {
          association: 'Role',
          include: ['Permissions'],
        }
      ],
      attributes: ['id', 'email', 'name', 'phone']
    });

    if (!userWithPermissions) {
      throw new Error('User not found');
    }

    const permissions = (userWithPermissions as any).Role?.Permissions 
      ? (userWithPermissions as any).Role.Permissions.map((p: any) => `${p.module}:${p.action}`)
      : [];

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: (userWithPermissions as any).Role?.name || '',
      permissions,
      currentFcId,
      currentDcId,
      availableFcs,
      name: (userWithPermissions as any).name,
      phone: (userWithPermissions as any).phone
    };

    const options: jwt.SignOptions = {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(payload, secret, options);
  }

  static async generateAccessTokenWithFC(user: any, currentFcId: number, availableFcs: number[]): Promise<string> {
    return this.generateAccessToken(user, currentFcId, availableFcs);
  }

  static async generateRefreshToken(user: any): Promise<string> {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: '',
      permissions: []
    };

    const options: jwt.SignOptions = {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(payload, secret, options);
  }

  static verifyAccessToken(token: string): JwtPayload {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    try {
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    try {
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
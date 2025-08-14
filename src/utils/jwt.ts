import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export class JwtUtils {
  static generateAccessToken(payload: JwtPayload): string {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    return jwt.sign(
      payload,
      secret,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } as any
    );
  }

  static generateRefreshToken(payload: JwtPayload): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    return jwt.sign(
      payload,
      secret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any
    );
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
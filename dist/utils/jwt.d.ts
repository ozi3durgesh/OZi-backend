import { JwtPayload } from '../types';
export declare class JwtUtils {
    static generateAccessToken(user: any): Promise<string>;
    static generateRefreshToken(user: any): Promise<string>;
    static verifyAccessToken(token: string): JwtPayload;
    static verifyRefreshToken(token: string): JwtPayload;
}

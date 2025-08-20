import { Request, Response } from 'express';
export declare class AuthController {
    static register(req: Request, res: Response): Promise<Response>;
    static login(req: Request, res: Response): Promise<Response>;
    static refreshToken(req: Request, res: Response): Promise<Response>;
    static getProfile(req: any, res: Response): Promise<Response>;
    static getRoles(req: Request, res: Response): Promise<Response>;
    static checkSystemStatus(req: Request, res: Response): Promise<Response>;
    static isAdminRole(roleId: number): Promise<boolean>;
}

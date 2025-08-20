import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        permissions: string[];
    };
}
export declare class UserController {
    static createUser(req: AuthRequest, res: Response): Promise<Response>;
    static updateUserStatus(req: AuthRequest, res: Response): Promise<Response>;
    static changeUserRole(req: AuthRequest, res: Response): Promise<Response>;
    static listUsers(req: AuthRequest, res: Response): Promise<Response>;
    static deactivateUser(req: AuthRequest, res: Response): Promise<Response>;
}
export {};

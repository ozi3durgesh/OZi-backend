import { Request, Response } from 'express';
export declare class PermissionController {
    static createPermission(req: Request, res: Response): Promise<Response>;
    static listPermissions(req: Request, res: Response): Promise<Response>;
}

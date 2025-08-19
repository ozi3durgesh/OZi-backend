import { Request, Response } from 'express';
export declare class RoleController {
    static createRole(req: Request, res: Response): Promise<Response>;
    static assignPermissions(req: Request, res: Response): Promise<Response>;
    static listRoles(req: Request, res: Response): Promise<Response>;
}

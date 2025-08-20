import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare class PickingController {
    static generateWaves(req: AuthRequest, res: Response): Promise<Response>;
    static assignWaves(req: AuthRequest, res: Response): Promise<Response>;
    static getAvailableWaves(req: AuthRequest, res: Response): Promise<Response>;
    static startPicking(req: AuthRequest, res: Response): Promise<Response>;
    static scanItem(req: AuthRequest, res: Response): Promise<Response>;
    static reportPartialPick(req: AuthRequest, res: Response): Promise<Response>;
    static completePicking(req: AuthRequest, res: Response): Promise<Response>;
    static getSlaStatus(req: AuthRequest, res: Response): Promise<Response>;
    static getExpiryAlerts(req: AuthRequest, res: Response): Promise<Response>;
    static getPicklistItems(req: AuthRequest, res: Response): Promise<Response>;
}
export {};

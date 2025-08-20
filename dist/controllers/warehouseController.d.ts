import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare class WarehouseController {
    static createWarehouse(req: AuthRequest, res: Response): Promise<void>;
    static getWarehouses(req: Request, res: Response): Promise<void>;
    static getWarehouseById(req: Request, res: Response): Promise<void>;
    static updateWarehouse(req: AuthRequest, res: Response): Promise<void>;
    static updateWarehouseStatus(req: AuthRequest, res: Response): Promise<void>;
    static deleteWarehouse(req: AuthRequest, res: Response): Promise<void>;
    static createZone(req: AuthRequest, res: Response): Promise<void>;
    static getWarehouseZones(req: Request, res: Response): Promise<void>;
    static updateZone(req: AuthRequest, res: Response): Promise<void>;
    static deleteZone(req: AuthRequest, res: Response): Promise<void>;
    static assignStaff(req: AuthRequest, res: Response): Promise<void>;
    static getWarehouseStaff(req: Request, res: Response): Promise<void>;
    static removeStaffAssignment(req: AuthRequest, res: Response): Promise<void>;
}

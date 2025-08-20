import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const hasPermission: (requiredPermission: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const checkAvailability: (req: Request, res: Response, next: NextFunction) => void;

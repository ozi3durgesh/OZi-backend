import { Request, Response, NextFunction } from 'express';
interface VersionCheckRequest extends Request {
    user?: any;
}
export declare const versionCheck: (req: VersionCheckRequest, res: Response, next: NextFunction) => void;
export {};

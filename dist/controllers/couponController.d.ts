import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
    };
}
export declare class CouponController {
    static applyCoupon(req: AuthRequest, res: Response): Promise<Response>;
    static validateCoupon(req: AuthRequest, res: Response): Promise<Response>;
    static incrementCouponUsage(couponId: number): Promise<void>;
}
export {};

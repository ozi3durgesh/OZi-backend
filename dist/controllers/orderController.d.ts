import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
    };
}
export declare class OrderController {
    private static validateCartItems;
    private static validateAndApplyCoupon;
    private static incrementCouponUsage;
    private static calculateOrderAmounts;
    private static validateUpdateData;
    static updateOrder(req: AuthRequest, res: Response): Promise<Response>;
    static placeOrder(req: AuthRequest, res: Response): Promise<Response>;
    static getOrderById(req: AuthRequest, res: Response): Promise<Response>;
    static getUserOrders(req: AuthRequest, res: Response): Promise<Response>;
}
export {};

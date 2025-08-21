import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        wallet_balance?: number;
    };
}
export declare class OrderController {
    private static validateCartItems;
    private static validateAndApplyCoupon;
    private static incrementCouponUsage;
    private static calculateDeliveryCharge;
    private static calculateTax;
    private static validateUpdateData;
    static updateOrder(req: AuthRequest, res: Response): Promise<Response>;
    static placeOrder(req: AuthRequest, res: Response): Promise<Response>;
    static getOrderById(req: AuthRequest, res: Response): Promise<Response>;
    static getUserOrders(req: AuthRequest, res: Response): Promise<Response>;
}
export {};

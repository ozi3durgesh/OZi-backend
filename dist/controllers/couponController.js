"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponController = void 0;
const Coupon_1 = __importDefault(require("../models/Coupon"));
const CouponTranslation_1 = __importDefault(require("../models/CouponTranslation"));
const responseHandler_1 = require("../middleware/responseHandler");
class CouponController {
    static async applyCoupon(req, res) {
        try {
            const { code, store_id } = req.body;
            if (!code) {
                return responseHandler_1.ResponseHandler.error(res, 'Coupon code is required', 400);
            }
            if (!store_id) {
                return responseHandler_1.ResponseHandler.error(res, 'Store ID is required', 400);
            }
            const storeIdInt = parseInt(store_id.toString());
            if (isNaN(storeIdInt)) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid store ID', 400);
            }
            const coupon = await Coupon_1.default.findOne({
                where: {
                    code: code.toString().trim(),
                    status: 1,
                },
                include: [{
                        model: CouponTranslation_1.default,
                        as: 'translations',
                        required: false,
                    }],
            });
            if (!coupon) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid coupon code', 404);
            }
            const currentDate = new Date().toISOString().split('T')[0];
            if (coupon.expire_date < currentDate) {
                return responseHandler_1.ResponseHandler.error(res, 'Coupon has expired', 400);
            }
            if (coupon.start_date > currentDate) {
                return responseHandler_1.ResponseHandler.error(res, 'Coupon is not yet active', 400);
            }
            if (coupon.coupon_type === 'store_wise') {
                let eligibleStores = [];
                try {
                    eligibleStores = JSON.parse(coupon.data || '[]');
                }
                catch (e) {
                    eligibleStores = [];
                }
                if (!eligibleStores.includes(storeIdInt)) {
                    return responseHandler_1.ResponseHandler.error(res, 'Coupon not applicable for this store', 400);
                }
            }
            if (coupon.limit > 0 && coupon.total_uses >= coupon.limit) {
                return responseHandler_1.ResponseHandler.error(res, 'Coupon usage limit exceeded', 400);
            }
            if (coupon.customer_id !== '["all"]') {
                let eligibleCustomers = [];
                try {
                    eligibleCustomers = JSON.parse(coupon.customer_id || '[]');
                }
                catch (e) {
                    eligibleCustomers = [];
                }
                if (eligibleCustomers.length > 0 && !eligibleCustomers.includes(req.user.id)) {
                    return responseHandler_1.ResponseHandler.error(res, 'Coupon not applicable for this customer', 400);
                }
            }
            return responseHandler_1.ResponseHandler.success(res, coupon.toJSON());
        }
        catch (error) {
            console.error('Apply coupon error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async validateCoupon(req, res) {
        try {
            const { code, store_id, order_amount } = req.body;
            if (!code || !store_id || !order_amount) {
                return responseHandler_1.ResponseHandler.error(res, 'Code, store_id, and order_amount are required', 400);
            }
            const storeIdInt = parseInt(store_id.toString());
            const orderAmountFloat = parseFloat(order_amount.toString());
            if (isNaN(storeIdInt) || isNaN(orderAmountFloat)) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid store_id or order_amount', 400);
            }
            const coupon = await Coupon_1.default.findOne({
                where: {
                    code: code.toString().trim(),
                    status: 1,
                },
                include: [{
                        model: CouponTranslation_1.default,
                        as: 'translations',
                        required: false,
                    }],
            });
            if (!coupon) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid coupon code', 404);
            }
            const currentDate = new Date().toISOString().split('T')[0];
            if (coupon.expire_date < currentDate) {
                return responseHandler_1.ResponseHandler.error(res, 'Coupon has expired', 400);
            }
            if (coupon.start_date > currentDate) {
                return responseHandler_1.ResponseHandler.error(res, 'Coupon is not yet active', 400);
            }
            if (orderAmountFloat < coupon.min_purchase) {
                return responseHandler_1.ResponseHandler.error(res, `Minimum purchase amount of ${coupon.min_purchase} required`, 400);
            }
            let discountAmount = 0;
            if (coupon.discount_type === 'percentage') {
                discountAmount = (orderAmountFloat * coupon.discount) / 100;
            }
            else {
                discountAmount = coupon.discount;
            }
            if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
                discountAmount = coupon.max_discount;
            }
            return responseHandler_1.ResponseHandler.success(res, {
                ...coupon.toJSON(),
                calculated_discount: discountAmount,
                applicable_amount: orderAmountFloat - discountAmount,
            });
        }
        catch (error) {
            console.error('Validate coupon error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async incrementCouponUsage(couponId) {
        try {
            await Coupon_1.default.increment('total_uses', {
                where: { id: couponId }
            });
        }
        catch (error) {
            console.error('Increment coupon usage error:', error);
        }
    }
}
exports.CouponController = CouponController;

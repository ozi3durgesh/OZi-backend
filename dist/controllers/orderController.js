"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const CouponTranslation_1 = __importDefault(require("../models/CouponTranslation"));
const responseHandler_1 = require("../middleware/responseHandler");
class OrderController {
    static validateCartItems(cart) {
        if (!Array.isArray(cart)) {
            return { isValid: false, message: 'Cart must be an array' };
        }
        if (cart.length === 0) {
            return { isValid: false, message: 'Cart cannot be empty. At least one item is required' };
        }
        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            if (!item.sku || typeof item.sku !== 'number') {
                return { isValid: false, message: `Cart item ${i + 1}: SKU is required and must be a number` };
            }
            if (!item.amount || typeof item.amount !== 'number' || item.amount <= 0) {
                return { isValid: false, message: `Cart item ${i + 1}: Amount is required and must be a positive number` };
            }
            if (!Number.isInteger(item.sku)) {
                return { isValid: false, message: `Cart item ${i + 1}: SKU must be an integer` };
            }
        }
        return { isValid: true };
    }
    static async validateAndApplyCoupon(couponCode, storeId, orderAmount, userId) {
        try {
            if (!couponCode || !couponCode.trim()) {
                return { isValid: false, discount: 0, message: 'Coupon code is required' };
            }
            const coupon = await Coupon_1.default.findOne({
                where: {
                    code: couponCode.trim(),
                    status: 1,
                },
                include: [{
                        model: CouponTranslation_1.default,
                        as: 'translations',
                        required: false,
                    }],
            });
            if (!coupon) {
                return { isValid: false, discount: 0, message: 'Invalid coupon code' };
            }
            const currentDate = new Date().toISOString().split('T')[0];
            if (coupon.expire_date < currentDate) {
                return { isValid: false, discount: 0, message: 'Coupon has expired' };
            }
            if (coupon.start_date > currentDate) {
                return { isValid: false, discount: 0, message: 'Coupon is not yet active' };
            }
            if (orderAmount < coupon.min_purchase) {
                return {
                    isValid: false,
                    discount: 0,
                    message: `Minimum purchase amount of ${coupon.min_purchase} required`
                };
            }
            if (coupon.coupon_type === 'store_wise') {
                let eligibleStores = [];
                try {
                    eligibleStores = JSON.parse(coupon.data || '[]');
                }
                catch (e) {
                    eligibleStores = [];
                }
                if (!eligibleStores.includes(storeId)) {
                    return { isValid: false, discount: 0, message: 'Coupon not applicable for this store' };
                }
            }
            if (coupon.limit > 0 && coupon.total_uses >= coupon.limit) {
                return { isValid: false, discount: 0, message: 'Coupon usage limit exceeded' };
            }
            if (coupon.customer_id !== '["all"]') {
                let eligibleCustomers = [];
                try {
                    eligibleCustomers = JSON.parse(coupon.customer_id || '[]');
                }
                catch (e) {
                    eligibleCustomers = [];
                }
                if (eligibleCustomers.length > 0 && !eligibleCustomers.includes(userId)) {
                    return { isValid: false, discount: 0, message: 'Coupon not applicable for this customer' };
                }
            }
            let discountAmount = 0;
            if (coupon.discount_type === 'percentage') {
                discountAmount = (orderAmount * coupon.discount) / 100;
            }
            else {
                discountAmount = coupon.discount;
            }
            if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
                discountAmount = coupon.max_discount;
            }
            return {
                isValid: true,
                discount: discountAmount,
                coupon,
                couponData: coupon.toJSON()
            };
        }
        catch (error) {
            console.error('Validate coupon error:', error);
            return { isValid: false, discount: 0, message: 'Error validating coupon' };
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
    static async calculateOrderAmounts(existingOrder, cart, updateData, userId) {
        const amounts = {
            order_amount: existingOrder.order_amount,
            discount_amount: existingOrder.discount_amount,
            tax_amount: existingOrder.tax_amount,
            coupon_discount_amount: existingOrder.coupon_discount_amount
        };
        let baseAmount = existingOrder.order_amount;
        if (cart) {
            baseAmount = cart.reduce((sum, item) => sum + item.amount, 0);
            amounts.order_amount = baseAmount;
            amounts.discount_amount = 0;
            amounts.tax_amount = 0;
            amounts.coupon_discount_amount = 0;
        }
        if (updateData.discount_amount !== undefined) {
            amounts.discount_amount = parseFloat(updateData.discount_amount.toString());
        }
        if (updateData.tax_amount !== undefined) {
            amounts.tax_amount = parseFloat(updateData.tax_amount.toString());
        }
        if (updateData.coupon_code) {
            const couponResult = await OrderController.validateAndApplyCoupon(updateData.coupon_code, updateData.store_id || existingOrder.store_id, baseAmount, userId);
            if (couponResult.isValid) {
                amounts.coupon_discount_amount = couponResult.discount;
                return {
                    ...amounts,
                    order_amount: baseAmount - amounts.discount_amount + amounts.tax_amount - amounts.coupon_discount_amount,
                    coupon_data: couponResult.couponData
                };
            }
            else {
                return {
                    ...amounts,
                    coupon_message: couponResult.message
                };
            }
        }
        else if (updateData.coupon_discount_amount !== undefined) {
            amounts.coupon_discount_amount = parseFloat(updateData.coupon_discount_amount.toString());
        }
        amounts.order_amount = baseAmount - amounts.discount_amount + amounts.tax_amount - amounts.coupon_discount_amount;
        if (updateData.order_amount !== undefined) {
            amounts.order_amount = parseFloat(updateData.order_amount.toString());
        }
        return amounts;
    }
    static validateUpdateData(updateData) {
        const cleanData = {};
        const errors = [];
        if (updateData.order_amount !== undefined) {
            const amount = parseFloat(updateData.order_amount.toString());
            if (isNaN(amount) || amount <= 0) {
                errors.push('Order amount must be a positive number');
            }
            else {
                cleanData.order_amount = amount;
            }
        }
        if (updateData.store_id !== undefined) {
            const storeId = parseInt(updateData.store_id.toString());
            if (isNaN(storeId) || storeId <= 0) {
                errors.push('Store ID must be a positive integer');
            }
            else {
                cleanData.store_id = storeId;
            }
        }
        if (updateData.coupon_code !== undefined) {
            if (typeof updateData.coupon_code === 'string') {
                cleanData.coupon_code = updateData.coupon_code.trim();
            }
            else {
                errors.push('Coupon code must be a string');
            }
        }
        const numericFields = [
            'coupon_discount_amount',
            'distance',
            'discount_amount',
            'tax_amount',
            'latitude',
            'longitude'
        ];
        for (const field of numericFields) {
            if (updateData[field] !== undefined) {
                const value = parseFloat(updateData[field].toString());
                if (isNaN(value) || value < 0) {
                    errors.push(`${field} must be a non-negative number`);
                }
                else {
                    cleanData[field] = value;
                }
            }
        }
        if (updateData.latitude !== undefined) {
            const lat = parseFloat(updateData.latitude.toString());
            if (lat < -90 || lat > 90) {
                errors.push('Latitude must be between -90 and 90');
            }
        }
        if (updateData.longitude !== undefined) {
            const lng = parseFloat(updateData.longitude.toString());
            if (lng < -180 || lng > 180) {
                errors.push('Longitude must be between -180 and 180');
            }
        }
        const integerFields = ['is_scheduled', 'scheduled_timestamp'];
        for (const field of integerFields) {
            if (updateData[field] !== undefined) {
                const value = parseInt(updateData[field].toString());
                if (isNaN(value)) {
                    errors.push(`${field} must be a valid integer`);
                }
                else {
                    cleanData[field] = value;
                }
            }
        }
        const stringFields = [
            'order_type',
            'payment_method',
            'address',
            'contact_person_name',
            'contact_person_number',
            'address_type',
            'promised_delv_tat'
        ];
        for (const field of stringFields) {
            if (updateData[field] !== undefined) {
                if (typeof updateData[field] !== 'string') {
                    errors.push(`${field} must be a string`);
                }
                else if (updateData[field].trim() === '' && field !== 'contact_person_name') {
                    errors.push(`${field} cannot be empty`);
                }
                else {
                    cleanData[field] = updateData[field].trim();
                }
            }
        }
        if (updateData.contact_person_number !== undefined) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(updateData.contact_person_number.replace(/\s+/g, ''))) {
                errors.push('Contact person number format is invalid');
            }
        }
        if (updateData.order_type !== undefined) {
            const validOrderTypes = ['delivery', 'pickup', 'dine_in'];
            if (!validOrderTypes.includes(updateData.order_type)) {
                errors.push('Order type must be one of: delivery, pickup, dine_in');
            }
        }
        if (updateData.payment_method !== undefined) {
            const validPaymentMethods = ['cash_on_delivery', 'card', 'upi', 'wallet'];
            if (!validPaymentMethods.includes(updateData.payment_method)) {
                errors.push('Payment method must be one of: cash_on_delivery, card, upi, wallet');
            }
        }
        if (errors.length > 0) {
            return { isValid: false, message: errors.join('. ') };
        }
        return { isValid: true, cleanData };
    }
    static async updateOrder(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id || isNaN(parseInt(id))) {
                return responseHandler_1.ResponseHandler.error(res, 'Valid order ID is required', 400);
            }
            const existingOrder = await Order_1.default.findOne({
                where: {
                    id: parseInt(id),
                    user_id: req.user.id,
                },
                raw: true
            });
            if (!existingOrder) {
                return responseHandler_1.ResponseHandler.error(res, 'Order not found', 404);
            }
            const validation = OrderController.validateUpdateData(updateData);
            if (!validation.isValid) {
                return responseHandler_1.ResponseHandler.error(res, validation.message, 400);
            }
            const updateFields = validation.cleanData;
            const currentTimestamp = Math.floor(Date.now() / 1000);
            let cart;
            if (updateData.cart !== undefined) {
                const cartValidation = OrderController.validateCartItems(updateData.cart);
                if (!cartValidation.isValid) {
                    return responseHandler_1.ResponseHandler.error(res, cartValidation.message, 400);
                }
                cart = updateData.cart;
                updateFields.cart = cart;
            }
            const amounts = await OrderController.calculateOrderAmounts(existingOrder, cart, updateData, req.user.id);
            if (amounts.coupon_message) {
                return responseHandler_1.ResponseHandler.error(res, amounts.coupon_message, 400);
            }
            updateFields.order_amount = amounts.order_amount;
            updateFields.discount_amount = amounts.discount_amount;
            updateFields.tax_amount = amounts.tax_amount;
            updateFields.coupon_discount_amount = amounts.coupon_discount_amount;
            if (updateFields.order_amount <= 0) {
                return responseHandler_1.ResponseHandler.error(res, 'Final order amount must be greater than 0', 400);
            }
            updateFields.updated_at = currentTimestamp;
            if (Object.keys(updateFields).length <= 1) {
                return responseHandler_1.ResponseHandler.error(res, 'No valid fields provided for update', 400);
            }
            const [affectedRows] = await Order_1.default.update(updateFields, {
                where: {
                    id: parseInt(id),
                    user_id: req.user.id,
                },
            });
            if (affectedRows === 0) {
                return responseHandler_1.ResponseHandler.error(res, 'Order not found or no changes made', 404);
            }
            const updatedOrder = await Order_1.default.findOne({
                where: {
                    id: parseInt(id),
                    user_id: req.user.id,
                },
                raw: true
            });
            const response = {
                order: updatedOrder,
                updated_fields: Object.keys(updateFields).filter(field => field !== 'updated_at')
            };
            if (amounts.coupon_data) {
                response.applied_coupon = {
                    ...amounts.coupon_data,
                    calculated_discount: amounts.coupon_discount_amount
                };
            }
            return responseHandler_1.ResponseHandler.success(res, response);
        }
        catch (error) {
            console.error('Update order error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async placeOrder(req, res) {
        try {
            const { cart, coupon_code, order_amount, order_type, payment_method, store_id, distance = 0.0, discount_amount = 0.0, tax_amount = 0.0, address, latitude = 0.0, longitude = 0.0, contact_person_name = '', contact_person_number, address_type = 'others', is_scheduled = 0, scheduled_timestamp, promised_delv_tat = '24' } = req.body;
            const cartValidation = OrderController.validateCartItems(cart);
            if (!cartValidation.isValid) {
                return responseHandler_1.ResponseHandler.error(res, cartValidation.message, 400);
            }
            if (!order_amount || order_amount <= 0) {
                return responseHandler_1.ResponseHandler.error(res, 'Order amount must be greater than 0', 400);
            }
            if (!order_type) {
                return responseHandler_1.ResponseHandler.error(res, 'Order type is required', 400);
            }
            if (!payment_method) {
                return responseHandler_1.ResponseHandler.error(res, 'Payment method is required', 400);
            }
            if (!store_id) {
                return responseHandler_1.ResponseHandler.error(res, 'Store ID is required', 400);
            }
            if (!address) {
                return responseHandler_1.ResponseHandler.error(res, 'Address is required', 400);
            }
            if (!contact_person_number) {
                return responseHandler_1.ResponseHandler.error(res, 'Contact person number is required', 400);
            }
            for (const item of cart) {
                if (!item.sku || !item.amount || item.amount <= 0) {
                    return responseHandler_1.ResponseHandler.error(res, 'Each cart item must have valid sku and amount', 400);
                }
            }
            let couponDiscountAmount = 0;
            let appliedCouponData = null;
            if (coupon_code) {
                const couponResult = await OrderController.validateAndApplyCoupon(coupon_code, parseInt(store_id.toString()), parseFloat(order_amount.toString()), req.user.id);
                if (!couponResult.isValid) {
                    return responseHandler_1.ResponseHandler.error(res, couponResult.message, 400);
                }
                couponDiscountAmount = couponResult.discount;
                appliedCouponData = couponResult.couponData;
            }
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const baseAmount = parseFloat(order_amount.toString());
            const finalOrderAmount = baseAmount + parseFloat(tax_amount.toString())
                - parseFloat(discount_amount.toString()) - couponDiscountAmount;
            if (finalOrderAmount <= 0) {
                return responseHandler_1.ResponseHandler.error(res, 'Final order amount must be greater than 0', 400);
            }
            const order = await Order_1.default.create({
                user_id: req.user.id,
                cart,
                coupon_discount_amount: couponDiscountAmount,
                order_amount: finalOrderAmount,
                order_type,
                payment_method,
                store_id: parseInt(store_id.toString()),
                distance: parseFloat(distance.toString()),
                discount_amount: parseFloat(discount_amount.toString()),
                tax_amount: parseFloat(tax_amount.toString()),
                address,
                latitude: parseFloat(latitude.toString()),
                longitude: parseFloat(longitude.toString()),
                contact_person_name,
                contact_person_number,
                address_type,
                is_scheduled: parseInt(is_scheduled.toString()),
                scheduled_timestamp: scheduled_timestamp || currentTimestamp,
                promised_delv_tat,
                created_at: currentTimestamp,
                updated_at: currentTimestamp,
            });
            if (appliedCouponData && appliedCouponData.id) {
                await OrderController.incrementCouponUsage(appliedCouponData.id);
            }
            const response = {
                order: {
                    id: order.id,
                    user_id: order.user_id,
                    cart: order.cart,
                    coupon_discount_amount: order.coupon_discount_amount,
                    order_amount: order.order_amount,
                    order_type: order.order_type,
                    payment_method: order.payment_method,
                    store_id: order.store_id,
                    distance: order.distance,
                    discount_amount: order.discount_amount,
                    tax_amount: order.tax_amount,
                    address: order.address,
                    latitude: order.latitude,
                    longitude: order.longitude,
                    contact_person_name: order.contact_person_name,
                    contact_person_number: order.contact_person_number,
                    address_type: order.address_type,
                    is_scheduled: order.is_scheduled,
                    scheduled_timestamp: order.scheduled_timestamp,
                    promised_delv_tat: order.promised_delv_tat,
                    created_at: order.created_at,
                }
            };
            if (appliedCouponData) {
                response.applied_coupon = {
                    ...appliedCouponData,
                    calculated_discount: couponDiscountAmount
                };
            }
            return responseHandler_1.ResponseHandler.success(res, response, 201);
        }
        catch (error) {
            console.error('Place order error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async getOrderById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(parseInt(id))) {
                return responseHandler_1.ResponseHandler.error(res, 'Valid order ID is required', 400);
            }
            const order = await Order_1.default.findOne({
                where: {
                    id: parseInt(id),
                    user_id: req.user.id,
                },
                raw: true
            });
            if (!order) {
                return responseHandler_1.ResponseHandler.error(res, 'Order not found', 404);
            }
            return responseHandler_1.ResponseHandler.success(res, {
                order
            });
        }
        catch (error) {
            console.error('Get order error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async getUserOrders(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
            const orders = await Order_1.default.findAll({
                where: {
                    user_id: req.user.id,
                },
                order: [['created_at', 'DESC']],
                limit: parseInt(limit.toString()),
                offset,
                raw: true
            });
            return responseHandler_1.ResponseHandler.success(res, {
                orders,
                pagination: {
                    page: parseInt(page.toString()),
                    limit: parseInt(limit.toString()),
                    total_orders: orders.length
                }
            });
        }
        catch (error) {
            console.error('Get user orders error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
}
exports.OrderController = OrderController;

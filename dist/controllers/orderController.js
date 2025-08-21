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
const database_1 = __importDefault(require("../config/database"));
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
    static calculateDeliveryCharge(distance, orderType, perKmCharge = 1.0, minCharge = 5.0, maxCharge = 50.0) {
        if (orderType === 'take_away') {
            return 0;
        }
        let deliveryCharge = Math.max(distance * perKmCharge, minCharge);
        if (maxCharge > minCharge && deliveryCharge > maxCharge) {
            deliveryCharge = maxCharge;
        }
        return deliveryCharge;
    }
    static calculateTax(amount, taxRate, taxIncluded = false) {
        if (taxIncluded) {
            return 0;
        }
        return (amount * taxRate) / 100;
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
            updateFields.order_amount = existingOrder.order_amount;
            updateFields.discount_amount = existingOrder.discount_amount;
            updateFields.tax_amount = existingOrder.tax_amount;
            updateFields.coupon_discount_amount = existingOrder.coupon_discount_amount;
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
            if (updateFields.coupon_discount_amount && updateFields.coupon_discount_amount > 0) {
                response.applied_coupon = {
                    calculated_discount: updateFields.coupon_discount_amount
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
        const transaction = await database_1.default.transaction();
        try {
            const orderData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return responseHandler_1.ResponseHandler.error(res, 'User authentication required', 401);
            }
            const requiredFields = ['cart', 'order_amount', 'payment_method', 'order_type', 'store_id'];
            for (const field of requiredFields) {
                if (!orderData[field]) {
                    return responseHandler_1.ResponseHandler.error(res, `${field} is required`, 400);
                }
            }
            const cartValidation = OrderController.validateCartItems(orderData.cart);
            if (!cartValidation.isValid) {
                return responseHandler_1.ResponseHandler.error(res, cartValidation.message, 400);
            }
            if (orderData.order_type === 'delivery' || orderData.order_type === 'parcel') {
                if (!orderData.distance || orderData.distance <= 0) {
                    return responseHandler_1.ResponseHandler.error(res, 'Distance is required for delivery/parcel orders', 400);
                }
                if (!orderData.address) {
                    return responseHandler_1.ResponseHandler.error(res, 'Address is required for delivery/parcel orders', 400);
                }
                if (!orderData.longitude || !orderData.latitude) {
                    return responseHandler_1.ResponseHandler.error(res, 'Longitude and latitude are required for delivery/parcel orders', 400);
                }
            }
            if (orderData.order_type === 'parcel') {
                if (!orderData.parcel_category_id) {
                    return responseHandler_1.ResponseHandler.error(res, 'Parcel category ID is required for parcel orders', 400);
                }
                if (!orderData.receiver_details) {
                    return responseHandler_1.ResponseHandler.error(res, 'Receiver details are required for parcel orders', 400);
                }
                if (!orderData.charge_payer) {
                    return responseHandler_1.ResponseHandler.error(res, 'Charge payer is required for parcel orders', 400);
                }
            }
            const validPaymentMethods = ['cash_on_delivery', 'digital_payment', 'wallet', 'offline_payment'];
            if (!validPaymentMethods.includes(orderData.payment_method)) {
                return responseHandler_1.ResponseHandler.error(res, 'Invalid payment method', 400);
            }
            if (orderData.payment_method === 'wallet') {
                const userWalletBalance = req.user?.wallet_balance || 0;
                if (userWalletBalance < orderData.order_amount) {
                    return responseHandler_1.ResponseHandler.error(res, 'Insufficient wallet balance', 400);
                }
            }
            let finalOrderAmount = orderData.order_amount;
            let couponDiscountAmount = orderData.coupon_discount_amount || 0;
            let discountAmount = orderData.discount_amount || 0;
            let taxAmount = orderData.tax_amount || 0;
            if (finalOrderAmount <= 0) {
                return responseHandler_1.ResponseHandler.error(res, 'Final order amount must be greater than 0', 400);
            }
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const order = await Order_1.default.create({
                user_id: userId,
                cart: orderData.cart,
                coupon_discount_amount: couponDiscountAmount,
                order_amount: finalOrderAmount,
                order_type: orderData.order_type,
                payment_method: orderData.payment_method,
                store_id: orderData.store_id,
                distance: orderData.distance || 0,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                address: orderData.address,
                latitude: orderData.latitude || 0,
                longitude: orderData.longitude || 0,
                contact_person_name: orderData.contact_person_name || '',
                contact_person_number: orderData.contact_person_number,
                address_type: orderData.address_type || 'others',
                is_scheduled: orderData.is_scheduled ? 1 : 0,
                scheduled_timestamp: orderData.scheduled_timestamp || currentTimestamp,
                promised_delv_tat: '24',
                created_at: currentTimestamp,
                updated_at: currentTimestamp,
                order_note: orderData.order_note,
                delivery_instruction: orderData.delivery_instruction,
                unavailable_item_note: orderData.unavailable_item_note,
                dm_tips: orderData.dm_tips || 0,
                cutlery: orderData.cutlery || 0,
                partial_payment: orderData.partial_payment || 0,
                is_buy_now: orderData.is_buy_now || 0,
                extra_packaging_amount: orderData.extra_packaging_amount || 0,
                create_new_user: orderData.create_new_user || 0,
                is_guest: 0,
                otp: Math.floor(1000 + Math.random() * 9000),
                zone_id: 1,
                module_id: 1,
                parcel_category_id: orderData.parcel_category_id,
                receiver_details: orderData.receiver_details,
                charge_payer: orderData.charge_payer,
                order_attachment: orderData.order_attachment,
                payment_status: 'unpaid',
                order_status: 'pending',
                transaction_reference: undefined,
                pending: currentTimestamp,
                tax_percentage: 10,
                total_tax_amount: taxAmount,
                original_delivery_charge: 0,
                tax_status: 'excluded',
                scheduled: orderData.is_scheduled ? 1 : 0,
                schedule_at: orderData.scheduled_timestamp || currentTimestamp,
            }, { transaction });
            await transaction.commit();
            const response = {
                message: 'Order placed successfully',
                order_id: order.id,
                total_ammount: order.order_amount,
                status: 'pending',
                created_at: (() => {
                    try {
                        if (order.created_at && typeof order.created_at === 'number' && order.created_at > 0) {
                            const date = new Date(order.created_at * 1000);
                            if (isNaN(date.getTime())) {
                                throw new Error('Invalid timestamp');
                            }
                            return date.toISOString().replace('T', ' ').substring(0, 19);
                        }
                        return new Date().toISOString().replace('T', ' ').substring(0, 19);
                    }
                    catch (error) {
                        console.error('Date conversion error:', error);
                        return new Date().toISOString().replace('T', ' ').substring(0, 19);
                    }
                })(),
                user_id: order.user_id
            };
            return responseHandler_1.ResponseHandler.success(res, response, 201);
        }
        catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
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

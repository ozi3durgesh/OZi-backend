"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PickingController = void 0;
const models_1 = require("../models");
const responseHandler_1 = require("../middleware/responseHandler");
class PickingController {
    static async generateWaves(req, res) {
        try {
            const { orderIds, priority = 'MEDIUM', routeOptimization = true, fefoRequired = false, tagsAndBags = false, maxOrdersPerWave = 20 } = req.body;
            if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
                return responseHandler_1.ResponseHandler.error(res, 'Order IDs array is required', 400);
            }
            const orders = await models_1.Order.findAll({
                where: { id: orderIds },
                attributes: ['id', 'order_amount', 'created_at', 'cart']
            });
            if (orders.length !== orderIds.length) {
                return responseHandler_1.ResponseHandler.error(res, 'Some orders not found', 404);
            }
            const waves = [];
            for (let i = 0; i < orders.length; i += maxOrdersPerWave) {
                const waveOrders = orders.slice(i, i + maxOrdersPerWave);
                const waveNumber = `W${Date.now()}-${Math.floor(i / maxOrdersPerWave) + 1}`;
                const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const wave = await models_1.PickingWave.create({
                    waveNumber,
                    status: 'GENERATED',
                    priority,
                    totalOrders: waveOrders.length,
                    totalItems: waveOrders.reduce((sum, order) => {
                        let cart = [];
                        if (order.cart) {
                            try {
                                cart = typeof order.cart === 'string' ? JSON.parse(order.cart) : order.cart;
                            }
                            catch (e) {
                                cart = [];
                            }
                        }
                        return sum + (Array.isArray(cart) ? cart.length : 0);
                    }, 0),
                    estimatedDuration: Math.ceil(waveOrders.length * 2),
                    slaDeadline,
                    routeOptimization,
                    fefoRequired,
                    tagsAndBags
                });
                for (const order of waveOrders) {
                    let cart = [];
                    if (order.cart) {
                        try {
                            cart = typeof order.cart === 'string' ? JSON.parse(order.cart) : order.cart;
                        }
                        catch (e) {
                            cart = [];
                        }
                    }
                    for (const item of cart) {
                        await models_1.PicklistItem.create({
                            waveId: wave.id,
                            orderId: order.id,
                            sku: item.sku || 'SKU001',
                            productName: item.productName || 'Product',
                            binLocation: item.binLocation || 'A1-B2-C3',
                            quantity: item.amount || 1,
                            scanSequence: Math.floor(Math.random() * 100) + 1,
                            fefoBatch: fefoRequired ? `BATCH-${Date.now()}` : undefined,
                            expiryDate: fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
                        });
                    }
                }
                waves.push(wave);
            }
            return responseHandler_1.ResponseHandler.success(res, {
                message: `Generated ${waves.length} picking waves`,
                waves: waves.map(wave => ({
                    id: wave.id,
                    waveNumber: wave.waveNumber,
                    status: wave.status,
                    totalOrders: wave.totalOrders,
                    totalItems: wave.totalItems,
                    estimatedDuration: wave.estimatedDuration,
                    slaDeadline: wave.slaDeadline
                }))
            }, 201);
        }
        catch (error) {
            console.error('Generate waves error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async assignWaves(req, res) {
        try {
            const { maxWavesPerPicker = 3 } = req.query;
            const availablePickers = await models_1.User.findAll({
                where: {
                    isActive: true,
                    availabilityStatus: 'available'
                },
                include: [{
                        association: 'Role',
                        include: ['Permissions']
                    }],
                attributes: ['id', 'email', 'availabilityStatus']
            });
            const pickers = availablePickers.filter(user => {
                const permissions = user.Role?.Permissions || [];
                return permissions.some((p) => p.module === 'picking' && ['view', 'assign_manage', 'execute'].includes(p.action));
            });
            if (pickers.length === 0) {
                return responseHandler_1.ResponseHandler.error(res, 'No available pickers found', 404);
            }
            const unassignedWaves = await models_1.PickingWave.findAll({
                where: { status: 'GENERATED' },
                order: [['priority', 'DESC'], ['slaDeadline', 'ASC']]
            });
            if (unassignedWaves.length === 0) {
                return responseHandler_1.ResponseHandler.success(res, { message: 'No unassigned waves found' });
            }
            const assignments = [];
            let pickerIndex = 0;
            for (const wave of unassignedWaves) {
                const picker = pickers[pickerIndex % pickers.length];
                const pickerWaves = await models_1.PickingWave.count({
                    where: { pickerId: picker.id, status: ['ASSIGNED', 'PICKING'] }
                });
                if (pickerWaves < parseInt(maxWavesPerPicker.toString())) {
                    await wave.update({
                        status: 'ASSIGNED',
                        pickerId: picker.id,
                        assignedAt: new Date()
                    });
                    assignments.push({
                        waveId: wave.id,
                        waveNumber: wave.waveNumber,
                        pickerId: picker.id,
                        pickerEmail: picker.email,
                        assignedAt: wave.assignedAt
                    });
                }
                pickerIndex++;
            }
            return responseHandler_1.ResponseHandler.success(res, {
                message: `Assigned ${assignments.length} waves to pickers`,
                assignments
            });
        }
        catch (error) {
            console.error('Assign waves error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async getAvailableWaves(req, res) {
        try {
            const { status, priority, page = 1, limit = 10 } = req.query;
            const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
            const whereClause = {};
            if (status)
                whereClause.status = status;
            if (priority)
                whereClause.priority = priority;
            const waves = await models_1.PickingWave.findAndCountAll({
                where: whereClause,
                order: [['priority', 'DESC'], ['slaDeadline', 'ASC']],
                limit: parseInt(limit.toString()),
                offset
            });
            return responseHandler_1.ResponseHandler.success(res, {
                waves: waves.rows,
                pagination: {
                    page: parseInt(page.toString()),
                    limit: parseInt(limit.toString()),
                    total: waves.count,
                    totalPages: Math.ceil(waves.count / parseInt(limit.toString()))
                }
            });
        }
        catch (error) {
            console.error('Get available waves error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async startPicking(req, res) {
        try {
            const { waveId } = req.params;
            const pickerId = req.user.id;
            const wave = await models_1.PickingWave.findByPk(waveId);
            if (!wave) {
                return responseHandler_1.ResponseHandler.error(res, 'Wave not found', 404);
            }
            if (wave.status !== 'ASSIGNED') {
                return responseHandler_1.ResponseHandler.error(res, 'Wave is not assigned to you', 400);
            }
            if (wave.pickerId !== pickerId) {
                return responseHandler_1.ResponseHandler.error(res, 'Wave is not assigned to you', 403);
            }
            await wave.update({
                status: 'PICKING',
                startedAt: new Date()
            });
            const picklistItems = await models_1.PicklistItem.findAll({
                where: { waveId },
                order: [['scanSequence', 'ASC']]
            });
            return responseHandler_1.ResponseHandler.success(res, {
                message: 'Picking started successfully',
                wave: {
                    id: wave.id,
                    waveNumber: wave.waveNumber,
                    status: wave.status,
                    totalItems: wave.totalItems,
                    estimatedDuration: wave.estimatedDuration
                },
                picklistItems: picklistItems.map(item => ({
                    id: item.id,
                    sku: item.sku,
                    productName: item.productName,
                    binLocation: item.binLocation,
                    quantity: item.quantity,
                    scanSequence: item.scanSequence,
                    fefoBatch: item.fefoBatch,
                    expiryDate: item.expiryDate
                }))
            });
        }
        catch (error) {
            console.error('Start picking error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async scanItem(req, res) {
        try {
            const { waveId } = req.params;
            const { sku, binLocation, quantity = 1 } = req.body;
            const pickerId = req.user.id;
            if (!sku || !binLocation) {
                return responseHandler_1.ResponseHandler.error(res, 'SKU and bin location are required', 400);
            }
            const picklistItem = await models_1.PicklistItem.findOne({
                where: {
                    waveId: parseInt(waveId),
                    sku,
                    binLocation,
                    status: ['PENDING', 'PICKING']
                }
            });
            if (!picklistItem) {
                return responseHandler_1.ResponseHandler.error(res, 'Item not found in picklist', 404);
            }
            const wave = await models_1.PickingWave.findByPk(waveId);
            if (!wave) {
                return responseHandler_1.ResponseHandler.error(res, 'Wave not found', 404);
            }
            if (wave.status !== 'PICKING') {
                return responseHandler_1.ResponseHandler.error(res, 'Wave is not in picking status', 400);
            }
            if (wave.pickerId !== pickerId) {
                return responseHandler_1.ResponseHandler.error(res, 'You are not assigned to this wave', 403);
            }
            const pickedQuantity = Math.min(quantity, picklistItem.quantity);
            const newStatus = pickedQuantity === picklistItem.quantity ? 'PICKED' : 'PARTIAL';
            await picklistItem.update({
                status: newStatus,
                pickedQuantity: pickedQuantity,
                pickedAt: new Date(),
                pickedBy: pickerId
            });
            const remainingItems = await models_1.PicklistItem.count({
                where: {
                    waveId: parseInt(waveId),
                    status: ['PENDING', 'PICKING']
                }
            });
            if (remainingItems === 0) {
                await wave.update({
                    status: 'COMPLETED',
                    completedAt: new Date()
                });
            }
            return responseHandler_1.ResponseHandler.success(res, {
                message: 'Item scanned successfully',
                item: {
                    id: picklistItem.id,
                    sku: picklistItem.sku,
                    productName: picklistItem.productName,
                    status: picklistItem.status,
                    pickedQuantity: picklistItem.pickedQuantity,
                    remainingQuantity: picklistItem.quantity - picklistItem.pickedQuantity
                },
                waveStatus: wave.status,
                remainingItems
            });
        }
        catch (error) {
            console.error('Scan item error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async reportPartialPick(req, res) {
        try {
            const { waveId } = req.params;
            const { sku, binLocation, reason, photo, notes, pickedQuantity = 0 } = req.body;
            const pickerId = req.user.id;
            if (!sku || !binLocation || !reason) {
                return responseHandler_1.ResponseHandler.error(res, 'SKU, bin location, and reason are required', 400);
            }
            const picklistItem = await models_1.PicklistItem.findOne({
                where: {
                    waveId: parseInt(waveId),
                    sku,
                    binLocation
                }
            });
            if (!picklistItem) {
                return responseHandler_1.ResponseHandler.error(res, 'Item not found in picklist', 404);
            }
            const wave = await models_1.PickingWave.findByPk(waveId);
            if (!wave) {
                return responseHandler_1.ResponseHandler.error(res, 'Wave not found', 404);
            }
            if (wave.status !== 'PICKING') {
                return responseHandler_1.ResponseHandler.error(res, 'Wave is not in picking status', 400);
            }
            await picklistItem.update({
                status: 'PARTIAL',
                pickedQuantity: pickedQuantity,
                partialReason: reason,
                partialPhoto: photo,
                notes,
                pickedAt: new Date(),
                pickedBy: pickerId
            });
            if (['OOS', 'DAMAGED', 'EXPIRY'].includes(reason)) {
                await models_1.PickingException.create({
                    waveId: parseInt(waveId),
                    orderId: picklistItem.orderId,
                    sku: picklistItem.sku,
                    exceptionType: reason,
                    severity: reason === 'EXPIRY' ? 'HIGH' : 'MEDIUM',
                    description: `Partial pick reported: ${reason}. ${notes || ''}`,
                    reportedBy: pickerId,
                    reportedAt: new Date(),
                    status: 'OPEN',
                    slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000)
                });
            }
            return responseHandler_1.ResponseHandler.success(res, {
                message: 'Partial pick reported successfully',
                item: {
                    id: picklistItem.id,
                    sku: picklistItem.sku,
                    status: picklistItem.status,
                    partialReason: picklistItem.partialReason,
                    pickedQuantity: picklistItem.pickedQuantity
                }
            });
        }
        catch (error) {
            console.error('Report partial pick error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async completePicking(req, res) {
        try {
            const { waveId } = req.params;
            const pickerId = req.user.id;
            const wave = await models_1.PickingWave.findByPk(waveId);
            if (!wave) {
                return responseHandler_1.ResponseHandler.error(res, 'Wave not found', 404);
            }
            if (wave.status !== 'PICKING') {
                return responseHandler_1.ResponseHandler.error(res, 'Wave is not in picking status', 400);
            }
            if (wave.pickerId !== pickerId) {
                return responseHandler_1.ResponseHandler.error(res, 'You are not assigned to this wave', 403);
            }
            const pendingItems = await models_1.PicklistItem.count({
                where: {
                    waveId: parseInt(waveId),
                    status: ['PENDING', 'PICKING']
                }
            });
            if (pendingItems > 0) {
                return responseHandler_1.ResponseHandler.error(res, `Cannot complete: ${pendingItems} items still pending`, 400);
            }
            await wave.update({
                status: 'COMPLETED',
                completedAt: new Date()
            });
            const totalItems = await models_1.PicklistItem.count({ where: { waveId: parseInt(waveId) } });
            const pickedItems = await models_1.PicklistItem.count({
                where: { waveId: parseInt(waveId), status: 'PICKED' }
            });
            const partialItems = await models_1.PicklistItem.count({
                where: { waveId: parseInt(waveId), status: 'PARTIAL' }
            });
            const accuracy = (pickedItems / totalItems) * 100;
            return responseHandler_1.ResponseHandler.success(res, {
                message: 'Picking completed successfully',
                wave: {
                    id: wave.id,
                    waveNumber: wave.waveNumber,
                    status: wave.status,
                    completedAt: wave.completedAt
                },
                metrics: {
                    totalItems,
                    pickedItems,
                    partialItems,
                    accuracy: Math.round(accuracy * 100) / 100
                }
            });
        }
        catch (error) {
            console.error('Complete picking error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async getSlaStatus(req, res) {
        try {
            const { waveId } = req.query;
            const whereClause = {};
            if (waveId)
                whereClause.id = parseInt(waveId.toString());
            const waves = await models_1.PickingWave.findAll({
                where: whereClause,
                order: [['slaDeadline', 'ASC']]
            });
            const now = new Date();
            const slaMetrics = {
                total: waves.length,
                onTime: 0,
                atRisk: 0,
                breached: 0,
                waves: []
            };
            for (const wave of waves) {
                const timeToDeadline = wave.slaDeadline.getTime() - now.getTime();
                const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);
                let status = 'onTime';
                if (hoursToDeadline < 0) {
                    status = 'breached';
                    slaMetrics.breached++;
                }
                else if (hoursToDeadline < 2) {
                    status = 'atRisk';
                    slaMetrics.atRisk++;
                }
                else {
                    slaMetrics.onTime++;
                }
                slaMetrics.waves.push({
                    id: wave.id,
                    waveNumber: wave.waveNumber,
                    status: wave.status,
                    priority: wave.priority,
                    slaDeadline: wave.slaDeadline,
                    slaStatus: status,
                    hoursToDeadline: Math.round(hoursToDeadline * 100) / 100,
                    picker: null
                });
            }
            return responseHandler_1.ResponseHandler.success(res, {
                slaMetrics,
                summary: {
                    onTimePercentage: Math.round((slaMetrics.onTime / slaMetrics.total) * 100),
                    atRiskPercentage: Math.round((slaMetrics.atRisk / slaMetrics.total) * 100),
                    breachedPercentage: Math.round((slaMetrics.breached / slaMetrics.total) * 100)
                }
            });
        }
        catch (error) {
            console.error('Get SLA status error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
    static async getExpiryAlerts(req, res) {
        try {
            const { daysThreshold = 7 } = req.query;
            const thresholdDate = new Date(Date.now() + parseInt(daysThreshold.toString()) * 24 * 60 * 60 * 1000);
            const expiringItems = await models_1.PicklistItem.findAll({
                where: {
                    expiryDate: {
                        [require('sequelize').Op.lte]: thresholdDate
                    },
                    status: ['PENDING', 'PICKING']
                },
                order: [['expiryDate', 'ASC']]
            });
            const alerts = expiringItems.map(item => ({
                id: item.id,
                sku: item.sku,
                productName: item.productName,
                expiryDate: item.expiryDate,
                daysUntilExpiry: Math.ceil((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                waveNumber: 'N/A',
                wavePriority: 'N/A',
                orderId: item.orderId,
                urgency: item.expiryDate.getTime() <= Date.now() ? 'EXPIRED' :
                    item.expiryDate.getTime() <= Date.now() + 24 * 60 * 60 * 1000 ? 'CRITICAL' :
                        item.expiryDate.getTime() <= Date.now() + 3 * 24 * 60 * 60 * 1000 ? 'HIGH' : 'MEDIUM'
            }));
            return responseHandler_1.ResponseHandler.success(res, {
                totalAlerts: alerts.length,
                alerts: alerts.sort((a, b) => {
                    const urgencyOrder = { 'EXPIRED': 0, 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                })
            });
        }
        catch (error) {
            console.error('Get expiry alerts error:', error);
            return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
        }
    }
}
exports.PickingController = PickingController;

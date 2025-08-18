"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoverController = void 0;
const models_1 = require("../models");
const lmsIntegration_1 = require("../utils/lmsIntegration");
class HandoverController {
    lmsIntegration;
    constructor() {
        const lmsConfig = {
            baseUrl: process.env.LMS_BASE_URL || 'https://lms.example.com/api',
            apiKey: process.env.LMS_API_KEY || '',
            timeout: parseInt(process.env.LMS_TIMEOUT || '30000'),
            retryAttempts: parseInt(process.env.LMS_RETRY_ATTEMPTS || '3'),
            retryDelay: parseInt(process.env.LMS_RETRY_DELAY || '1000'),
        };
        this.lmsIntegration = new lmsIntegration_1.LMSIntegration(lmsConfig);
    }
    async assignRider(req, res) {
        try {
            const { jobId, riderId, specialInstructions } = req.body;
            const userId = req.user?.userId;
            const packingJob = await models_1.PackingJob.findByPk(jobId);
            if (!packingJob) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Packing job not found'
                });
            }
            if (packingJob.status !== 'AWAITING_HANDOVER') {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Packing job is not ready for handover'
                });
            }
            const existingHandover = await models_1.Handover.findOne({ where: { jobId } });
            if (existingHandover) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Handover already exists for this job'
                });
            }
            const rider = await models_1.Rider.findByPk(riderId);
            if (!rider) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Rider not found'
                });
            }
            if (rider.availabilityStatus !== 'AVAILABLE') {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Rider is not available'
                });
            }
            const handover = await models_1.Handover.create({
                jobId,
                riderId,
                specialInstructions,
                status: 'ASSIGNED',
                assignedAt: new Date(),
            });
            await rider.update({
                availabilityStatus: 'BUSY',
                lastActiveAt: new Date(),
            });
            await models_1.PackingEvent.create({
                jobId,
                eventType: 'HANDOVER_ASSIGNED',
                eventData: { riderId, specialInstructions },
                userId,
                timestamp: new Date(),
            });
            await this.syncWithLMS(handover.id);
            return res.status(201).json({
                statusCode: 201,
                success: true,
                data: {
                    handoverId: handover.id,
                    message: 'Rider assigned successfully',
                    rider: {
                        id: rider.id,
                        name: rider.name,
                        phone: rider.phone,
                        vehicleType: rider.vehicleType,
                    }
                }
            });
        }
        catch (error) {
            console.error('Error assigning rider:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to assign rider'
            });
        }
    }
    async confirmHandover(req, res) {
        try {
            const { handoverId, riderId, confirmationCode } = req.body;
            const userId = req.user?.userId;
            const handover = await models_1.Handover.findByPk(handoverId, {
                include: [
                    { model: models_1.PackingJob, as: 'Job' },
                    { model: models_1.Rider, as: 'Rider' }
                ]
            });
            if (!handover) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Handover not found'
                });
            }
            if (handover.riderId !== riderId) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Rider ID mismatch'
                });
            }
            if (handover.status !== 'ASSIGNED') {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Handover is not in assigned status'
                });
            }
            await handover.update({
                status: 'CONFIRMED',
                confirmedAt: new Date(),
            });
            await models_1.PackingEvent.create({
                jobId: handover.jobId,
                eventType: 'HANDOVER_CONFIRMED',
                eventData: { handoverId, riderId, confirmationCode },
                userId,
                timestamp: new Date(),
            });
            await this.updateLMSStatus(handover.id, 'CONFIRMED');
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    message: 'Handover confirmed successfully',
                    handoverStatus: handover.status,
                    confirmedAt: handover.confirmedAt
                }
            });
        }
        catch (error) {
            console.error('Error confirming handover:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to confirm handover'
            });
        }
    }
    async updateHandoverStatus(req, res) {
        try {
            const { handoverId } = req.params;
            const { status, additionalData } = req.body;
            const userId = req.user?.userId;
            const handover = await models_1.Handover.findByPk(handoverId);
            if (!handover) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Handover not found'
                });
            }
            if (!this.isValidStatusTransition(handover.status, status)) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Invalid status transition'
                });
            }
            const updateData = { status };
            switch (status) {
                case 'IN_TRANSIT':
                    updateData.pickedUpAt = new Date();
                    break;
                case 'DELIVERED':
                    updateData.deliveredAt = new Date();
                    break;
                case 'CANCELLED':
                    updateData.cancellationBy = userId;
                    updateData.cancellationReason = additionalData?.reason;
                    break;
            }
            await handover.update(updateData);
            if (status === 'DELIVERED') {
                await models_1.PackingJob.update({ status: 'COMPLETED' }, { where: { id: handover.jobId } });
            }
            await models_1.PackingEvent.create({
                jobId: handover.jobId,
                eventType: 'HANDOVER_STATUS_UPDATED',
                eventData: { status, additionalData },
                userId,
                timestamp: new Date(),
            });
            await this.updateLMSStatus(handover.id, status);
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    message: 'Handover status updated successfully',
                    newStatus: status
                }
            });
        }
        catch (error) {
            console.error('Error updating handover status:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to update handover status'
            });
        }
    }
    async retryLMSSync(req, res) {
        try {
            const { handoverId } = req.params;
            const handover = await models_1.Handover.findByPk(handoverId);
            if (!handover) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Handover not found'
                });
            }
            if (handover.lmsSyncStatus === 'SYNCED') {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'LMS sync is already successful'
                });
            }
            const syncResult = await this.syncWithLMS(handover.id);
            if (syncResult.success) {
                return res.status(200).json({
                    statusCode: 200,
                    success: true,
                    data: {
                        message: 'LMS sync retry successful',
                        lmsStatus: 'SYNCED'
                    }
                });
            }
            else {
                return res.status(500).json({
                    statusCode: 500,
                    success: false,
                    error: `LMS sync retry failed: ${syncResult.error}`
                });
            }
        }
        catch (error) {
            console.error('Error retrying LMS sync:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to retry LMS sync'
            });
        }
    }
    async getHandoverDetails(req, res) {
        try {
            const { handoverId } = req.params;
            const handover = await models_1.Handover.findByPk(handoverId, {
                include: [
                    { model: models_1.PackingJob, as: 'Job' },
                    { model: models_1.Rider, as: 'Rider' },
                    { model: models_1.User, as: 'CancelledBy' },
                    { model: models_1.LMSShipment, as: 'LMSShipments' },
                ]
            });
            if (!handover) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Handover not found'
                });
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: handover
            });
        }
        catch (error) {
            console.error('Error getting handover details:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to get handover details'
            });
        }
    }
    async getAvailableRiders(req, res) {
        try {
            const riders = await models_1.Rider.findAll({
                where: {
                    availabilityStatus: 'AVAILABLE',
                    isActive: true,
                },
                order: [['rating', 'DESC'], ['totalDeliveries', 'ASC']],
            });
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: riders
            });
        }
        catch (error) {
            console.error('Error getting available riders:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to get available riders'
            });
        }
    }
    async getLMSSyncStatus(req, res) {
        try {
            const handovers = await models_1.Handover.findAll({
                where: {
                    lmsSyncStatus: { [require('sequelize').Op.ne]: 'SYNCED' }
                },
                include: [
                    { model: models_1.PackingJob, as: 'Job' },
                    { model: models_1.Rider, as: 'Rider' },
                ],
                order: [['lmsLastSyncAt', 'ASC']],
            });
            const syncStatus = {
                totalFailed: handovers.length,
                retryQueue: handovers.filter(h => h.lmsSyncStatus === 'RETRY').length,
                failed: handovers.filter(h => h.lmsSyncStatus === 'FAILED').length,
                handovers: handovers.map(h => ({
                    id: h.id,
                    jobId: h.jobId,
                    status: h.status,
                    lmsSyncStatus: h.lmsSyncStatus,
                    lmsSyncAttempts: h.lmsSyncAttempts,
                    lmsLastSyncAt: h.lmsLastSyncAt,
                    lmsErrorMessage: h.lmsErrorMessage,
                })),
            };
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: syncStatus
            });
        }
        catch (error) {
            console.error('Error getting LMS sync status:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to get LMS sync status'
            });
        }
    }
    async syncWithLMS(handoverId) {
        try {
            const handover = await models_1.Handover.findByPk(handoverId, {
                include: [
                    { model: models_1.PackingJob, as: 'Job' },
                    { model: models_1.Rider, as: 'Rider' },
                ]
            });
            if (!handover || !handover.Job || !handover.Rider) {
                return { success: false, error: 'Invalid handover data' };
            }
            const shipmentData = {
                trackingNumber: `TRK-${handover.id}-${Date.now()}`,
                manifestNumber: `MF-${handover.id}-${Date.now()}`,
                origin: 'Warehouse',
                destination: 'Customer',
                items: [],
                specialInstructions: handover.specialInstructions,
                expectedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
            };
            const lmsResponse = await this.lmsIntegration.createShipment(shipmentData);
            if (lmsResponse.success) {
                await handover.update({
                    lmsSyncStatus: 'SYNCED',
                    lmsLastSyncAt: new Date(),
                    trackingNumber: shipmentData.trackingNumber,
                    manifestNumber: shipmentData.manifestNumber,
                });
                await models_1.LMSShipment.create({
                    handoverId: handover.id,
                    lmsReference: lmsResponse.lmsReference || '',
                    status: 'CREATED',
                    lmsResponse: lmsResponse.data,
                    retryCount: 0,
                });
                return { success: true };
            }
            else {
                await handover.update({
                    lmsSyncStatus: 'FAILED',
                    lmsLastSyncAt: new Date(),
                    lmsErrorMessage: lmsResponse.error,
                    lmsSyncAttempts: handover.lmsSyncAttempts + 1,
                });
                return { success: false, error: lmsResponse.error };
            }
        }
        catch (error) {
            console.error('LMS sync error:', error);
            const existingHandover = await models_1.Handover.findByPk(handoverId);
            if (existingHandover) {
                await existingHandover.update({
                    lmsSyncStatus: 'FAILED',
                    lmsLastSyncAt: new Date(),
                    lmsErrorMessage: error instanceof Error ? error.message : 'Unknown error',
                    lmsSyncAttempts: existingHandover.lmsSyncAttempts + 1,
                });
            }
            return { success: false, error: 'LMS sync failed' };
        }
    }
    async updateLMSStatus(handoverId, status) {
        try {
            const handover = await models_1.Handover.findByPk(handoverId);
            if (!handover || !handover.trackingNumber) {
                return;
            }
            await this.lmsIntegration.updateShipmentStatus(handover.trackingNumber, status);
        }
        catch (error) {
            console.error('Error updating LMS status:', error);
        }
    }
    isValidStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            'ASSIGNED': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['IN_TRANSIT', 'CANCELLED'],
            'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': [],
            'CANCELLED': [],
        };
        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }
}
exports.HandoverController = HandoverController;

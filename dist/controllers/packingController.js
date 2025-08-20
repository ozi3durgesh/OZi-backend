"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackingController = void 0;
const models_1 = require("../models");
const photoProcessor_1 = require("../utils/photoProcessor");
const sequelize_1 = require("sequelize");
class PackingController {
    photoProcessor;
    constructor() {
        const s3Config = {
            bucket: process.env.S3_BUCKET || 'ozi-packing-photos',
            region: process.env.S3_REGION || 'us-east-1',
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        };
        this.photoProcessor = new photoProcessor_1.PhotoProcessor(s3Config);
    }
    async startPacking(req, res) {
        try {
            const { waveId, packerId, priority, workflowType, specialInstructions } = req.body;
            const userId = req.user?.userId;
            const pickingWave = await models_1.PickingWave.findByPk(waveId, {
                include: [{ model: models_1.PicklistItem, as: 'PicklistItems' }]
            });
            if (!pickingWave) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Picking wave not found'
                });
            }
            if (pickingWave.status !== 'COMPLETED') {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Picking wave must be completed before starting packing'
                });
            }
            const existingJob = await models_1.PackingJob.findOne({ where: { waveId } });
            if (existingJob) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Packing job already exists for this wave'
                });
            }
            const slaDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const packingJob = await models_1.PackingJob.create({
                jobNumber: this.generateJobNumber(),
                waveId,
                packerId,
                priority: priority || 'MEDIUM',
                workflowType: workflowType || 'DEDICATED_PACKER',
                specialInstructions,
                totalItems: pickingWave.PicklistItems?.length || 0,
                slaDeadline,
                estimatedDuration: this.calculateEstimatedDuration(pickingWave.PicklistItems?.length || 0),
            });
            if (pickingWave.PicklistItems) {
                const packingItems = pickingWave.PicklistItems.map(item => ({
                    jobId: packingJob.id,
                    orderId: item.orderId,
                    sku: item.sku || 'UNKNOWN',
                    quantity: item.quantity || 0,
                    pickedQuantity: item.pickedQuantity || 0,
                }));
                await models_1.PackingItem.bulkCreate(packingItems);
            }
            await models_1.PackingEvent.create({
                jobId: packingJob.id,
                eventType: 'PACKING_STARTED',
                eventData: { waveId, packerId, priority, workflowType },
                userId,
                timestamp: new Date(),
            });
            if (workflowType === 'PICKER_PACKS' && packerId) {
                await models_1.PickingWave.update({ status: 'PACKING' }, { where: { id: waveId } });
            }
            return res.status(201).json({
                statusCode: 201,
                success: true,
                data: {
                    jobId: packingJob.id,
                    jobNumber: packingJob.jobNumber,
                    message: 'Packing job started successfully'
                }
            });
        }
        catch (error) {
            console.error('Error starting packing job:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to start packing job'
            });
        }
    }
    async verifyItem(req, res) {
        try {
            const { jobId, orderId, sku, packedQuantity, verificationNotes } = req.body;
            const userId = req.user?.userId;
            const packingItem = await models_1.PackingItem.findOne({
                where: { jobId, orderId, sku }
            });
            if (!packingItem) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Packing item not found'
                });
            }
            if (packedQuantity > packingItem.pickedQuantity) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Packed quantity cannot exceed picked quantity'
                });
            }
            await packingItem.update({
                packedQuantity,
                verifiedQuantity: packedQuantity,
                status: packedQuantity === packingItem.quantity ? 'COMPLETED' : 'VERIFIED',
                verificationNotes,
            });
            await this.updateJobProgress(jobId);
            await models_1.PackingEvent.create({
                jobId,
                eventType: 'ITEM_VERIFIED',
                eventData: { orderId, sku, packedQuantity, verificationNotes },
                userId,
                timestamp: new Date(),
            });
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    message: 'Item verified successfully',
                    itemStatus: packingItem.status
                }
            });
        }
        catch (error) {
            console.error('Error verifying item:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to verify item'
            });
        }
    }
    async completePacking(req, res) {
        try {
            const { jobId, photos, seals } = req.body;
            const userId = req.user?.userId;
            const packingJob = await models_1.PackingJob.findByPk(jobId, {
                include: [{ model: models_1.PackingItem, as: 'PackingItems' }]
            });
            if (!packingJob) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Packing job not found'
                });
            }
            if (packingJob.status === 'COMPLETED') {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Packing job is already completed'
                });
            }
            const incompleteItems = packingJob.PackingItems?.filter(item => item.status !== 'COMPLETED');
            if (incompleteItems && incompleteItems.length > 0) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: `Cannot complete packing: ${incompleteItems.length} items are not completed`
                });
            }
            if (photos && photos.length > 0) {
                for (const photo of photos) {
                    await models_1.PhotoEvidence.create({
                        jobId,
                        orderId: photo.orderId,
                        photoType: photo.photoType,
                        photoUrl: photo.photoUrl,
                        thumbnailUrl: photo.thumbnailUrl,
                        metadata: {
                            timestamp: new Date(),
                            location: photo.metadata?.location,
                            device: photo.metadata?.device,
                            coordinates: photo.metadata?.coordinates,
                        },
                    });
                }
            }
            if (seals && seals.length > 0) {
                for (const seal of seals) {
                    await models_1.Seal.create({
                        sealNumber: seal.sealNumber,
                        jobId,
                        orderId: seal.orderId,
                        sealType: seal.sealType,
                        appliedAt: new Date(),
                        appliedBy: userId,
                    });
                }
            }
            await packingJob.update({
                status: 'AWAITING_HANDOVER',
                completedAt: new Date(),
                packedItems: packingJob.totalItems,
                verifiedItems: packingJob.totalItems,
            });
            await models_1.PackingEvent.create({
                jobId,
                eventType: 'PACKING_COMPLETED',
                eventData: { photosCount: photos?.length || 0, sealsCount: seals?.length || 0 },
                userId,
                timestamp: new Date(),
            });
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    message: 'Packing completed successfully',
                    jobStatus: packingJob.status
                }
            });
        }
        catch (error) {
            console.error('Error completing packing:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to complete packing'
            });
        }
    }
    async getJobStatus(req, res) {
        try {
            const { jobId } = req.params;
            const packingJob = await models_1.PackingJob.findByPk(jobId, {
                include: [
                    { model: models_1.PackingItem, as: 'PackingItems' },
                    { model: models_1.User, as: 'Packer' },
                    { model: models_1.PhotoEvidence, as: 'PhotoEvidence' },
                    { model: models_1.Seal, as: 'Seals' },
                ]
            });
            if (!packingJob) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Packing job not found'
                });
            }
            const progress = {
                totalItems: packingJob.totalItems,
                packedItems: packingJob.packedItems,
                verifiedItems: packingJob.verifiedItems,
                percentage: Math.round((packingJob.packedItems / packingJob.totalItems) * 100),
            };
            const sla = {
                deadline: packingJob.slaDeadline,
                remaining: Math.max(0, Math.round((packingJob.slaDeadline.getTime() - Date.now()) / (1000 * 60))),
                status: this.calculateSLAStatus(packingJob.slaDeadline),
            };
            const status = {
                id: packingJob.id,
                jobNumber: packingJob.jobNumber,
                status: packingJob.status,
                progress,
                sla,
                assignedPacker: packingJob.Packer ? {
                    id: packingJob.Packer.id,
                    name: packingJob.Packer.email,
                } : undefined,
            };
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: status
            });
        }
        catch (error) {
            console.error('Error getting job status:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to get job status'
            });
        }
    }
    async getJobsAwaitingHandover(req, res) {
        try {
            const jobs = await models_1.PackingJob.findAll({
                where: { status: 'AWAITING_HANDOVER' },
                include: [
                    { model: models_1.User, as: 'Packer' },
                    { model: models_1.PickingWave, as: 'Wave' },
                ],
                order: [['priority', 'DESC'], ['completedAt', 'ASC']],
            });
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: jobs
            });
        }
        catch (error) {
            console.error('Error getting jobs awaiting handover:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to get jobs awaiting handover'
            });
        }
    }
    async getSLAStatus(req, res) {
        try {
            const now = new Date();
            const jobs = await models_1.PackingJob.findAll({
                where: {
                    status: { [sequelize_1.Op.notIn]: ['COMPLETED', 'CANCELLED'] },
                    slaDeadline: { [sequelize_1.Op.gt]: now }
                }
            });
            let onTrack = 0;
            let atRisk = 0;
            let breached = 0;
            let totalRemaining = 0;
            let criticalJobs = 0;
            jobs.forEach(job => {
                const remaining = Math.round((job.slaDeadline.getTime() - now.getTime()) / (1000 * 60));
                totalRemaining += remaining;
                if (remaining <= 0) {
                    breached++;
                }
                else if (remaining <= 30) {
                    atRisk++;
                    if (remaining <= 15) {
                        criticalJobs++;
                    }
                }
                else {
                    onTrack++;
                }
            });
            const slaStatus = {
                totalJobs: jobs.length,
                onTrack,
                atRisk,
                breached,
                averageRemainingTime: jobs.length > 0 ? Math.round(totalRemaining / jobs.length) : 0,
                criticalJobs,
            };
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: slaStatus
            });
        }
        catch (error) {
            console.error('Error getting SLA status:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to get SLA status'
            });
        }
    }
    async reassignJob(req, res) {
        try {
            const { jobId } = req.params;
            const { newPackerId, reason } = req.body;
            const userId = req.user?.userId;
            const jobIdNum = parseInt(jobId);
            if (isNaN(jobIdNum)) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Invalid job ID'
                });
            }
            const packingJob = await models_1.PackingJob.findByPk(jobIdNum);
            if (!packingJob) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    error: 'Packing job not found'
                });
            }
            if (packingJob.status === 'COMPLETED') {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    error: 'Cannot reassign completed job'
                });
            }
            const oldPackerId = packingJob.packerId;
            await packingJob.update({
                packerId: newPackerId,
                assignedAt: new Date(),
            });
            await models_1.PackingEvent.create({
                jobId: jobIdNum,
                eventType: 'PACKING_STARTED',
                eventData: {
                    oldPackerId,
                    newPackerId,
                    reason,
                    reassignedBy: userId
                },
                userId,
                timestamp: new Date(),
            });
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    message: 'Job reassigned successfully',
                    newPackerId
                }
            });
        }
        catch (error) {
            console.error('Error reassigning job:', error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Failed to reassign job'
            });
        }
    }
    generateJobNumber() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `PKG-${timestamp}-${random}`.toUpperCase();
    }
    calculateEstimatedDuration(itemCount) {
        return Math.max(5, 5 + (itemCount * 2));
    }
    async updateJobProgress(jobId) {
        const packingItems = await models_1.PackingItem.findAll({ where: { jobId } });
        const packedItems = packingItems.filter(item => item.status === 'VERIFIED' || item.status === 'COMPLETED').length;
        const verifiedItems = packingItems.filter(item => item.status === 'COMPLETED').length;
        await models_1.PackingJob.update({ packedItems, verifiedItems }, { where: { id: jobId } });
    }
    calculateSLAStatus(deadline) {
        const now = new Date();
        const remaining = deadline.getTime() - now.getTime();
        const remainingMinutes = Math.round(remaining / (1000 * 60));
        if (remainingMinutes <= 0) {
            return 'BREACHED';
        }
        else if (remainingMinutes <= 30) {
            return 'AT_RISK';
        }
        else {
            return 'ON_TRACK';
        }
    }
}
exports.PackingController = PackingController;

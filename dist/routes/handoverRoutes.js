"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/assign-rider', (req, res) => {
    try {
        const { jobId, riderId, specialInstructions } = req.body;
        if (!jobId || !riderId) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                error: 'jobId and riderId are required'
            });
        }
        return res.status(201).json({
            statusCode: 201,
            success: true,
            data: {
                handoverId: 1,
                message: 'Rider assigned successfully (TEST MODE)',
                jobId,
                riderId,
                specialInstructions,
                rider: {
                    id: riderId,
                    name: 'Test Rider',
                    phone: '+1234567890',
                    vehicleType: 'BIKE',
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
});
router.post('/confirm', (req, res) => {
    try {
        const { handoverId, riderId } = req.body;
        if (!handoverId || !riderId) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                error: 'handoverId and riderId are required'
            });
        }
        return res.status(200).json({
            statusCode: 200,
            success: true,
            data: {
                message: 'Handover confirmed successfully (TEST MODE)',
                handoverId,
                riderId,
                handoverStatus: 'CONFIRMED',
                confirmedAt: new Date()
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
});
router.put('/:handoverId/status', (req, res) => {
    try {
        const { handoverId } = req.params;
        const { status, additionalData } = req.body;
        if (!status) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                error: 'status is required'
            });
        }
        return res.status(200).json({
            statusCode: 200,
            success: true,
            data: {
                message: 'Handover status updated successfully (TEST MODE)',
                handoverId,
                status,
                additionalData,
                updatedAt: new Date()
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
});
router.get('/riders/available', (req, res) => {
    try {
        res.status(200).json({
            statusCode: 200,
            success: true,
            data: [
                {
                    id: 1,
                    riderCode: 'R001',
                    name: 'John Doe',
                    phone: '+1234567890',
                    email: 'john.doe@example.com',
                    vehicleType: 'BIKE',
                    availabilityStatus: 'AVAILABLE',
                    rating: 4.8,
                    totalDeliveries: 150,
                    isActive: true,
                },
                {
                    id: 2,
                    riderCode: 'R002',
                    name: 'Jane Smith',
                    phone: '+1234567891',
                    email: 'jane.smith@example.com',
                    vehicleType: 'SCOOTER',
                    availabilityStatus: 'AVAILABLE',
                    rating: 4.9,
                    totalDeliveries: 200,
                    isActive: true,
                }
            ]
        });
    }
    catch (error) {
        console.error('Error getting available riders:', error);
        res.status(500).json({
            statusCode: 500,
            success: false,
            error: 'Failed to get available riders'
        });
    }
});
router.get('/lms/sync-status', (req, res) => {
    try {
        res.status(200).json({
            statusCode: 200,
            success: true,
            data: {
                totalFailed: 0,
                retryQueue: 0,
                failed: 0,
                handovers: []
            }
        });
    }
    catch (error) {
        console.error('Error getting LMS sync status:', error);
        res.status(500).json({
            statusCode: 500,
            success: false,
            error: 'Failed to get LMS sync status'
        });
    }
});
exports.default = router;

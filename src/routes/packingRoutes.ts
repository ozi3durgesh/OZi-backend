// routes/packingRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route POST /api/packing/start
 * @desc Start a new packing job from completed picking wave
 * @access Packer, Manager
 */
router.post('/start', (req, res) => {
  try {
    const { waveId, packerId, priority, workflowType, specialInstructions } = req.body;
    
    // Simple validation
    if (!waveId) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: 'waveId is required'
      });
    }

    // Mock response for testing
    return res.status(201).json({
      statusCode: 201,
      success: true,
      data: {
        jobId: 1,
        jobNumber: `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        message: 'Packing job started successfully (TEST MODE)',
        waveId,
        packerId,
        priority,
        workflowType,
        specialInstructions
      }
    });
  } catch (error) {
    console.error('Error starting packing job:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to start packing job'
    });
  }
});

/**
 * @route POST /api/packing/verify
 * @desc Verify an item during packing process
 * @access Packer, Manager
 */
router.post('/verify', (req, res) => {
  try {
    const { jobId, orderId, sku, packedQuantity, verificationNotes } = req.body;
    
    if (!jobId || !orderId || !sku || packedQuantity === undefined) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: 'jobId, orderId, sku, and packedQuantity are required'
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        message: 'Item verified successfully (TEST MODE)',
        jobId,
        orderId,
        sku,
        packedQuantity,
        verificationNotes,
        itemStatus: 'VERIFIED'
      }
    });
  } catch (error) {
    console.error('Error verifying item:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to verify item'
    });
  }
});

/**
 * @route POST /api/packing/complete
 * @desc Complete packing job with photos and seals
 * @access Packer, Manager
 */
router.post('/complete', (req, res) => {
  try {
    const { jobId, photos, seals } = req.body;
    
    if (!jobId) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: 'jobId is required'
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        message: 'Packing job completed successfully (TEST MODE)',
        jobId,
        photos,
        seals,
        completedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error completing packing job:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to complete packing job'
    });
  }
});

/**
 * @route GET /api/packing/status/:jobId
 * @desc Get packing job status
 * @access Packer, Manager
 */
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    
    res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        id: parseInt(jobId),
        jobNumber: `PKG-${jobId}-TEST`,
        status: 'PENDING',
        progress: {
          totalItems: 15,
          packedItems: 0,
          verifiedItems: 0,
          percentage: 0,
        },
        sla: {
          deadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
          remaining: 120,
          status: 'ON_TRACK',
        },
        assignedPacker: {
          id: 2,
          name: 'test@example.com',
        },
      }
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to get job status'
    });
  }
});

/**
 * @route GET /api/packing/awaiting-handover
 * @desc Get jobs awaiting handover
 * @access Manager
 */
router.get('/awaiting-handover', (req, res) => {
  try {
    res.status(200).json({
      statusCode: 200,
      success: true,
      data: [
        {
          id: 1,
          jobNumber: 'PKG-1-TEST',
          status: 'AWAITING_HANDOVER',
          priority: 'HIGH',
          createdAt: new Date(),
        }
      ]
    });
  } catch (error) {
    console.error('Error getting jobs awaiting handover:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to get jobs awaiting handover'
    });
  }
});

/**
 * @route GET /api/packing/sla-status
 * @desc Get SLA status for all jobs
 * @access Manager
 */
router.get('/sla-status', (req, res) => {
  try {
    res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        totalJobs: 1,
        onTrack: 1,
        atRisk: 0,
        breached: 0,
        averageRemainingTime: 120,
        criticalJobs: 0,
      }
    });
  } catch (error) {
    console.error('Error getting SLA status:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to get SLA status'
    });
  }
});

export default router;

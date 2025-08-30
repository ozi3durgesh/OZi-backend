// routes/packingRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PackingController } from '../controllers/packingController';
import Wave from '../models/wave';
import PickingWave from '../models/PickingWave';
import Rider from '../models/Rider';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// ---- Multer setup for file uploads ----
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route POST /api/packing/start
 */
router.post('/start', (req, res) => {
  try {
    const { waveId, packerId, priority, workflowType, specialInstructions } = req.body;
    
    if (!waveId) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: 'waveId is required'
      });
    }

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
 * @route POST /api/packing/:waveId/pack-and-seal
 */
router.post('/:waveId/pack-and-seal', upload.single('photo'), async (req, res) => {
  try {
    const { waveId } = req.params;
    const photo = req.file as Express.Multer.File | undefined;

    if (!photo) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: 'photo file is required'
      });
    }

    // Ensure wave exists
    const wave = await PickingWave.findByPk(waveId);
    if (!wave) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: `Wave with id ${waveId} not found`
      });
    }


    // Find minimum deliveries
    const minDeliveries = await Rider.min('totalDeliveries', {
      where: { isActive: true, availabilityStatus: 'AVAILABLE' }
    });

    if (minDeliveries === null) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: 'No eligible riders found'
      });
    }

    // Riders with minimum deliveries
    const candidates = await Rider.findAll({
      where: { isActive: true, availabilityStatus: 'AVAILABLE', totalDeliveries: minDeliveries },
      attributes: [
        'id',
        'riderCode',
        'name',
        'phone',
        'email',
        'vehicleType',
        'vehicleNumber',
        'availabilityStatus',
        'rating',
        'totalDeliveries'
      ]
    });

    if (!candidates.length) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: 'No eligible riders found'
      });
    }

    // Random from candidates
    const assignedRider = candidates[Math.floor(Math.random() * candidates.length)];

    // ✅ Use relative URL for EC2 instead of absolute path
    const relativePhotoPath = `/uploads/${photo.filename}`;

    // Update wave → assign rider + mark as PACKED + save photo URL
    await wave.update({
      riderId: assignedRider.id,
      status: 'PACKED',
      photoPath: relativePhotoPath
    });

    // Increment totalDeliveries for assigned rider
    await assignedRider.update({
      totalDeliveries: assignedRider.totalDeliveries + 1
    });

    // ✅ Response with URL instead of local path
    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Product packed and sealed successfully',
      data: {
        waveId: wave.id,
        photo: {
          filename: photo.filename,
          url: relativePhotoPath,
          mimetype: photo.mimetype,
          size: photo.size
        },
        deliveryPartner: assignedRider
      }
    });
  } catch (error) {
    console.error('Error in pack-and-seal:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to pack and seal product'
    });
  }
});

/**
 * @route GET /api/packing/status/:jobId
 */
router.get('/status/:jobId', PackingController.getPackingStatus);

/**
 * @route GET /api/packing/status/:jobId/mock
 */
router.get('/status/:jobId/mock', (req, res) => {
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

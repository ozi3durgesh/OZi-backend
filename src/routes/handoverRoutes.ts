// routes/handoverRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { HandoverController, dispatchWave } from '../controllers/handoverController';
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Multer setup
const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = "oms-stage-storage";
const FOLDER_NAME = "Handover"; // you can change to "handover-photos" if it's a better fit

// Multer storage -> upload straight to S3
const upload = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET_NAME,
    key: (req, file, cb) => {
      const filename = `${FOLDER_NAME}/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // optional (50 MB)
});

/**
 * @route POST /api/handover/dispatch
 * @desc Handover packed products to dispatch and generate AWB/Manifest ID
 * @access Manager, Dispatcher
 */
router.post('/dispatch', HandoverController.handoverToDispatch);

/**
 * @route POST /api/handover/:waveId/dispatch
 * @desc Dispatch wave with photo upload
 * @access Manager, Dispatcher
 */
router.post("/:waveId/dispatch", upload.single("handoverPhoto"), dispatchWave);

/**
 * @route POST /api/handover/assign-rider
 * @desc Assign rider for delivery
 * @access Manager
 */
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
  } catch (error) {
    console.error('Error assigning rider:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to assign rider'
    });
  }
});

/**
 * @route POST /api/handover/confirm
 * @desc Confirm handover to rider
 * @access Rider, Manager
 */
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
  } catch (error) {
    console.error('Error confirming handover:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to confirm handover'
    });
  }
});

/**
 * @route PUT /api/handover/:handoverId/status
 * @desc Update handover status (pickup, delivery, etc.)
 * @access Rider, Manager
 */
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
  } catch (error) {
    console.error('Error updating handover status:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to update handover status'
    });
  }
});

/**
 * @route GET /api/handover/riders/available
 * @desc Get available riders
 * @access Manager
 */
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
  } catch (error) {
    console.error('Error getting available riders:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to get available riders'
    });
  }
});

/**
 * @route GET /api/handover/lms/sync-status
 * @desc Get LMS sync status
 * @access Manager
 */
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
  } catch (error) {
    console.error('Error getting LMS sync status:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Failed to get LMS sync status'
    });
  }
});

export default router;
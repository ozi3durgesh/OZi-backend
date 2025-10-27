// routes/packingRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PackingController } from '../controllers/packingController';
import PickingWave from '../models/PickingWave';
import Order from '../models/Order';
import DeliveryMan from '../models/DeliveryMan';
import Rider from '../models/Rider';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { socketManager } from '../utils/socketManager';

const router = Router();

// Multer setup
const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = "oms-stage-storage";
const FOLDER_NAME = "packAndSeal"; // you can change to "handover-photos" if it's a better fit

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

interface MulterS3File extends Express.Multer.File {
  location: string; // S3 URL
  key: string;      // Object key
}


export function formatDeliveryPartner(deliveryPartner: DeliveryMan | null) {
  if (!deliveryPartner) return null;

  return {
    id: deliveryPartner.id,
    name: `${deliveryPartner.f_name} ${deliveryPartner.l_name}`,
    phone: deliveryPartner.phone,
    vehicleId: deliveryPartner.vehicle_id,
    image: deliveryPartner.image, // profile image if needed
  };
}

/**
 * @route POST /api/handover/:waveId/pack-and-seal
 */
interface MulterS3File extends Express.Multer.File {
  location: string;
  key: string;
}

router.post("/:waveId/pack-and-seal", upload.single("photo"), async (req, res) => {
  try {
    const { waveId } = req.params;
    const photo = req.file as MulterS3File | undefined;

    if (!photo) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: "photo file is required",
      });
    }

    const wave = await PickingWave.findByPk(waveId);
    if (!wave) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: `Wave with id ${waveId} not found`,
      });
    }

    const order = await Order.findByPk(wave.orderId);
    if (!order) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: "Order not found",
      });
    }

    // Get delivery partner from delivery_men table
    let deliveryPartner: DeliveryMan | null = null;
    
    if (order.delivery_man_id) {
      deliveryPartner = await DeliveryMan.findByPk(order.delivery_man_id);
    }
    
    // Update wave status and photo, but don't touch riderId
    await wave.update({
      status: "PACKED",
      photoPath: photo.location,
    });

    // socketManager.emit("delivery_assigned", {
    //   waveId: wave.id,
    //   deliveryPartner: deliveryPartner
    //     ? {
    //         id: deliveryPartner.id,
    //         name: `${deliveryPartner.f_name} ${deliveryPartner.l_name}`,
    //         vehicleId: deliveryPartner.vehicle_id,
    //         phone: deliveryPartner.phone,
    //       }
    //     : null,
    //   message: deliveryPartner ? undefined : "No delivery partner assigned to this order",
    //   photoPath: wave.photoPath,
    // });

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Product packed and sealed successfully",
      data: {
        waveId: wave.id,
        photo: {
          url: photo.location,
          key: photo.key,
          mimetype: photo.mimetype,
          size: photo.size,
        },
        deliveryPartner: deliveryPartner ? formatDeliveryPartner(deliveryPartner) : null,
      },
    });
  } catch (error) {
    console.error("Error in pack-and-seal:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: "Failed to pack and seal product",
    });
  }
});

router.get("/:waveId/refresh", async (req, res) => {
  try {
    const { waveId } = req.params;

    const wave = await PickingWave.findByPk(waveId);
    if (!wave) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: `Wave with id ${waveId} not found`,
      });
    }

    const order = await Order.findByPk(wave.orderId);
    if (!order) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: "Order not found",
      });
    }

    // Get delivery partner from delivery_men table
    let deliveryPartner: DeliveryMan | null = null;
    
    if (order.delivery_man_id) {
      deliveryPartner = await DeliveryMan.findByPk(order.delivery_man_id);
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        waveId: wave.id,
        status: wave.status,
        riderId: null, // Not using riderId anymore
        riderAssignedAt: null,
        deliveryPartner: deliveryPartner ? formatDeliveryPartner(deliveryPartner) : null,
      },
      message: deliveryPartner
        ? "Delivery partner assigned"
        : "No delivery partner assigned yet",
    });
  } catch (error) {
    console.error("Error in refresh:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: "Failed to refresh wave details",
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

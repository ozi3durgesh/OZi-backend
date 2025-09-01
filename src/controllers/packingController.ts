// controllers/packingController.ts
import { Request, Response } from 'express';
import { PickingWave, PackingJob } from '../models';
import Rider from '../models/Rider'; // ✅ Import Rider model
import { ResponseHandler } from '../middleware/responseHandler';
import sequelize from '../config/database';

interface AuthRequest extends Request {
  user?: any;
}

export class PackingController {
  /**
   * Pack and seal a wave (assign rider + upload photo)
   */
  static async packAndSeal(req: AuthRequest, res: Response): Promise<Response> {
    const transaction = await sequelize.transaction();
    try {
      const { waveNumber } = req.params;
      const packerId = req.user?.id;

      if (!req.file) {
        return ResponseHandler.error(res, 'Photo file is required', 400);
      }

      // Find wave
      const wave = await PickingWave.findOne({ where: { waveNumber } });
      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      if (wave.riderId) {
        return ResponseHandler.error(res, 'Rider already assigned to this wave', 409);
      }

      // ---- Find rider with lowest deliveries ----
      const minDeliveries = await Rider.min('totalDeliveries', {
        where: { availabilityStatus: 'AVAILABLE', isActive: true },
      });

      if (minDeliveries === null) {
        return ResponseHandler.error(res, 'No available riders found', 404);
      }

      const candidates = await Rider.findAll({
        where: {
          availabilityStatus: 'AVAILABLE',
          isActive: true,
          totalDeliveries: minDeliveries,
        },
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
        ],
      });

      if (!candidates.length) {
        return ResponseHandler.error(res, 'No available riders found', 404);
      }

      // Randomly pick one from lowest-delivery riders
      const rider = candidates[Math.floor(Math.random() * candidates.length)];

      // Update wave with rider + photo
      await wave.update(
        {
          riderId: rider.get('id'),
          riderAssignedAt: new Date(),
          photoPath: `/uploads/${req.file.filename}`,
          status: 'PACKING',
          updatedAt: new Date(),
        },
        { transaction }
      );

      // Create packing job
      const jobNumber = `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      await PackingJob.create(
        {
          jobNumber,
          waveId: wave.id,
          packerId,
          status: 'COMPLETED',
          priority: wave.priority,
          totalItems: wave.totalItems,
          packedItems: wave.totalItems,
          verifiedItems: wave.totalItems,
          estimatedDuration: wave.estimatedDuration,
          slaDeadline: wave.slaDeadline,
          workflowType: 'DEDICATED_PACKER',
          completedAt: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      return ResponseHandler.success(
        res,
        {
          message: 'Wave packed, rider assigned, and photo uploaded successfully',
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          rider, // includes all attributes we fetched
          photoPath: `/uploads/${req.file.filename}`,
          status: wave.status,
        },
        201
      );
    } catch (error) {
      await transaction.rollback();
      console.error('Pack and seal error:', error);
      return ResponseHandler.error(res, 'Failed to pack and seal wave', 500);
    }
  }

  /**
   * Get packing job status
   */
  static async getPackingStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;

      const packingJob = await PackingJob.findByPk(jobId, {
        include: [
          { model: PickingWave, as: 'Wave' },
        ],
      });

      if (!packingJob) {
        return ResponseHandler.error(res, 'Packing job not found', 404);
      }

      return ResponseHandler.success(res, {
        packingJob: {
          id: packingJob.id,
          jobNumber: packingJob.jobNumber,
          status: packingJob.status,
          priority: packingJob.priority,
          totalItems: packingJob.totalItems,
          packedItems: packingJob.packedItems,
          verifiedItems: packingJob.verifiedItems,
          estimatedDuration: packingJob.estimatedDuration,
          slaDeadline: packingJob.slaDeadline,
          specialInstructions: packingJob.specialInstructions,
          createdAt: packingJob.createdAt,
          completedAt: packingJob.completedAt,
        },
      });
    } catch (error) {
      console.error('Get packing status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}
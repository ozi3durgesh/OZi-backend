// controllers/packingController.ts
import { Request, Response } from 'express';
import { PackingJob, PackingItem, PhotoEvidence, Seal, PickingWave, PicklistItem, User, PackingEvent } from '../models';
import { SealGenerator } from '../utils/sealGenerator';
import { PhotoProcessor, S3Config } from '../utils/photoProcessor';
import { 
  StartPackingRequest, 
  VerifyItemRequest, 
  CompletePackingRequest,
  PackingJobStatus,
  ApiResponse 
} from '../types';
import { Op } from 'sequelize';

export class PackingController {
  private photoProcessor: PhotoProcessor;

  constructor() {
    // Initialize photo processor with S3 config
    const s3Config: S3Config = {
      bucket: process.env.S3_BUCKET || 'ozi-packing-photos',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    };
    
    this.photoProcessor = new PhotoProcessor(s3Config);
  }

  /**
   * Start a new packing job from a completed picking wave
   */
  async startPacking(req: Request<{}, {}, StartPackingRequest>, res: Response<ApiResponse>) {
    try {
      const { waveId, packerId, priority, workflowType, specialInstructions } = req.body;
      const userId = (req as any).user?.userId;

      // Validate picking wave exists and is completed
      const pickingWave = await PickingWave.findByPk(waveId, {
        include: [{ model: PicklistItem, as: 'PicklistItems' }]
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

      // Check if packing job already exists for this wave
      const existingJob = await PackingJob.findOne({ where: { waveId } });
      if (existingJob) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: 'Packing job already exists for this wave'
        });
      }

      // Calculate SLA deadline (default: 2 hours from now)
      const slaDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);

      // Create packing job
      const packingJob = await PackingJob.create({
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

      // Create packing items from picklist items
      if (pickingWave.PicklistItems) {
        const packingItems = pickingWave.PicklistItems.map(item => ({
          jobId: packingJob.id,
          orderId: item.orderId,
          sku: item.sku || 'UNKNOWN',
          quantity: item.quantity || 0,
          pickedQuantity: item.pickedQuantity || 0,
        }));

        await PackingItem.bulkCreate(packingItems);
      }

      // Log event
      await PackingEvent.create({
        jobId: packingJob.id,
        eventType: 'PACKING_STARTED',
        eventData: { waveId, packerId, priority, workflowType },
        userId,
        timestamp: new Date(),
      });

      // Update picking wave status if picker packs
      if (workflowType === 'PICKER_PACKS' && packerId) {
        await PickingWave.update(
          { status: 'PACKING' },
          { where: { id: waveId } }
        );
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

    } catch (error) {
      console.error('Error starting packing job:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to start packing job'
      });
    }
  }

  /**
   * Verify an item during packing process
   */
  async verifyItem(req: Request<{}, {}, VerifyItemRequest>, res: Response<ApiResponse>) {
    try {
      const { jobId, orderId, sku, packedQuantity, verificationNotes } = req.body;
      const userId = (req as any).user?.userId;

      // Find packing item
      const packingItem = await PackingItem.findOne({
        where: { jobId, orderId, sku }
      });

      if (!packingItem) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          error: 'Packing item not found'
        });
      }

      // Validate quantities
      if (packedQuantity > packingItem.pickedQuantity) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: 'Packed quantity cannot exceed picked quantity'
        });
      }

      // Update packing item
      await packingItem.update({
        packedQuantity,
        verifiedQuantity: packedQuantity,
        status: packedQuantity === packingItem.quantity ? 'COMPLETED' : 'VERIFIED',
        verificationNotes,
      });

      // Update job progress
      await this.updateJobProgress(jobId);

      // Log event
      await PackingEvent.create({
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

    } catch (error) {
      console.error('Error verifying item:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to verify item'
      });
    }
  }

  /**
   * Complete packing job with photos and seals
   */
  async completePacking(req: Request<{}, {}, CompletePackingRequest>, res: Response<ApiResponse>) {
    try {
      const { jobId, photos, seals } = req.body;
      const userId = (req as any).user?.userId;

      // Find packing job
      const packingJob = await PackingJob.findByPk(jobId, {
        include: [{ model: PackingItem, as: 'PackingItems' }]
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

      // Verify all items are packed
      const incompleteItems = packingJob.PackingItems?.filter(
        item => item.status !== 'COMPLETED'
      );

      if (incompleteItems && incompleteItems.length > 0) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: `Cannot complete packing: ${incompleteItems.length} items are not completed`
        });
      }

      // Process photos
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          await PhotoEvidence.create({
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

      // Process seals
      if (seals && seals.length > 0) {
        for (const seal of seals) {
          await Seal.create({
            sealNumber: seal.sealNumber,
            jobId,
            orderId: seal.orderId,
            sealType: seal.sealType,
            appliedAt: new Date(),
            appliedBy: userId,
          });
        }
      }

      // Update job status
      await packingJob.update({
        status: 'AWAITING_HANDOVER',
        completedAt: new Date(),
        packedItems: packingJob.totalItems,
        verifiedItems: packingJob.totalItems,
      });

      // Log event
      await PackingEvent.create({
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

    } catch (error) {
      console.error('Error completing packing:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to complete packing'
      });
    }
  }

  /**
   * Get packing job status
   */
  async getJobStatus(req: Request, res: Response<ApiResponse>) {
    try {
      const { jobId } = req.params;

      const packingJob = await PackingJob.findByPk(jobId, {
        include: [
          { model: PackingItem, as: 'PackingItems' },
          { model: User, as: 'Packer' },
          { model: PhotoEvidence, as: 'PhotoEvidence' },
          { model: Seal, as: 'Seals' },
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

      const status: PackingJobStatus = {
        id: packingJob.id,
        jobNumber: packingJob.jobNumber,
        status: packingJob.status,
        progress,
        sla,
        assignedPacker: packingJob.Packer ? {
          id: packingJob.Packer.id,
          name: packingJob.Packer.email, // Assuming email as name for now
        } : undefined,
      };

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Error getting job status:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to get job status'
      });
    }
  }

  /**
   * Get jobs awaiting handover
   */
  async getJobsAwaitingHandover(req: Request, res: Response<ApiResponse>) {
    try {
      const jobs = await PackingJob.findAll({
        where: { status: 'AWAITING_HANDOVER' },
        include: [
          { model: User, as: 'Packer' },
          { model: PickingWave, as: 'Wave' },
        ],
        order: [['priority', 'DESC'], ['completedAt', 'ASC']],
      });

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: jobs
      });

    } catch (error) {
      console.error('Error getting jobs awaiting handover:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to get jobs awaiting handover'
      });
    }
  }

  /**
   * Get SLA status for all jobs
   */
  async getSLAStatus(req: Request, res: Response<ApiResponse>) {
    try {
      const now = new Date();
      
      const jobs = await PackingJob.findAll({
        where: {
          status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] },
          slaDeadline: { [Op.gt]: now }
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
        } else if (remaining <= 30) { // Less than 30 minutes
          atRisk++;
          if (remaining <= 15) { // Less than 15 minutes
            criticalJobs++;
          }
        } else {
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

    } catch (error) {
      console.error('Error getting SLA status:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to get SLA status'
      });
    }
  }

  /**
   * Reassign packing job to different packer
   */
  async reassignJob(req: Request, res: Response<ApiResponse>) {
    try {
      const { jobId } = req.params;
      const { newPackerId, reason } = req.body;
      const userId = (req as any).user?.userId;

      const jobIdNum = parseInt(jobId);
      if (isNaN(jobIdNum)) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: 'Invalid job ID'
        });
      }

      const packingJob = await PackingJob.findByPk(jobIdNum);
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

      // Log event
      await PackingEvent.create({
        jobId: jobIdNum,
        eventType: 'PACKING_STARTED', // Reassignment event
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

    } catch (error) {
      console.error('Error reassigning job:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to reassign job'
      });
    }
  }

  /**
   * Generate unique job number
   */
  private generateJobNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PKG-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Calculate estimated duration based on item count
   */
  private calculateEstimatedDuration(itemCount: number): number {
    // Base time: 5 minutes + 2 minutes per item
    return Math.max(5, 5 + (itemCount * 2));
  }

  /**
   * Update job progress based on item statuses
   */
  private async updateJobProgress(jobId: number): Promise<void> {
    const packingItems = await PackingItem.findAll({ where: { jobId } });
    
    const packedItems = packingItems.filter(item => item.status === 'VERIFIED' || item.status === 'COMPLETED').length;
    const verifiedItems = packingItems.filter(item => item.status === 'COMPLETED').length;

    await PackingJob.update(
      { packedItems, verifiedItems },
      { where: { id: jobId } }
    );
  }

  /**
   * Calculate SLA status based on deadline
   */
  private calculateSLAStatus(deadline: Date): 'ON_TRACK' | 'AT_RISK' | 'BREACHED' {
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    const remainingMinutes = Math.round(remaining / (1000 * 60));

    if (remainingMinutes <= 0) {
      return 'BREACHED';
    } else if (remainingMinutes <= 30) {
      return 'AT_RISK';
    } else {
      return 'ON_TRACK';
    }
  }
}

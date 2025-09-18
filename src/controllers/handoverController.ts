// controllers/handoverController.ts
import { Request, Response } from 'express';
import { Handover, PackingJob, Rider, User, PackingEvent, PickingWave, PicklistItem, ScannerSku } from '../models';
import { LMSIntegration } from '../utils/lmsIntegration';
import { 
  AssignRiderRequest, 
  ConfirmHandoverRequest,
  ApiResponse,
  LMSIntegrationConfig 
} from '../types';
import sequelize from '../config/database';
import { ResponseHandler } from '../middleware/responseHandler';
import DeliveryMan from '../models/DeliveryMan';
import DirectInventoryService from '../services/DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';


interface AuthRequest extends Request {
  user?: any;
}

export class HandoverController {
  private lmsIntegration: LMSIntegration;

  constructor() {
    // Initialize LMS integration
    const lmsConfig: LMSIntegrationConfig = {
      baseUrl: process.env.LMS_BASE_URL || 'https://lms.example.com/api',
      apiKey: process.env.LMS_API_KEY || '',
      timeout: parseInt(process.env.LMS_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.LMS_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.LMS_RETRY_DELAY || '1000'),
    };

    this.lmsIntegration = new LMSIntegration(lmsConfig);
  }

  /**
   * Assign rider for delivery
   */
  async assignRider(req: Request<{}, {}, AssignRiderRequest>, res: Response<ApiResponse>) {
    try {
      const { jobId, riderId, specialInstructions } = req.body;
      const userId = (req as any).user?.userId;

      // Validate packing job exists and is ready for handover
      const packingJob = await PackingJob.findByPk(jobId);
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

      // Check if handover already exists
      const existingHandover = await Handover.findOne({ where: { jobId } });
      if (existingHandover) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: 'Handover already exists for this job'
        });
      }

      // Validate rider exists and is available
      const rider = await Rider.findByPk(riderId);
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

      // Create handover record
      const handover = await Handover.create({
        jobId,
        riderId,
        specialInstructions,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      });

      // Update rider status
      await rider.update({
        availabilityStatus: 'BUSY',
        lastActiveAt: new Date(),
      });

      // Update packing job status - keep it as HANDOVER_ASSIGNED
      // The PackingJob status should not change to IN_TRANSIT as that's not a valid status
      // Only update when handover is delivered (to COMPLETED)
      // if (handover.Job) {
      //   await handover.Job.update({
      //     status: 'IN_TRANSIT',
      //   });
      // }

      // Log event
      await PackingEvent.create({
        jobId,
        eventType: 'HANDOVER_ASSIGNED',
        eventData: { riderId, specialInstructions },
        userId,
        timestamp: new Date(),
      });

      // Attempt LMS sync
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

    } catch (error) {
      console.error('Error assigning rider:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to assign rider'
      });
    }
  }

  /**
   * Confirm handover to rider
   */
  async confirmHandover(req: Request<{}, {}, ConfirmHandoverRequest>, res: Response<ApiResponse>) {
    try {
      const { handoverId, riderId, confirmationCode } = req.body;
      const userId = (req as any).user?.userId;

      // Validate handover exists
      const handover = await Handover.findByPk(handoverId, {
        include: [
          { model: PackingJob, as: 'Job' },
          { model: Rider, as: 'Rider' }
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

      // Update handover status
      await handover.update({
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      });

      // Update packing job status - keep it as HANDOVER_ASSIGNED
      // The PackingJob status should not change to IN_TRANSIT as that's not a valid status
      // Only update when handover is delivered (to COMPLETED)
      // if (handover.Job) {
      //   await handover.Job.update({
      //     status: 'IN_TRANSIT',
      //   });
      // }

      // Log event
      await PackingEvent.create({
        jobId: handover.jobId,
        eventType: 'HANDOVER_CONFIRMED',
        eventData: { handoverId, riderId, confirmationCode },
        userId,
        timestamp: new Date(),
      });

      // Update LMS with status change
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

    } catch (error) {
      console.error('Error confirming handover:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to confirm handover'
      });
    }
  }

  /**
   * Update handover status (pickup, delivery, etc.)
   */
  async updateHandoverStatus(req: Request, res: Response<ApiResponse>) {
    try {
      const { handoverId } = req.params;
      const { status, additionalData } = req.body;
      const userId = (req as any).user?.userId;

      const handover = await Handover.findByPk(handoverId);
      if (!handover) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          error: 'Handover not found'
        });
      }

      // Validate status transition
      if (!this.isValidStatusTransition(handover.status, status)) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: 'Invalid status transition'
        });
      }

      const updateData: any = { status };

      // Set appropriate timestamp based on status
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

      // Update packing job status if needed
      if (status === 'DELIVERED') {
        await PackingJob.update(
          { status: 'COMPLETED' },
          { where: { id: handover.jobId } }
        );
      }

      // Log event
      await PackingEvent.create({
        jobId: handover.jobId,
        eventType: 'HANDOVER_STATUS_UPDATED',
        eventData: { status, additionalData },
        userId,
        timestamp: new Date(),
      });

      // Update LMS
      await this.updateLMSStatus(handover.id, status);

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          message: 'Handover status updated successfully',
          newStatus: status
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
  }

  /**
   * Retry LMS sync for failed operations
   */
  async retryLMSSync(req: Request, res: Response<ApiResponse>) {
    try {
      const { handoverId } = req.params;

      const handover = await Handover.findByPk(handoverId);
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

      // Attempt LMS sync
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
      } else {
        return res.status(500).json({
          statusCode: 500,
          success: false,
          error: `LMS sync retry failed: ${syncResult.error}`
        });
      }

    } catch (error) {
      console.error('Error retrying LMS sync:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to retry LMS sync'
      });
    }
  }

  /**
   * Get handover details
   */
  async getHandoverDetails(req: Request, res: Response<ApiResponse>) {
    try {
      const { handoverId } = req.params;

      const handover = await Handover.findByPk(handoverId, {
        include: [
          { model: PackingJob, as: 'Job' },
          { model: Rider, as: 'Rider' },
          { model: User, as: 'CancelledBy' },
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

    } catch (error) {
      console.error('Error getting handover details:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to get handover details'
      });
    }
  }

  /**
   * Get available riders
   */
  async getAvailableRiders(req: Request, res: Response<ApiResponse>) {
    try {
      const riders = await Rider.findAll({
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

    } catch (error) {
      console.error('Error getting available riders:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to get available riders'
      });
    }
  }

  /**
   * Get LMS sync status
   */
  async getLMSSyncStatus(req: Request, res: Response<ApiResponse>) {
    try {
      const handovers = await Handover.findAll({
        where: {
          lmsSyncStatus: { [require('sequelize').Op.ne]: 'SYNCED' }
        },
        include: [
          { model: PackingJob, as: 'Job' },
          { model: Rider, as: 'Rider' },
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

    } catch (error) {
      console.error('Error getting LMS sync status:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: 'Failed to get LMS sync status'
      });
    }
  }

  /**
   * Sync handover with LMS
   */
  private async syncWithLMS(handoverId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const handover = await Handover.findByPk(handoverId, {
        include: [
          { model: PackingJob, as: 'Job' },
          { model: Rider, as: 'Rider' },
        ]
      });

      if (!handover || !handover.Job || !handover.Rider) {
        return { success: false, error: 'Invalid handover data' };
      }

      // Create shipment data for LMS
      const shipmentData = {
        trackingNumber: `TRK-${handover.id}-${Date.now()}`,
        manifestNumber: `MF-${handover.id}-${Date.now()}`,
        origin: 'Warehouse', // This would come from configuration
        destination: 'Customer', // This would come from order data
        items: [], // This would be populated from packing items
        specialInstructions: handover.specialInstructions,
        expectedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };

      // Attempt LMS sync
      const lmsResponse = await this.lmsIntegration.createShipment(shipmentData);

      if (lmsResponse.success) {
        // Update handover with LMS sync success
        await handover.update({
          lmsSyncStatus: 'SYNCED',
          lmsLastSyncAt: new Date(),
          trackingNumber: shipmentData.trackingNumber,
          manifestNumber: shipmentData.manifestNumber,
        });

        // LMS shipment record creation removed

        return { success: true };
      } else {
        // Update handover with LMS sync failure
        await handover.update({
          lmsSyncStatus: 'FAILED',
          lmsLastSyncAt: new Date(),
          lmsErrorMessage: lmsResponse.error,
          lmsSyncAttempts: handover.lmsSyncAttempts + 1,
        });

        return { success: false, error: lmsResponse.error };
      }

    } catch (error) {
      console.error('LMS sync error:', error);

      // Update handover with error
      const existingHandover = await Handover.findByPk(handoverId);
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

  /**
   * Update LMS with status change
   */
  private async updateLMSStatus(handoverId: number, status: string): Promise<void> {
    try {
      const handover = await Handover.findByPk(handoverId);
      if (!handover || !handover.trackingNumber) {
        return;
      }

      await this.lmsIntegration.updateShipmentStatus(
        handover.trackingNumber,
        status
      );

    } catch (error) {
      console.error('Error updating LMS status:', error);
      // Don't throw error as this is not critical for the main flow
    }
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'ASSIGNED': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['IN_TRANSIT', 'CANCELLED'],
      'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [], // Terminal state
      'CANCELLED': [], // Terminal state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Handover packed products to dispatch with validation
   */
  static async handoverToDispatch(req: AuthRequest, res: Response): Promise<Response> {
    const transaction = await sequelize.transaction();

    try {
      const { jobNumber, sku, quantity, destination, warehouseId, specialInstructions } = req.body;
      const dispatcherId = req.user!.id;

      // Basic validation
      if (!jobNumber || !sku || !quantity || !destination || !warehouseId) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'jobNumber, sku, quantity, destination, and warehouseId are required', 400);
      }

      if (quantity <= 0) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'quantity must be greater than 0', 400);
      }

      // Find the packing job
      const packingJob = await PackingJob.findOne({
        where: { jobNumber },
        include: [
          { model: PickingWave, as: 'Wave' },
          { model: User, as: 'Packer' }
        ],
        transaction
      });

      if (!packingJob) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Packing job not found', 404);
      }

      // Check if packing job is completed
      if (packingJob.status !== 'COMPLETED') {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Cannot handover - packing job is not completed', 400);
      }

      // Note: SKU validation would need to be added to PackingJob model
      // For now, we'll validate quantity match
      if (packingJob.packedItems !== quantity) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Quantity mismatch with packing job', 400);
      }

      // Check if already handed over
      const existingHandover = await Handover.findOne({
        where: { jobId: packingJob.id },
        transaction
      });

      if (existingHandover) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Product already handed over to dispatch', 409);
      }

      // First check current inventory to ensure we don't go negative
      const currentInventory = await DirectInventoryService.getInventorySummary(sku);
      
      if (!currentInventory) {
        await transaction.rollback();
        return ResponseHandler.error(res, `Inventory record not found for SKU ${sku}`, 404);
      }

      // Check if we have enough picklist quantity to reduce
      if (currentInventory.picklist_quantity < quantity) {
        await transaction.rollback();
        return ResponseHandler.error(res, `Insufficient picklist quantity for SKU ${sku}. Available: ${currentInventory.picklist_quantity}, Required: ${quantity}`, 400);
      }

      // Update inventory - reduce picklist_quantity since items are being dispatched
      const inventoryResult = await DirectInventoryService.updateInventory({
        sku: sku,
        operation: INVENTORY_OPERATIONS.PICKLIST,
        quantity: -quantity, // Negative to reduce picklist quantity
        referenceId: `HANDOVER-JOB-${packingJob.id}`,
        operationDetails: {
          jobNumber: jobNumber,
          waveId: packingJob.waveId,
          destination: destination,
          warehouseId: warehouseId,
          specialInstructions: specialInstructions,
          handedOverAt: new Date(),
          handedOverBy: dispatcherId,
          previousPicklistQuantity: currentInventory.picklist_quantity,
          newPicklistQuantity: currentInventory.picklist_quantity - quantity
        },
        performedBy: dispatcherId
      });

      if (!inventoryResult.success) {
        await transaction.rollback();
        return ResponseHandler.error(res, `Failed to update inventory: ${inventoryResult.message}`, 500);
      }

      // Generate AWB/Manifest ID
      const { generateAWBNumber, generateTrackingNumber } = require('../../utils/awbGenerator');
      const awbNumber = generateAWBNumber();
      const trackingNumber = generateTrackingNumber();

      // Create handover record
      const handover = await Handover.create({
        jobId: packingJob.id,
        riderId: 0, // Will be assigned later (0 indicates unassigned)
        status: 'ASSIGNED',
        assignedAt: new Date(),
        trackingNumber,
        manifestNumber: awbNumber,
        specialInstructions,
        lmsSyncStatus: 'PENDING'
      }, { transaction });

      // Update packing job status
      await packingJob.update({
        status: 'AWAITING_HANDOVER',
        handoverAt: new Date()
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      return ResponseHandler.success(res, {
        message: 'Product handed over to dispatch successfully',
        handoverId: handover.id,
        jobNumber,
        sku,
        quantity,
        destination,
        warehouseId,
        awbNumber,
        trackingNumber,
        specialInstructions,
        status: 'DISPATCHED',
        dispatchedAt: new Date(),
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        readyForDelivery: true,
        inventoryUpdate: inventoryResult
      }, 201);

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Handover to dispatch error:', error);
      return ResponseHandler.error(res, 'Failed to handover product to dispatch', 500);
    }
  }

  /**
   * Update picklist quantity when items are picked
   * This should be called during the picking process to allocate inventory
   */
  static async updatePicklistQuantity(req: AuthRequest, res: Response): Promise<Response> {
    const transaction = await sequelize.transaction();

    try {
      const { sku, quantity, waveId, orderId, operation } = req.body;
      const pickerId = req.user!.id;

      // Validation
      if (!sku || !quantity || !waveId || !operation) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'sku, quantity, waveId, and operation are required', 400);
      }

      if (quantity <= 0) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'quantity must be greater than 0', 400);
      }

      if (!['ALLOCATE', 'DEALLOCATE'].includes(operation)) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'operation must be either ALLOCATE or DEALLOCATE', 400);
      }

      // Validate wave exists
      const wave = await PickingWave.findByPk(waveId, { transaction });
      if (!wave) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Picking wave not found', 404);
      }

      // Check if wave is in correct status for picking
      if (!['ASSIGNED', 'PICKING'].includes(wave.status)) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Wave is not in correct status for picking operations', 400);
      }

        // Check inventory availability for allocation
        if (operation === 'ALLOCATE') {
          const currentInventory = await DirectInventoryService.getInventorySummary(sku);
          
          if (!currentInventory) {
            await transaction.rollback();
            return ResponseHandler.error(res, `Inventory record not found for SKU ${sku}`, 404);
          }

          // Check if we have enough putaway quantity to allocate
          if (currentInventory.putaway_quantity < quantity) {
            await transaction.rollback();
            return ResponseHandler.error(res, `Insufficient inventory available. Current putaway: ${currentInventory.putaway_quantity}, Required: ${quantity}`, 400);
          }
        }

      // Update inventory
      const quantityChange = operation === 'ALLOCATE' ? quantity : -quantity;
      const inventoryResult = await DirectInventoryService.updateInventory({
        sku: sku,
        operation: INVENTORY_OPERATIONS.PICKLIST,
        quantity: quantityChange,
        referenceId: `PICKLIST-WAVE-${waveId}`,
        operationDetails: {
          waveId: waveId,
          waveNumber: wave.waveNumber,
          orderId: orderId,
          operation: operation,
          pickedAt: new Date(),
          pickedBy: pickerId
        },
        performedBy: pickerId
      });

      if (!inventoryResult.success) {
        await transaction.rollback();
        return ResponseHandler.error(res, `Failed to update inventory: ${inventoryResult.message}`, 500);
      }

      // Update or create picklist item record
      const picklistItem = await PicklistItem.findOne({
        where: {
          waveId: waveId,
          sku: sku,
          orderId: orderId || null
        },
        transaction
      });

      if (picklistItem) {
        // Update existing picklist item
        const newPickedQuantity = operation === 'ALLOCATE' 
          ? picklistItem.pickedQuantity + quantity 
          : Math.max(0, picklistItem.pickedQuantity - quantity);

        await picklistItem.update({
          pickedQuantity: newPickedQuantity,
          status: newPickedQuantity === picklistItem.quantity ? 'PICKED' : 
                  newPickedQuantity > 0 ? 'PARTIAL' : 'PENDING',
          pickedAt: new Date(),
          pickedBy: pickerId
        }, { transaction });
        } else if (operation === 'ALLOCATE') {
          // Create new picklist item for allocation
          await PicklistItem.create({
            waveId: waveId,
            orderId: orderId || 0,
            sku: sku,
            productName: 'Product-' + sku, // Default product name
            binLocation: 'A1-B1-R1-S1', // Default bin location
            quantity: quantity,
            pickedQuantity: quantity,
            status: 'PICKED',
            scanSequence: 1, // Default scan sequence
            pickedAt: new Date(),
            pickedBy: pickerId
          }, { transaction });
        }

      // Commit transaction
      await transaction.commit();

      return ResponseHandler.success(res, {
        message: `Picklist quantity ${operation.toLowerCase()}d successfully`,
        sku: sku,
        quantity: quantity,
        operation: operation,
        waveId: waveId,
        inventoryUpdate: inventoryResult,
        picklistItem: picklistItem ? {
          id: picklistItem.id,
          pickedQuantity: picklistItem.pickedQuantity,
          status: picklistItem.status
        } : null
      }, 200);

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Update picklist quantity error:', error);
      return ResponseHandler.error(res, 'Failed to update picklist quantity', 500);
    }
  }

  /**
   * Get inventory status for debugging
   */
  static async getInventoryStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { sku } = req.params;

      if (!sku) {
        return ResponseHandler.error(res, 'SKU parameter is required', 400);
      }

      const inventorySummary = await DirectInventoryService.getInventorySummary(sku);

      if (!inventorySummary) {
        return ResponseHandler.error(res, `Inventory record not found for SKU ${sku}`, 404);
      }

      return ResponseHandler.success(res, {
        sku: sku,
        inventory: inventorySummary,
        availableForPicking: inventorySummary.putaway_quantity - inventorySummary.picklist_quantity,
        totalInventory: inventorySummary.po_quantity + inventorySummary.grn_quantity + 
                       inventorySummary.putaway_quantity + inventorySummary.return_try_and_buy_quantity + 
                       inventorySummary.return_other_quantity
      }, 200);

    } catch (error) {
      console.error('Get inventory status error:', error);
      return ResponseHandler.error(res, 'Failed to get inventory status', 500);
    }
  }
}

interface MulterS3File extends Express.Multer.File {
  location: string; // Public S3 URL
  key: string;      // Object key inside S3
}

export const dispatchWave = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { waveId } = req.params;
    const { riderId, dispatchNotes } = req.body;
    const staffId = (req as any).user.id; // JWT decoded userId

    // Uploaded file from multer-s3
    const handoverPhoto = req.file as MulterS3File | undefined;
    const photoUrl = handoverPhoto?.location ?? null;

    // 1. Validate Wave
    const wave = await PickingWave.findByPk(waveId, {
      include: [
        {
          model: PicklistItem,
          as: 'PicklistItems',
          attributes: ['id', 'sku', 'quantity', 'pickedQuantity', 'status']
        }
      ],
      transaction
    });
    
    if (!wave) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Wave not found" });
    }

    if (wave.status !== "PACKED") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Wave not ready for dispatch",
      });
    }

    // 2. Validate Rider
    const rider = await DeliveryMan.findOne({
      where: {
        id: riderId
      },
    });

    if (!rider) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Rider not available" });
    }

    // 3. Validate Picklist Items and Update Inventory
    const inventoryUpdateResults: Array<{
      sku: string;
      success: boolean;
      message: string;
      data?: any;
    }> = [];

    // Group picklist items by SKU to calculate total quantities
    const skuQuantities = new Map<string, number>();
    
    for (const picklistItem of wave.PicklistItems || []) {
      if (picklistItem.status === 'PICKED' || picklistItem.status === 'PARTIAL') {
        const currentQty = skuQuantities.get(picklistItem.sku) || 0;
        skuQuantities.set(picklistItem.sku, currentQty + picklistItem.pickedQuantity);
      }
    }

    // Update inventory for each SKU
    for (const [sku, quantity] of skuQuantities) {
      if (quantity > 0) {
        try {
          // First check current inventory to ensure we don't go negative
          const currentInventory = await DirectInventoryService.getInventorySummary(sku);
          
          if (!currentInventory) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Inventory record not found for SKU ${sku}`,
            });
          }

          // Check if we have enough putaway quantity to dispatch
          if (currentInventory.putaway_quantity < quantity) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Insufficient putaway quantity for SKU ${sku}. Available: ${currentInventory.putaway_quantity}, Required: ${quantity}`,
            });
          }

          // Update inventory: increase picklist_quantity and reduce putaway_quantity
          // Step 1: Increase picklist_quantity (items are being allocated for dispatch)
          const picklistResult = await DirectInventoryService.updateInventory({
            sku: sku,
            operation: INVENTORY_OPERATIONS.PICKLIST,
            quantity: quantity, // Positive to increase picklist quantity
            referenceId: `DISPATCH-WAVE-${waveId}`,
            operationDetails: {
              waveId: waveId,
              waveNumber: wave.waveNumber,
              riderId: riderId,
              dispatchNotes: dispatchNotes,
              dispatchedAt: new Date(),
              dispatchedBy: staffId,
              previousPicklistQuantity: currentInventory.picklist_quantity,
              newPicklistQuantity: currentInventory.picklist_quantity + quantity,
              operation: 'dispatch_picklist_allocation'
            },
            performedBy: staffId
          });

          if (!picklistResult.success) {
            throw new Error(`Failed to increase picklist quantity: ${picklistResult.message}`);
          }

          // Step 2: Reduce putaway_quantity (items are leaving the warehouse)
          const putawayResult = await DirectInventoryService.updateInventory({
            sku: sku,
            operation: INVENTORY_OPERATIONS.PUTAWAY,
            quantity: -quantity, // Negative to reduce putaway quantity
            referenceId: `DISPATCH-WAVE-${waveId}`,
            operationDetails: {
              waveId: waveId,
              waveNumber: wave.waveNumber,
              riderId: riderId,
              dispatchNotes: dispatchNotes,
              dispatchedAt: new Date(),
              dispatchedBy: staffId,
              previousPutawayQuantity: currentInventory.putaway_quantity,
              newPutawayQuantity: currentInventory.putaway_quantity - quantity,
              operation: 'dispatch_putaway_reduction'
            },
            performedBy: staffId
          });

          if (!putawayResult.success) {
            throw new Error(`Failed to reduce putaway quantity: ${putawayResult.message}`);
          }

          const inventoryResult = {
            success: true,
            message: 'Inventory updated successfully',
            picklistUpdate: picklistResult,
            putawayUpdate: putawayResult
          };

          inventoryUpdateResults.push({
            sku: sku,
            success: inventoryResult.success,
            message: inventoryResult.message,
            data: {
              picklistUpdate: inventoryResult.picklistUpdate,
              putawayUpdate: inventoryResult.putawayUpdate
            }
          });

          if (!inventoryResult.success) {
            throw new Error(`Failed to update inventory for SKU ${sku}: ${inventoryResult.message}`);
          }

          // Step 3: Update scanner_sku table with reduced quantities
          try {
            const scannerSkuRecord = await ScannerSku.findOne({
              where: { skuScanId: sku },
              transaction
            });

            if (scannerSkuRecord) {
              // Update the quantity in the JSON field
              const currentSkuData = scannerSkuRecord.sku;
              const updatedSkuData = currentSkuData.map(item => {
                if (item.skuId === sku) {
                  return {
                    ...item,
                    quantity: Math.max(0, item.quantity - quantity) // Reduce quantity when dispatched
                  };
                }
                return item;
              });

              await scannerSkuRecord.update({
                sku: updatedSkuData
              }, { transaction });

              console.log(`Updated scanner_sku for SKU ${sku}: ${quantity} units dispatched`);
            } else {
              console.log(`No scanner_sku record found for SKU ${sku}, skipping scanner update`);
            }
          } catch (scannerError) {
            console.error(`Failed to update scanner_sku for SKU ${sku}:`, scannerError);
            // Don't fail the dispatch process, just log the error
          }
        } catch (error: any) {
          await transaction.rollback();
          return res.status(500).json({
            success: false,
            message: `Failed to update inventory for SKU ${sku}`,
            error: error.message,
          });
        }
      }
    }

    // 4. Update Wave → Dispatched
    wave.status = "COMPLETED"; // mark as completed
    wave.handoverAt = new Date();
    wave.handoverBy = staffId;
    wave.riderId = rider.id;
    wave.dispatchNotes = dispatchNotes || null;
    if (photoUrl) {
      wave.handoverPhoto = photoUrl; // store S3 URL instead of local path
    }
    await wave.save({ transaction });

    // 5. Commit transaction
    await transaction.commit();

    // 6. Response
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Order dispatched successfully",
      data: {
        waveId: wave.id,
        status: wave.status,
        handoverAt: wave.handoverAt,
        handoverBy: { id: staffId },
        deliveryPartner: {
          id: rider.id,
          riderCode: rider.identity_number,
          name: rider.f_name + ' ' + rider.l_name,
          phone: rider.phone,
          email: rider.email,
          vehicleId: rider.vehicle_id,
          availabilityStatus: rider.active,
          totalDeliveries: rider.assigned_order_count,
        },
        photo: photoUrl
          ? {
              url: photoUrl,
              key: handoverPhoto?.key,
              mimetype: handoverPhoto?.mimetype,
              size: handoverPhoto?.size,
            }
          : null,
        inventoryUpdates: inventoryUpdateResults,
        dispatchedItems: Array.from(skuQuantities.entries()).map(([sku, qty]) => ({
          sku: sku,
          quantity: qty
        }))
      },
    });
  } catch (error: any) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error("Dispatch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch order",
      error: error.message,
    });
  }
};
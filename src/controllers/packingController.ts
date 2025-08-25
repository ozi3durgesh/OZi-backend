// controllers/packingController.ts
import { Request, Response } from 'express';
import { PickingWave, PicklistItem, PackingJob, Order, User } from '../models';
import { ResponseHandler } from '../middleware/responseHandler';
import sequelize from '../config/database';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
}

export class PackingController {
  /**
   * Pack and seal a product with validation
   */
  static async packAndSeal(req: AuthRequest, res: Response): Promise<Response> {
    const transaction = await sequelize.transaction();
    
    try {
      const { sku, quantity, picture, orderId, warehouseId, specialInstructions } = req.body;
      const packerId = req.user!.id;

      // Basic validation
      if (!sku || !quantity || !picture || !orderId || !warehouseId) {
        return ResponseHandler.error(res, 'sku, quantity, picture, orderId, and warehouseId are required', 400);
      }

      if (quantity <= 0) {
        return ResponseHandler.error(res, 'quantity must be greater than 0', 400);
      }

      // Find the order and validate it exists
      const order = await Order.findByPk(orderId);
      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      // Check if order is from the specified warehouse
      const orderData = order.get({ plain: true });
      if (orderData.store_id !== parseInt(warehouseId)) {
        return ResponseHandler.error(res, 'Order does not belong to the specified warehouse', 403);
      }

      // Find the picking wave for this order
      const wave = await PickingWave.findOne({
        where: { 
          waveNumber: { [Op.like]: `%${orderData.order_id}%` }
        }
      });

      if (!wave) {
        return ResponseHandler.error(res, 'No picking wave found for this order', 404);
      }

      // Check if wave is completed - if so, cannot pack again
      if (wave.status === 'COMPLETED') {
        return ResponseHandler.error(res, 'Cannot pack this order - picking wave is already completed', 409);
      }

      // Find the picklist item for this SKU and order
      const picklistItem = await PicklistItem.findOne({
        where: { 
          waveId: wave.id,
          orderId: orderId,
          sku: sku
        }
      });

      if (!picklistItem) {
        return ResponseHandler.error(res, 'SKU not found in picking wave for this order', 404);
      }

      // Validate quantity matches or check for partial
      const itemData = picklistItem.get({ plain: true });
      let packingStatus = 'PACKED_AND_SEALED';
      let partialReason: string | undefined = undefined;

      if (quantity !== itemData.quantity) {
        if (quantity > itemData.quantity) {
          return ResponseHandler.error(res, `Cannot pack more than picked quantity. Picked: ${itemData.quantity}, Requested: ${quantity}`, 400);
        }
        
        // Partial packing
        packingStatus = 'PARTIALLY_PACKED';
        partialReason = `Partial packing: ${quantity}/${itemData.quantity} packed`;
        
        // Update picklist item status
        await picklistItem.update({
          status: 'PARTIAL',
          partialReason: partialReason,
          pickedQuantity: quantity
        }, { transaction });
      } else {
        // Full packing - update picklist item status
        await picklistItem.update({
          status: 'PICKED',
          pickedQuantity: quantity,
          pickedAt: new Date(),
          pickedBy: packerId
        }, { transaction });
      }

      // Check if all items in the wave are picked
      const remainingItems = await PicklistItem.count({
        where: { 
          waveId: wave.id,
          status: ['PENDING', 'PICKING']
        }
      });

      // If no remaining items, mark wave as completed
      if (remainingItems === 0) {
        await wave.update({
          status: 'COMPLETED',
          completedAt: new Date()
        }, { transaction });
      }

      // Generate packing job number
      const jobNumber = `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      // Create packing job record
      const packingJob = await PackingJob.create({
        jobNumber,
        waveId: wave.id,
        packerId,
        status: 'COMPLETED',
        priority: wave.priority,
        totalItems: itemData.quantity,
        packedItems: quantity,
        verifiedItems: quantity,
        estimatedDuration: 5, // 5 minutes for packing
        slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        workflowType: 'DEDICATED_PACKER',
        specialInstructions,
        completedAt: new Date()
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      return ResponseHandler.success(res, {
        message: 'Product packed and sealed successfully',
        jobNumber,
        sku,
        quantity,
        picture,
        orderId,
        warehouseId,
        specialInstructions,
        status: packingStatus,
        partialReason,
        packedAt: new Date(),
        readyForHandover: true,
        waveStatus: wave.status,
        waveId: wave.id
      }, 201);

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Pack and seal error:', error);
      return ResponseHandler.error(res, 'Failed to pack and seal product', 500);
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
          { model: User, as: 'Packer' }
        ]
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
          completedAt: packingJob.completedAt
        }
      });

    } catch (error) {
      console.error('Get packing status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}

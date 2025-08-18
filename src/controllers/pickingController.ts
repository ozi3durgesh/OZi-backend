// controllers/pickingController.ts
import { Request, Response } from 'express';
import { PickingWave, PicklistItem, PickingException, User, Order } from '../models';
import { ResponseHandler } from '../middleware/responseHandler';

interface AuthRequest extends Request {
  user?: any;
}

export class PickingController {
  // Wave Management

  /**
   * Generate new picking waves
   */
  static async generateWaves(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { 
        orderIds, 
        priority = 'MEDIUM', 
        routeOptimization = true, 
        fefoRequired = false,
        tagsAndBags = false,
        maxOrdersPerWave = 20 
      } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return ResponseHandler.error(res, 'Order IDs array is required', 400);
      }

      // Validate orders exist and are eligible for picking
      const orders = await Order.findAll({
        where: { id: orderIds },
        attributes: ['id', 'order_amount', 'created_at', 'cart']
      });

      if (orders.length !== orderIds.length) {
        return ResponseHandler.error(res, 'Some orders not found', 404);
      }

      // Group orders into waves
      const waves: any[] = [];
      for (let i = 0; i < orders.length; i += maxOrdersPerWave) {
        const waveOrders = orders.slice(i, i + maxOrdersPerWave);
        const waveNumber = `W${Date.now()}-${Math.floor(i / maxOrdersPerWave) + 1}`;
        
        // Calculate SLA deadline (24 hours from now for demo)
        const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        const wave = await PickingWave.create({
          waveNumber,
          status: 'GENERATED',
          priority,
          totalOrders: waveOrders.length,
          totalItems: waveOrders.reduce((sum, order) => {
            let cart: any[] = [];
            if (order.cart) {
              try {
                cart = typeof order.cart === 'string' ? JSON.parse(order.cart) : order.cart;
              } catch (e) {
                cart = [];
              }
            }
            return sum + (Array.isArray(cart) ? cart.length : 0);
          }, 0),
          estimatedDuration: Math.ceil(waveOrders.length * 2), // 2 minutes per order
          slaDeadline,
          routeOptimization,
          fefoRequired,
          tagsAndBags
        } as any);

        // Create picklist items for each order
        for (const order of waveOrders) {
          let cart: any[] = [];
          if (order.cart) {
            try {
              cart = typeof order.cart === 'string' ? JSON.parse(order.cart) : order.cart;
            } catch (e) {
              cart = [];
            }
          }
          for (const item of cart) {
            await PicklistItem.create({
              waveId: wave.id,
              orderId: order.id,
              sku: item.sku || 'SKU001',
              productName: item.productName || 'Product',
              binLocation: item.binLocation || 'A1-B2-C3',
              quantity: item.amount || 1,
              scanSequence: Math.floor(Math.random() * 100) + 1, // Random sequence for demo
              fefoBatch: fefoRequired ? `BATCH-${Date.now()}` : undefined,
              expiryDate: fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
            } as any);
          }
        }

        waves.push(wave);
      }

      return ResponseHandler.success(res, {
        message: `Generated ${waves.length} picking waves`,
        waves: waves.map(wave => ({
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          totalOrders: wave.totalOrders,
          totalItems: wave.totalItems,
          estimatedDuration: wave.estimatedDuration,
          slaDeadline: wave.slaDeadline
        }))
      }, 201);

    } catch (error) {
      console.error('Generate waves error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Auto-assign waves to available pickers
   */
  static async assignWaves(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { maxWavesPerPicker = 3 } = req.query;

      // Find available pickers (users with picking permissions)
      const availablePickers = await User.findAll({
        where: {
          isActive: true,
          availabilityStatus: 'available'
        },
        include: [{
          association: 'Role',
          include: ['Permissions']
        }],
        attributes: ['id', 'email', 'availabilityStatus']
      });

      // Filter pickers with picking permissions
      const pickers = availablePickers.filter(user => {
        const permissions = (user as any).Role?.Permissions || [];
        return permissions.some((p: any) => 
          p.module === 'picking' && ['view', 'assign_manage', 'execute'].includes(p.action)
        );
      });

      if (pickers.length === 0) {
        return ResponseHandler.error(res, 'No available pickers found', 404);
      }

      // Find unassigned waves
      const unassignedWaves = await PickingWave.findAll({
        where: { status: 'GENERATED' },
        order: [['priority', 'DESC'], ['slaDeadline', 'ASC']]
      });

      if (unassignedWaves.length === 0) {
        return ResponseHandler.success(res, { message: 'No unassigned waves found' });
      }

      // Assign waves to pickers
      const assignments: any[] = [];
      let pickerIndex = 0;

      for (const wave of unassignedWaves) {
        // Check if picker can handle more waves
        const picker = pickers[pickerIndex % pickers.length];
        const pickerWaves = await PickingWave.count({
          where: { pickerId: picker.id, status: ['ASSIGNED', 'PICKING'] }
        });

        if (pickerWaves < parseInt(maxWavesPerPicker.toString())) {
          await wave.update({
            status: 'ASSIGNED',
            pickerId: picker.id,
            assignedAt: new Date()
          });

          assignments.push({
            waveId: wave.id,
            waveNumber: wave.waveNumber,
            pickerId: picker.id,
            pickerEmail: picker.email,
            assignedAt: wave.assignedAt
          });
        }

        pickerIndex++;
      }

      return ResponseHandler.success(res, {
        message: `Assigned ${assignments.length} waves to pickers`,
        assignments
      });

    } catch (error) {
      console.error('Assign waves error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * List available waves
   */
  static async getAvailableWaves(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { status, priority, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;

      const waves = await PickingWave.findAndCountAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['slaDeadline', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
      });

      return ResponseHandler.success(res, {
        waves: waves.rows,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: waves.count,
          totalPages: Math.ceil(waves.count / parseInt(limit.toString()))
        }
      });

    } catch (error) {
      console.error('Get available waves error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Picker Operations

  /**
   * Start picking a wave
   */
  static async startPicking(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.params;
      const pickerId = req.user!.id;

      const wave = await PickingWave.findByPk(waveId);

      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      if (wave.status !== 'ASSIGNED') {
        return ResponseHandler.error(res, 'Wave is not assigned to you', 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'Wave is not assigned to you', 403);
      }

      // Update wave status
      await wave.update({
        status: 'PICKING',
        startedAt: new Date()
      });

      // Get picklist items
      const picklistItems = await PicklistItem.findAll({
        where: { waveId },
        order: [['scanSequence', 'ASC']]
      });

      return ResponseHandler.success(res, {
        message: 'Picking started successfully',
        wave: {
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          totalItems: wave.totalItems,
          estimatedDuration: wave.estimatedDuration
        },
        picklistItems: picklistItems.map(item => ({
          id: item.id,
          sku: item.sku,
          productName: item.productName,
          binLocation: item.binLocation,
          quantity: item.quantity,
          scanSequence: item.scanSequence,
          fefoBatch: item.fefoBatch,
          expiryDate: item.expiryDate
        }))
      });

    } catch (error) {
      console.error('Start picking error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Scan an item during picking
   */
  static async scanItem(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.params;
      const { sku, binLocation, quantity = 1 } = req.body;
      const pickerId = req.user!.id;

      if (!sku || !binLocation) {
        return ResponseHandler.error(res, 'SKU and bin location are required', 400);
      }

      // Find the picklist item
      const picklistItem = await PicklistItem.findOne({
        where: { 
          waveId: parseInt(waveId),
          sku,
          binLocation,
          status: ['PENDING', 'PICKING']
        }
      });

      if (!picklistItem) {
        return ResponseHandler.error(res, 'Item not found in picklist', 404);
      }

      // Get wave to validate status and picker
      const wave = await PickingWave.findByPk(waveId);
      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'You are not assigned to this wave', 403);
      }

      // Update item status
      const pickedQuantity = Math.min(quantity, picklistItem.quantity);
      const newStatus = pickedQuantity === picklistItem.quantity ? 'PICKED' : 'PARTIAL';

      await picklistItem.update({
        status: newStatus,
        pickedQuantity: pickedQuantity,
        pickedAt: new Date(),
        pickedBy: pickerId
      });

      // Check if all items in wave are picked
      const remainingItems = await PicklistItem.count({
        where: { 
          waveId: parseInt(waveId),
          status: ['PENDING', 'PICKING']
        }
      });

      if (remainingItems === 0) {
        await wave.update({
          status: 'COMPLETED',
          completedAt: new Date()
        });
      }

      return ResponseHandler.success(res, {
        message: 'Item scanned successfully',
        item: {
          id: picklistItem.id,
          sku: picklistItem.sku,
          productName: picklistItem.productName,
          status: picklistItem.status,
          pickedQuantity: picklistItem.pickedQuantity,
          remainingQuantity: picklistItem.quantity - picklistItem.pickedQuantity
        },
        waveStatus: wave.status,
        remainingItems
      });

    } catch (error) {
      console.error('Scan item error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Report partial pick with reason
   */
  static async reportPartialPick(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.params;
      const { 
        sku, 
        binLocation, 
        reason, 
        photo, 
        notes,
        pickedQuantity = 0 
      } = req.body;
      const pickerId = req.user!.id;

      if (!sku || !binLocation || !reason) {
        return ResponseHandler.error(res, 'SKU, bin location, and reason are required', 400);
      }

      // Find the picklist item
      const picklistItem = await PicklistItem.findOne({
        where: { 
          waveId: parseInt(waveId),
          sku,
          binLocation
        }
      });

      if (!picklistItem) {
        return ResponseHandler.error(res, 'Item not found in picklist', 404);
      }

      // Get wave to validate status
      const wave = await PickingWave.findByPk(waveId);
      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      // Update item status
      await picklistItem.update({
        status: 'PARTIAL',
        pickedQuantity: pickedQuantity,
        partialReason: reason,
        partialPhoto: photo,
        notes,
        pickedAt: new Date(),
        pickedBy: pickerId
      });

      // Create exception if needed
      if (['OOS', 'DAMAGED', 'EXPIRY'].includes(reason)) {
        await PickingException.create({
          waveId: parseInt(waveId),
          orderId: picklistItem.orderId,
          sku: picklistItem.sku,
          exceptionType: reason as any,
          severity: reason === 'EXPIRY' ? 'HIGH' : 'MEDIUM',
          description: `Partial pick reported: ${reason}. ${notes || ''}`,
          reportedBy: pickerId,
          reportedAt: new Date(),
          status: 'OPEN',
          slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        } as any);
      }

      return ResponseHandler.success(res, {
        message: 'Partial pick reported successfully',
        item: {
          id: picklistItem.id,
          sku: picklistItem.sku,
          status: picklistItem.status,
          partialReason: picklistItem.partialReason,
          pickedQuantity: picklistItem.pickedQuantity
        }
      });

    } catch (error) {
      console.error('Report partial pick error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Complete picking for a wave
   */
  static async completePicking(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.params;
      const pickerId = req.user!.id;

      const wave = await PickingWave.findByPk(waveId);

      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'You are not assigned to this wave', 403);
      }

      // Check if all items are processed
      const pendingItems = await PicklistItem.count({
        where: { 
          waveId: parseInt(waveId),
          status: ['PENDING', 'PICKING']
        }
      });

      if (pendingItems > 0) {
        return ResponseHandler.error(res, `Cannot complete: ${pendingItems} items still pending`, 400);
      }

      // Update wave status
      await wave.update({
        status: 'COMPLETED',
        completedAt: new Date()
      });

      // Calculate completion metrics
      const totalItems = await PicklistItem.count({ where: { waveId: parseInt(waveId) } });
      const pickedItems = await PicklistItem.count({ 
        where: { waveId: parseInt(waveId), status: 'PICKED' } 
      });
      const partialItems = await PicklistItem.count({ 
        where: { waveId: parseInt(waveId), status: 'PARTIAL' } 
      });
      const accuracy = (pickedItems / totalItems) * 100;

      return ResponseHandler.success(res, {
        message: 'Picking completed successfully',
        wave: {
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          completedAt: wave.completedAt
        },
        metrics: {
          totalItems,
          pickedItems,
          partialItems,
          accuracy: Math.round(accuracy * 100) / 100
        }
      });

    } catch (error) {
      console.error('Complete picking error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // Monitoring

  /**
   * Check SLA compliance
   */
  static async getSlaStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.query;

      const whereClause: any = {};
      if (waveId) whereClause.id = parseInt(waveId.toString());

      const waves = await PickingWave.findAll({
        where: whereClause,
        order: [['slaDeadline', 'ASC']]
      });

      const now = new Date();
      const slaMetrics = {
        total: waves.length,
        onTime: 0,
        atRisk: 0,
        breached: 0,
        waves: [] as any[]
      };

      for (const wave of waves) {
        const timeToDeadline = wave.slaDeadline.getTime() - now.getTime();
        const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);

        let status = 'onTime';
        if (hoursToDeadline < 0) {
          status = 'breached';
          slaMetrics.breached++;
        } else if (hoursToDeadline < 2) {
          status = 'atRisk';
          slaMetrics.atRisk++;
        } else {
          slaMetrics.onTime++;
        }

        slaMetrics.waves.push({
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          priority: wave.priority,
          slaDeadline: wave.slaDeadline,
          slaStatus: status,
          hoursToDeadline: Math.round(hoursToDeadline * 100) / 100,
          picker: null // Will be populated when associations are fixed
        });
      }

      return ResponseHandler.success(res, {
        slaMetrics,
        summary: {
          onTimePercentage: Math.round((slaMetrics.onTime / slaMetrics.total) * 100),
          atRiskPercentage: Math.round((slaMetrics.atRisk / slaMetrics.total) * 100),
          breachedPercentage: Math.round((slaMetrics.breached / slaMetrics.total) * 100)
        }
      });

    } catch (error) {
      console.error('Get SLA status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get expiry alerts
   */
  static async getExpiryAlerts(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { daysThreshold = 7 } = req.query;
      const thresholdDate = new Date(Date.now() + parseInt(daysThreshold.toString()) * 24 * 60 * 60 * 1000);

      const expiringItems = await PicklistItem.findAll({
        where: {
          expiryDate: {
            [require('sequelize').Op.lte]: thresholdDate
          },
          status: ['PENDING', 'PICKING']
        },
        order: [['expiryDate', 'ASC']]
      });

      const alerts = expiringItems.map(item => ({
        id: item.id,
        sku: item.sku,
        productName: item.productName,
        expiryDate: item.expiryDate,
        daysUntilExpiry: Math.ceil((item.expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        waveNumber: 'N/A', // Will be populated when associations are fixed
        wavePriority: 'N/A', // Will be populated when associations are fixed
        orderId: item.orderId,
        urgency: item.expiryDate!.getTime() <= Date.now() ? 'EXPIRED' : 
                item.expiryDate!.getTime() <= Date.now() + 24 * 60 * 60 * 1000 ? 'CRITICAL' :
                item.expiryDate!.getTime() <= Date.now() + 3 * 24 * 60 * 60 * 1000 ? 'HIGH' : 'MEDIUM'
      }));

      return ResponseHandler.success(res, {
        totalAlerts: alerts.length,
        alerts: alerts.sort((a, b) => {
          const urgencyOrder = { 'EXPIRED': 0, 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
          return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
        })
      });

    } catch (error) {
      console.error('Get expiry alerts error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}

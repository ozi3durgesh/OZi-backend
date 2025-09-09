// controllers/pickingController.ts
import { Request, Response } from 'express';
import { PickingWave, PicklistItem, PickingException, User, Order, ScannerBin, ScannerSku } from '../models';
import { ResponseHandler } from '../middleware/responseHandler';
import { OrderAttributes } from '../types';
import Product from '../models/productModel';
import { Sequelize, Op } from 'sequelize';

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
        tagsAndBags = false
      } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return ResponseHandler.error(res, 'Order IDs array is required. Please provide the order_id values (e.g., ["ozi17559724672480002"])', 400);
      }

      // Enforce one-order-per-wave restriction
      if (orderIds.length > 1) {
        return ResponseHandler.error(res, 'Only one order can be picked per wave. Multiple orders are not allowed.', 400);
      }

      // Check for duplicate order IDs in the request
      const uniqueOrderIds = orderIds.filter((id, index) => orderIds.indexOf(id) === index);
      if (uniqueOrderIds.length !== orderIds.length) {
        return ResponseHandler.error(res, 'Duplicate order IDs are not allowed', 400);
      }

      // Check if any orders are already in existing picking waves
      const existingOrderIds = await PicklistItem.findAll({
        where: { orderId: uniqueOrderIds },
        attributes: ['orderId'],
        group: ['orderId']
      });

      if (existingOrderIds.length > 0) {
        const duplicateOrders = existingOrderIds.map(item => item.orderId);
        return ResponseHandler.error(res, `Some orders are already in existing picking waves: ${duplicateOrders.join(', ')}`, 409);
      }

      // Validate orders exist and are eligible for picking
      const orders = await Order.findAll({
        where: { order_id: uniqueOrderIds },
        attributes: ['id', 'order_id', 'order_amount', 'created_at', 'cart']
      });

      if (orders.length !== uniqueOrderIds.length) {
        return ResponseHandler.error(res, `Some order IDs not found: ${uniqueOrderIds.filter(id => !orders.find(order => order.get({ plain: true }).order_id === id)).join(', ')}`, 404);
      }

      // Create one wave per order (one-order-per-wave restriction)
      const waves: any[] = [];
      for (const order of orders) {
        const orderData = order.get({ plain: true });
        const waveNumber = `W${Date.now()}-${orderData.order_id}`;
        
        // Calculate SLA deadline (24 hours from now for demo)
        const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Calculate total items for this single order
        let totalItems = 0;
        if (orderData.cart && Array.isArray(orderData.cart)) {
          // Count the actual number of items in the cart, not the price amounts
          // If cart items have quantity field, sum those; otherwise count by array length
          totalItems = orderData.cart.reduce((sum: number, item: any) => {
            return sum + (item.quantity || 1);
          }, 0);
        }
        
        const wave = await PickingWave.create({
          waveNumber,
          status: 'GENERATED',
          priority,
          totalOrders: 1, // Always 1 order per wave
          totalItems: totalItems,
          estimatedDuration: 2, // 2 minutes per order (fixed for single order)
          slaDeadline,
          routeOptimization,
          fefoRequired,
          tagsAndBags
        } as any);
        

        // Create picklist items for this single order
        let actualTotalItems = 0;
        let createdItems = 0;
        
        if (orderData.cart && Array.isArray(orderData.cart)) {
          
          for (let i = 0; i < orderData.cart.length; i++) {
            const item = orderData.cart[i];
            
            // More flexible validation - check for sku and either amount or quantity
            if (item && item.sku !== undefined && item.sku !== null) {
              // For cart items with amount but no quantity, use amount as quantity
              // This handles the case where cart items have {sku: 123, amount: 25.99}
              const quantity = item.quantity || (item.amount ? 1 : 1);
              
              try {
                // Find the SKU in ScannerSku table to get bin location
                const scannerSku = await ScannerSku.findOne({
                  where: { skuScanId: item.sku.toString() }
                });

                if (!scannerSku) {
                  throw new Error(`SKU ${item.sku} not found in scanner system. Please ensure the SKU is properly scanned and registered.`);
                }

                // Get the bin location from ScannerBin table
                const scannerBin = await ScannerBin.findOne({
                  where: {
                    binLocationScanId: scannerSku.binLocationScanId
                  }
                });

                if (!scannerBin) {
                  throw new Error(`Bin location not found for SKU ${item.sku}. Please ensure the bin location is properly scanned and registered.`);
                }

                // Use the actual bin location from scanner system
                const binLocation = scannerBin.binLocationScanId;

                const picklistItem = await PicklistItem.create({
                  waveId: wave.id,
                  orderId: orderData.id, // Keep using internal ID for database relationships
                  sku: item.sku.toString(), // Convert number to string for storage
                  productName: `Product-${item.sku}`, // Generate product name from SKU
                  binLocation: binLocation, // Use actual bin location from scanner system
                  quantity: quantity, // Use quantity or default to 1
                  scanSequence: Math.floor(Math.random() * 100) + 1, // Random sequence for demo
                  fefoBatch: fefoRequired ? `BATCH-${Date.now()}` : undefined,
                  expiryDate: fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
                } as any);
                
                createdItems++;
                actualTotalItems += quantity;
                
              } catch (createError) {
                console.error(`Error creating picklist item:`, createError);
              }
            } else {
            }
          }
        } else {
        }
        
        // Update wave with actual counts
        await wave.update({
          totalItems: actualTotalItems
        });

        waves.push(wave);
      }

      return ResponseHandler.success(res, {
        message: `Generated ${waves.length} picking wave(s) - one order per wave`,
        waves: waves.map((wave, index) => ({
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          totalOrders: wave.totalOrders,
          totalItems: wave.totalItems,
          estimatedDuration: wave.estimatedDuration,
          slaDeadline: wave.slaDeadline,
          orderId: orders[index].get({ plain: true }).order_id // Include the order_id for each wave
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
      const { maxWavesPerPicker = 3, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

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

      // Find unassigned waves with pagination
      const unassignedWaves = await PickingWave.findAndCountAll({
        where: { status: 'GENERATED' },
        order: [['priority', 'DESC'], ['slaDeadline', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
      });

      if (unassignedWaves.count === 0) {
        return ResponseHandler.success(res, { 
          message: 'No unassigned waves found',
          pagination: {
            page: parseInt(page.toString()),
            limit: parseInt(limit.toString()),
            total: 0,
            totalPages: 0
          }
        });
      }

      // Assign waves to pickers (only from current page)
      const assignments: any[] = [];
      let pickerIndex = 0;

      for (const wave of unassignedWaves.rows) {
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
        assignments,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: unassignedWaves.count,
          totalPages: Math.ceil(unassignedWaves.count / parseInt(limit.toString()))
        }
      });

    } catch (error) {
      console.error('Assign waves error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Manually assign a specific wave to a specific picker
   */
  static async assignWaveToPicker(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId, pickerId, priority } = req.body;

      if (!waveId || !pickerId) {
        return ResponseHandler.error(res, 'Wave ID and picker ID are required', 400);
      }

      // Validate wave exists and is available for assignment
      const wave = await PickingWave.findByPk(waveId);
      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      if (wave.status !== 'GENERATED') {
        return ResponseHandler.error(res, `Wave is not available for assignment. Current status: ${wave.status}`, 400);
      }

      // Validate picker exists and has picking permissions
      const picker = await User.findByPk(pickerId, {
        include: [{
          association: 'Role',
          include: ['Permissions']
        }],
        attributes: ['id', 'email', 'availabilityStatus', 'isActive']
      });

      if (!picker) {
        return ResponseHandler.error(res, 'Picker not found', 404);
      }

      if (!picker.isActive) {
        return ResponseHandler.error(res, 'Picker is not active', 400);
      }

      if (picker.availabilityStatus !== 'available') {
        return ResponseHandler.error(res, `Picker is not available. Current status: ${picker.availabilityStatus}`, 400);
      }

      // Check if picker has picking permissions
      const permissions = (picker as any).Role?.Permissions || [];
      const hasPickingPermission = permissions.some((p: any) => 
        p.module === 'picking' && ['view', 'assign_manage', 'execute'].includes(p.action)
      );

      if (!hasPickingPermission) {
        return ResponseHandler.error(res, 'Picker does not have picking permissions', 403);
      }

      // Check if picker can handle more waves (max 3)
      const pickerWaves = await PickingWave.count({
        where: { pickerId: picker.id, status: ['ASSIGNED', 'PICKING'] }
      });

      if (pickerWaves >= 20) {
        return ResponseHandler.error(res, 'Picker has reached maximum wave limit (3)', 400);
      }

      // Update wave with assignment
      await wave.update({
        status: 'ASSIGNED',
        pickerId: picker.id,
        assignedAt: new Date(),
        priority: priority || wave.priority // Use provided priority or keep existing
      });

      return ResponseHandler.success(res, {
        message: 'Wave assigned successfully',
        assignment: {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          pickerId: picker.id,
          pickerEmail: picker.email,
          assignedAt: wave.assignedAt,
          priority: wave.priority
        }
      });

    } catch (error) {
      console.error('Assign wave to picker error:', error);
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
      const { page = 1, limit = 20 } = req.query;
      const pickerId = req.user!.id;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

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

      // Get picklist items with pagination
      const picklistItems = await PicklistItem.findAndCountAll({
        where: { waveId },
        order: [['scanSequence', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
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
        picklistItems: picklistItems.rows.map(item => ({
          id: item.id,
          sku: item.sku,
          productName: item.productName,
          binLocation: item.binLocation,
          quantity: item.quantity,
          scanSequence: item.scanSequence,
          fefoBatch: item.fefoBatch,
          expiryDate: item.expiryDate
        })),
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: picklistItems.count,
          totalPages: Math.ceil(picklistItems.count / parseInt(limit.toString()))
        }
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
   * Scan bin location for validation using new scanner tables
   */
  static async scanBinLocation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.params;
      const { scannedId, skuID, binlocation } = req.body;
      const pickerId = req.user!.id;

      if (!scannedId || !skuID || !binlocation) {
        return ResponseHandler.error(res, 'scannedId, skuID, and binlocation are required', 400);
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

      // Check if scannedId and binlocation match
      if (scannedId !== binlocation) {
        return ResponseHandler.error(res, 'Scanned ID and bin location do not match', 400);
      }

      // Find bin location in scanner_bin table
      const scannerBin = await ScannerBin.findOne({
        where: { binLocationScanId: binlocation }
      });

      if (!scannerBin) {
        return ResponseHandler.success(res, {
          message: 'Bin location not found in system',
          binLocationFound: false,
          scannedId,
          binlocation,
          waveId: parseInt(waveId),
          error: 'INVALID_BIN_LOCATION'
        });
      }

      // Check if SKU exists in the bin location's SKU array
      const skuExists = scannerBin.sku.includes(skuID);
      
      if (!skuExists) {
        return ResponseHandler.success(res, {
          message: 'SKU not found at this bin location',
          binLocationFound: false,
          scannedId,
          skuID,
          binlocation,
          waveId: parseInt(waveId),
          error: 'SKU_NOT_FOUND_AT_LOCATION'
        });
      }

      // Find picklist items with matching bin location
      const picklistItems = await PicklistItem.findAll({
        where: { 
          waveId: parseInt(waveId),
          binLocation: binlocation,
          status: ['PENDING', 'PICKING']
        }
      });

      const binLocationFound = picklistItems.length > 0;

      return ResponseHandler.success(res, {
        message: binLocationFound ? 'Bin location and SKU validated successfully' : 'Bin location validated but no picklist items found',
        binLocationFound,
        scannedId,
        skuID,
        binlocation,
        availableSkus: scannerBin.sku,
        totalSkusAtLocation: scannerBin.sku.length,
        picklistItems: picklistItems.map(item => ({
          id: item.id,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          status: item.status,
          scanSequence: item.scanSequence
        })),
        waveId: parseInt(waveId)
      });

    } catch (error) {
      console.error('Scan bin location error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Scan SKU for validation using new scanner tables
   */
  static async scanSku(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.params;
      const { scannedId, skuID, binlocation } = req.body;
      const pickerId = req.user!.id;

      if (!scannedId || !skuID || !binlocation) {
        return ResponseHandler.error(res, 'scannedId, skuID, and binlocation are required', 400);
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

      // Check if scannedId and skuID match
      if (scannedId !== skuID) {
        return ResponseHandler.error(res, 'Scanned ID and SKU ID do not match', 400);
      }

      // Find SKU scan in scanner_sku table
      const scannerSku = await ScannerSku.findOne({
        where: { skuScanId: skuID }
      });

      if (!scannerSku) {
        return ResponseHandler.success(res, {
          message: 'SKU scan not found in system',
          skuFound: false,
          scannedId,
          skuID,
          waveId: parseInt(waveId),
          error: 'INVALID_SKU_SCAN'
        });
      }

      // Check if binlocation matches the binLocationScanId in scanner_sku table
      if (scannerSku.binLocationScanId !== binlocation) {
        return ResponseHandler.success(res, {
          message: 'Bin location does not match SKU scan location',
          skuFound: false,
          scannedId,
          skuID,
          binlocation,
          expectedBinLocation: scannerSku.binLocationScanId,
          waveId: parseInt(waveId),
          error: 'BIN_LOCATION_MISMATCH'
        });
      }

      // Find picklist item with matching SKU and bin location
      const currentItem = await PicklistItem.findOne({
        where: { 
          waveId: parseInt(waveId),
          sku: skuID,
          binLocation: binlocation,
          status: ['PENDING', 'PICKING']
        }
      });

      if (!currentItem) {
        return ResponseHandler.success(res, {
          message: 'No matching picklist item found',
          skuFound: false,
          scannedId,
          skuID,
          binlocation,
          waveId: parseInt(waveId),
          error: 'NO_MATCHING_PICKLIST_ITEM'
        });
      }

      // Update item status to PICKED
      await currentItem.update({
        status: 'PICKED',
        pickedQuantity: currentItem.quantity,
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
          status: 'PACKED',
          completedAt: new Date()
        });
      }

      return ResponseHandler.success(res, {
        message: 'SKU validated and item picked successfully',
        skuFound: true,
        scannedId,
        skuID,
        binlocation,
        skuData: scannerSku.sku,
        item: {
          id: currentItem.id,
          sku: currentItem.sku,
          productName: currentItem.productName,
          status: 'PICKED',
          pickedQuantity: currentItem.quantity,
          remainingQuantity: 0
        },
        waveStatus: wave.status,
        remainingItems
      });

    } catch (error) {
      console.error('Scan SKU error:', error);
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
        status: 'PACKED',
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
      const { waveId, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      const whereClause: any = {};
      if (waveId) whereClause.id = parseInt(waveId.toString());

      const waves = await PickingWave.findAndCountAll({
        where: whereClause,
        order: [['slaDeadline', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
      });

      const now = new Date();
      const slaMetrics = {
        total: waves.count,
        onTime: 0,
        atRisk: 0,
        breached: 0,
        waves: [] as any[]
      };

      for (const wave of waves.rows) {
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
        },
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: waves.count,
          totalPages: Math.ceil(waves.count / parseInt(limit.toString()))
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
      const { daysThreshold = 7, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
      const thresholdDate = new Date(Date.now() + parseInt(daysThreshold.toString()) * 24 * 60 * 60 * 1000);

      const expiringItems = await PicklistItem.findAndCountAll({
        where: {
          expiryDate: {
            [require('sequelize').Op.lte]: thresholdDate
          },
          status: ['PENDING', 'PICKING']
        },
        order: [['expiryDate', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
      });

      const alerts = expiringItems.rows.map(item => ({
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
        totalAlerts: expiringItems.count,
        alerts: alerts.sort((a, b) => {
          const urgencyOrder = { 'EXPIRED': 0, 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
          return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
        }),
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: expiringItems.count,
          totalPages: Math.ceil(expiringItems.count / parseInt(limit.toString()))
        }
      });

    } catch (error) {
      console.error('Get expiry alerts error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get picklist items for a wave with pagination
   */
  static async getPicklistItems(req: AuthRequest, res: Response): Promise<Response> {
  try {
     const { waveId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    // Verify wave exists
    const wave = await PickingWave.findByPk(waveId);
    if (!wave) {
      return ResponseHandler.error(res, 'Wave not found', 404);
    }

    // Check permissions
    const userPermissions = req.user!.permissions || [];
    const canView =
      userPermissions.includes('picking:view') ||
      userPermissions.includes('picking:assign_manage') ||
      (userPermissions.includes('picking:execute') && wave.pickerId === req.user!.id);
    if (!canView) {
      return ResponseHandler.error(res, 'Insufficient permissions to view this wave', 403);
    }

    // Build where clause
    const whereClause: any = { waveId: parseInt(waveId) };
    if (status) whereClause.status = status;
    console.log('Querying for waveId:', waveId);
    console.log('Where clause:', whereClause);

    // Extend PicklistItem type to include productInfo
    interface PicklistItemWithProduct extends PicklistItem {
      productInfo?: Product;
    }

    // Fetch picklist items with included Product info
    const picklistItems = await PicklistItem.findAndCountAll({
  where: whereClause,
  order: [['scanSequence', 'ASC']],
  limit: parseInt(limit.toString()),
  offset,
  include: [
    {
      model: Product,
      as: 'productInfo',
      attributes: ['ImageURL', 'EAN_UPC', 'MRP'],
      required: false, // Left join
    }
  ],
  logging: console.log,  // Enable SQL query logging
}) as { count: number; rows: PicklistItemWithProduct[] };

    // Debug logging
  /*  picklistItems.rows.forEach(item => {
  console.log(`- ID: ${item.id}, SKU: ${item.sku}, Qty: ${item.quantity}`);
  if (item.productInfo) {
    console.log(`   Product -> ImageURL: ${item.productInfo.ImageURL}, EAN: ${item.productInfo.EAN_UPC}, MRP: ${item.productInfo.MRP}`);
  } else {
    console.log('   Product -> Not found');
  }
});*/

    // Build API response
    return ResponseHandler.success(res, {
  wave: {
    id: wave.id,
    waveNumber: wave.waveNumber,
    status: wave.status,
    totalItems: wave.totalItems,
  },
  items: picklistItems.rows.map(item => ({
    id: item.id,
    orderId: item.orderId,
    sku: item.sku,
    productName: item.productName,
    binLocation: item.binLocation,
    quantity: item.quantity,
    status: item.status,
    scanSequence: item.scanSequence,
    fefoBatch: item.fefoBatch,
    expiryDate: item.expiryDate,
    pickedQuantity: item.pickedQuantity,
    partialReason: item.partialReason,
    imageUrl: item.productInfo?.ImageURL || null,  // Safely access productInfo
    ean: item.productInfo?.EAN_UPC || null,
    mrp: item.productInfo?.MRP || null,
  })),
  pagination: {
    page: parseInt(page.toString()),
    limit: parseInt(limit.toString()),
    total: picklistItems.count,
    totalPages: Math.ceil(picklistItems.count / parseInt(limit.toString()))
  }
});

  } catch (error) {
    console.error('Get picklist items error:', error);
    return ResponseHandler.error(res, 'Internal server error', 500);
  }
 }

}


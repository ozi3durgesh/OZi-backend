// controllers/pickingController.ts
import { Request, Response } from 'express';
import { PickingWave, PicklistItem, PickingException, User, Order, ScannerBin, ScannerSku, Role } from '../models';
import { ResponseHandler } from '../middleware/responseHandler';
import { OrderAttributes } from '../types';
import Product from '../models/productModel';
import { Sequelize, Op } from 'sequelize';
import DirectInventoryService from '../services/DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';
import { socketManager } from '../utils/socketManager';
import { sendPushNotification } from '../services/snsService';
import UserDevice from '../models/userDevice';
import { PICKING_CONSTANTS } from '../config/pickingConstants';

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

      // ✅ Use fc_id (multi-FC)
      const fcId = req.user?.fc_id;
      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return ResponseHandler.error(
          res,
          'Order IDs array is required. Please provide the order_id values (e.g., ["ozi17559724672480002"])',
          400
        );
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

      // ✅ Check if any orders are already in existing picking waves (scoped by FC)
      const existingOrderIds = await PicklistItem.findAll({
        where: { 
          orderId: uniqueOrderIds,
          fulfillment_center_id: fcId // FC-scoped duplicate check
        },
        attributes: ['orderId'],
        group: ['orderId']
      });

      if (existingOrderIds.length > 0) {
        const duplicateOrders = existingOrderIds.map(item => item.orderId);
        return ResponseHandler.error(res, `Some orders are already in existing picking waves: ${duplicateOrders.join(', ')}`, 409);
      }

      // ✅ Fetch orders belonging to this FC
      const orders = await Order.findAll({
        where: { order_id: uniqueOrderIds, fc_id: fcId },
        attributes: ['id', 'order_id', 'order_amount', 'created_at', 'cart']
      });

      if (orders.length !== uniqueOrderIds.length) {
        return ResponseHandler.error(
          res,
          `Some order IDs not found for FC ${fcId}: ${uniqueOrderIds.filter(id => !orders.find(order => order.get({ plain: true }).order_id === id)).join(', ')}`,
          404
        );
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
          totalItems = orderData.cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        }
        
        // ✅ Create picking wave linked to FC
        const wave = await PickingWave.create({
          waveNumber,
          status: 'GENERATED',
          priority,
          totalOrders: 1,
          totalItems,
          estimatedDuration: 2,
          slaDeadline,
          routeOptimization,
          fefoRequired,
          tagsAndBags,
          orderId: orderData.id,
          fulfillment_center_id: fcId // ✅ associate wave with fulfillment center
        } as any);
        
        // Create picklist items for this single order
        let actualTotalItems = 0;
        let createdItems = 0;
        
        if (orderData.cart && Array.isArray(orderData.cart)) {
          for (let i = 0; i < orderData.cart.length; i++) {
            const item = orderData.cart[i];
            if (item && item.sku !== undefined && item.sku !== null) {
              const quantity = item.quantity || (item.amount ? 1 : 1);
              try {
                const skuString = item.sku.toString();

                // Ensure SKU exists
                let productExists = await Product.findOne({ where: { sku: skuString } });
                if (!productExists) {
                  console.log(`📦 Creating placeholder product for SKU ${skuString}`);
                  try {
                    await Product.create({
                      SKU: skuString,
                      ProductName: `Product-${skuString}`,
                      ImageURL: '',
                      EAN_UPC: '',
                      MRP: orderData.order_amount || 0.00,
                      CreatedDate: new Date().toISOString(),
                      updated_at: new Date()
                    } as any);
                    console.log(`✅ Created placeholder product for SKU ${skuString}`);
                  } catch (productCreateError: any) {
                    console.error(`❌ Failed to create placeholder product for SKU ${skuString}:`, productCreateError.message);
                  }
                } else {
                  const currentMRP = parseFloat(String(productExists.mrp || '0'));
                  const orderMRP = orderData.order_amount || 0.00;
                  if (orderMRP > 0 && orderMRP !== currentMRP) {
                    console.log(`📦 Updating MRP for existing SKU ${skuString} from ${currentMRP} to ${orderMRP}`);
                    try {
                      await Product.update(
                        { mrp: orderMRP, updated_at: new Date() },
                        { where: { sku: skuString } }
                      );
                      console.log(`✅ Updated MRP for SKU ${skuString}`);
                    } catch (updateError: any) {
                      console.error(`❌ Failed to update MRP for SKU ${skuString}:`, updateError.message);
                    }
                  }
                }

                // Find SKU in ScannerSku table
                const scannerSku = await ScannerSku.findOne({ where: { skuScanId: skuString } });
                let binLocation: string = PICKING_CONSTANTS.DEFAULT_BIN_LOCATION;
                let productName = `Product-${skuString}`;

                if (scannerSku) {
                  const scannerBin = await ScannerBin.findOne({
                    where: { binLocationScanId: scannerSku.binLocationScanId }
                  });
                  if (scannerBin) {
                    binLocation = scannerBin.binLocationScanId;
                  } else {
                    console.warn(`${PICKING_CONSTANTS.LOG_MESSAGES.BIN_LOCATION_NOT_FOUND.replace('SKU', `SKU ${skuString}`)}`);
                    // Category-based fallback
                    const product = await Product.findOne({
                      where: { [PICKING_CONSTANTS.COLUMNS.SKU]: skuString },
                      attributes: [PICKING_CONSTANTS.COLUMNS.CATEGORY]
                    });
                    if (product && product.category) {
                      const { BinLocation } = await import('../models/index.js');
                      const categoryBasedBin = await BinLocation.findOne({
                        where: Sequelize.and(
                          { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                          Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                        ),
                        order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC
                      });
                      if (categoryBasedBin) {
                        binLocation = categoryBasedBin.get('bin_code');
                        console.log(`✅ Found category-based bin: ${binLocation}`);
                      } else {
                        console.warn(`No active bin found for category "${product.category}". Using default.`);
                      }
                    } else {
                      console.warn(`No category found for SKU ${skuString}. Using default bin location.`);
                    }
                  }
                } else {
                  console.warn(`${PICKING_CONSTANTS.LOG_MESSAGES.SKU_NOT_FOUND_IN_SCANNER.replace('SKU', `SKU ${skuString}`)}`);
                  const product = await Product.findOne({
                    where: { sku: skuString },
                    attributes: ['Category']
                  });
                  if (product && product.category) {
                    const { BinLocation } = await import('../models/index.js');
                    const { Sequelize } = require('sequelize');
                    const categoryBasedBin = await BinLocation.findOne({
                      where: Sequelize.and(
                        { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                        Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                      ),
                      order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC
                    });
                    if (categoryBasedBin) {
                      binLocation = categoryBasedBin.bin_code;
                      console.log(`✅ Found category-based bin: ${binLocation}`);
                    } else {
                      console.warn(`No active bin found for category "${product.category}". Using default.`);
                    }
                  } else {
                    console.warn(`No category found for SKU ${skuString}. Using default bin location.`);
                  }
                }

                // ✅ Create picklist item with FC linkage
                const picklistItem = await PicklistItem.create({
                  waveId: wave.id,
                  orderId: orderData.id,
                  sku: skuString,
                  productName: productName,
                  binLocation: binLocation,
                  quantity: quantity,
                  scanSequence: Math.floor(Math.random() * 100) + 1,
                  fefoBatch: fefoRequired ? `BATCH-${Date.now()}` : undefined,
                  expiryDate: fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
                  fulfillment_center_id: fcId // ✅ new
                } as any);

                createdItems++;
                actualTotalItems += quantity;
                console.log(`Created picklist item for SKU ${item.sku}`);
              } catch (createError) {
                console.error(`Error creating picklist item for SKU ${item.sku}:`, createError);
                // Fallback creation (kept exactly like your code)
                try {
                  const skuString = item.sku.toString();
                  let productExists = await Product.findOne({ where: { sku: skuString } });
                  if (!productExists) {
                    console.log(`📦 Creating placeholder product for SKU ${skuString} (fallback)`);
                    await Product.create({
                      SKU: skuString,
                      ProductName: `Product-${skuString}`,
                      ImageURL: '',
                      EAN_UPC: '',
                      MRP: orderData.order_amount || 0.00,
                      CreatedDate: new Date().toISOString(),
                      updated_at: new Date()
                    } as any);
                  }
                  const picklistItem = await PicklistItem.create({
                    waveId: wave.id,
                    orderId: orderData.id,
                    sku: skuString,
                    productName: `Product-${skuString}`,
                    binLocation: PICKING_CONSTANTS.DEFAULT_BIN_LOCATION,
                    quantity: quantity,
                    scanSequence: Math.floor(Math.random() * 100) + 1,
                    fefoBatch: fefoRequired ? `BATCH-${Date.now()}` : undefined,
                    expiryDate: fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
                    fulfillment_center_id: fcId // ✅ new
                  } as any);
                  createdItems++;
                  actualTotalItems += quantity;
                } catch (fallbackError) {
                  console.error(`Failed to create fallback picklist item for SKU ${item.sku}:`, fallbackError);
                }
              }
            }
          }
        }
        
        // Update wave with actual counts
        await wave.update({ totalItems: actualTotalItems });
        waves.push(wave);
      }

      return ResponseHandler.success(
        res,
        {
          message: `Generated ${waves.length} picking wave(s) for fulfillment center ${fcId} - one order per wave`,
          waves: waves.map((wave, index) => ({
            id: wave.id,
            waveNumber: wave.waveNumber,
            status: wave.status,
            totalOrders: wave.totalOrders,
            totalItems: wave.totalItems,
            estimatedDuration: wave.estimatedDuration,
            slaDeadline: wave.slaDeadline,
            orderId: orders[index].get({ plain: true }).order_id
          }))
        },
        201
      );
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

      // ✅ Get current FC context
      const fcId = req.user?.fc_id;
      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      // ✅ Find available pickers (users linked to this FC)
      const availablePickers = await User.findAll({
        where: {
          isActive: true,
          availabilityStatus: 'available'
        },
        include: [
          {
            association: 'Role',
            include: ['Permissions']
          },
          {
            association: 'UserFulfillmentCenters', // ✅ ensure picker belongs to this FC
            where: { fc_id: fcId },
            required: true
          }
        ],
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
        return ResponseHandler.error(
          res,
          `No available pickers found for fulfillment center ${fcId}`,
          404
        );
      }

      // ✅ Find unassigned waves for this FC
      const unassignedWaves = await PickingWave.findAndCountAll({
        where: { status: 'GENERATED', fulfillment_center_id: fcId }, // ✅ added FC filter
        order: [['priority', 'DESC'], ['slaDeadline', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
      });

      if (unassignedWaves.count === 0) {
        return ResponseHandler.success(res, {
          message: `No unassigned waves found for fulfillment center ${fcId}`,
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
          where: {
            pickerId: picker.id,
            status: ['ASSIGNED', 'PICKING'],
            fulfillment_center_id: fcId // ✅ ensure counting within the same FC
          }
        });

        if (pickerWaves < parseInt(maxWavesPerPicker.toString())) {
          await wave.update({
            status: 'ASSIGNED',
            pickerId: picker.id,
            assignedAt: new Date()
          });

          // ✅ optional: emit FC-specific event
          socketManager.emit(`wave_assigned:${fcId}`, {
            waveId: wave.id,
            waveNumber: wave.waveNumber,
            pickerId: picker.id,
            pickerEmail: picker.email
          });

          assignments.push({
            waveId: wave.id,
            waveNumber: wave.waveNumber,
            pickerId: picker.id,
            pickerEmail: picker.email,
            assignedAt: wave.assignedAt,
            fc_id: fcId // ✅ include FC in response
          });
        }

        pickerIndex++;
      }

      return ResponseHandler.success(res, {
        message: `Assigned ${assignments.length} waves to pickers for fulfillment center ${fcId}`,
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
   * Get next available picker using round-robin assignment
   */
static async getNextPicker(fcId: number): Promise<any> {
    try {
      if (!fcId) {
        console.warn('⚠️ Missing fulfillment center context (fc_id) in getNextPicker');
        return null;
      }

      // ✅ Get all active pickers with picking permissions in this FC (roleId = 4 for wh_staff_2)
      const pickers = await User.findAll({
        where: {
          isActive: true,
          availabilityStatus: 'available',
          roleId: 4
        },
        include: [
          {
            association: 'UserFulfillmentCenters',
            where: { fc_id: fcId },
            required: true
          }
        ],
        order: [['id', 'ASC']],
        attributes: ['id', 'email', 'availabilityStatus']
      });

      if (pickers.length === 0) {
        console.warn(`⚠️ No available pickers found for fulfillment center ${fcId}`);
        return null;
      }

      // ✅ Find last assigned picker within the same FC
      const lastAssignedWave = await PickingWave.findOne({
        where: {
          fulfillment_center_id: fcId, // ✅ scoped to current FC
          pickerId: { [Op.ne]: null as any}
        },
        order: [['assignedAt', 'DESC']],
        attributes: ['pickerId']
      });

      let nextPickerIndex = 0;

      if (lastAssignedWave) {
        const lastPickerIndex = pickers.findIndex(p => p.id === lastAssignedWave.pickerId);
        if (lastPickerIndex !== -1) {
          nextPickerIndex = (lastPickerIndex + 1) % pickers.length;
        }
      }

      const nextPicker = pickers[nextPickerIndex];
      console.log(
        `Round-robin: Selected picker ${nextPicker.id} (${nextPicker.email}) from ${pickers.length} available pickers for FC ${fcId}`
      );

      return nextPicker;
    } catch (error) {
      console.error('Error getting next picker:', error);
      return null;
    }
  }


  /**
   * Manually assign a specific wave to a specific picker
   */
  static async assignWaveToPicker(req: AuthRequest | any, res: Response): Promise<Response> {
    try {
      const { waveId, pickerId, priority } = req.body;
      const fcId = req.user?.fc_id;

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      console.log(`🎯 Assignment request: waveId=${waveId}, pickerId=${pickerId}, priority=${priority}, fc_id=${fcId}`);

      if (!waveId) {
        return ResponseHandler.error(res, 'Wave ID is required', 400);
      }

      let targetPickerId = pickerId;

      // ✅ Round-robin if no picker provided
      if (!targetPickerId) {
        console.log(`Auto-assigning wave ${waveId} using round-robin for FC ${fcId}`);
        
        // ✅ Get available pickers for this FC
        const pickers = await User.findAll({
          where: {
            availabilityStatus: 'available',
            roleId: 4 // wh_staff_2 role has picking permissions
          },
          include: [
            {
              association: 'UserFulfillmentCenters',
              where: { fc_id: fcId },
              required: true
            }
          ],
          order: [['id', 'ASC']],
          attributes: ['id', 'email', 'availabilityStatus', 'isActive', 'roleId']
        });

        if (pickers.length === 0) {
          console.warn(`No available pickers found for FC ${fcId}`);
          return ResponseHandler.error(res, `No available pickers found for FC ${fcId}`, 400);
        }

        console.log(`Available pickers [FC ${fcId}]: ${pickers.map(p => `${p.id}(${p.email})`).join(', ')}`);

        // ✅ Get last assigned picker (within same FC)
        const lastAssignedWave = await PickingWave.findOne({
          where: Sequelize.and(
            { fulfillment_center_id: fcId },
            Sequelize.literal('pickerId IS NOT NULL')
          ),
          order: [['assignedAt', 'DESC']],
          attributes: ['pickerId']
        });

        let nextPickerIndex = 0;
        
        if (lastAssignedWave) {
          const lastPickerId = (lastAssignedWave as any).pickerId;
          console.log(`Last assigned picker ID for FC ${fcId}: ${lastPickerId}`);
          const lastPickerIndex = pickers.findIndex(p => p.id === lastPickerId);
          if (lastPickerIndex !== -1) {
            nextPickerIndex = (lastPickerIndex + 1) % pickers.length;
          }
        }

        const nextPicker = pickers[nextPickerIndex];
        targetPickerId = nextPicker.id;
        console.log(`Auto-assigned picker ${targetPickerId} (${nextPicker.email}) to wave ${waveId} for FC ${fcId}`);
      }

      // ✅ Validate wave belongs to same FC
      const wave = await PickingWave.findOne({
        where: { id: waveId, fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (wave.status !== 'GENERATED') {
        return ResponseHandler.error(
          res,
          `Wave is not available for assignment. Current status: ${wave.status}`,
          400
        );
      }

      // ✅ Validate picker exists in same FC
      const picker = await User.findOne({
        where: { id: targetPickerId },
        include: [
          {
            association: 'UserFulfillmentCenters',
            where: { fc_id: fcId },
            required: true
          }
        ],
        attributes: ['id', 'email', 'availabilityStatus', 'isActive', 'roleId']
      });

      if (!picker) {
        return ResponseHandler.error(res, `Picker not found in fulfillment center ${fcId}`, 404);
      }

      // Check if picker is available
      if (picker.availabilityStatus !== 'available') {
        return ResponseHandler.error(res, `Picker is not available. Current status: ${picker.availabilityStatus}`, 400);
      }

      // Check if picker has picking permissions (roleId = 4)
      if (picker.roleId !== 4) {
        return ResponseHandler.error(res, 'Picker does not have picking permissions', 403);
      }

      // ✅ Assign wave
      console.log(`Assigning wave ${waveId} (FC ${fcId}) to picker ${picker.id} (${picker.email})`);

      await wave.update({
        status: 'ASSIGNED',
        pickerId: targetPickerId,
        assignedAt: new Date(),
        priority: priority || wave.priority
      });

      console.log(`✅ Successfully assigned wave ${waveId} to picker ${picker.email} in FC ${fcId}`);

      // ✅ Optional socket notification
      if (typeof socketManager !== 'undefined') {
        socketManager.emit(`wave_assigned:${fcId}`, {
          waveId: wave.id,
          pickerId: picker.id,
          pickerEmail: picker.email,
          fc_id: fcId
        });
      }

      return ResponseHandler.success(res, {
        message: `Wave assigned successfully in fulfillment center ${fcId}`,
        assignment: {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          pickerId: targetPickerId,
          pickerEmail: picker.email,
          assignedAt: wave.assignedAt,
          priority: wave.priority,
          fc_id: fcId
        }
      });

    } catch (error) {
      console.error('Assign wave to picker error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }


  /**
   * Manually reassign a wave to a different picker
   */
  static async reassignWaveToPicker(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId, newPickerId, reason } = req.body;
      const fcId = req.user?.fc_id;

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      console.log(`🔄 Reassignment request: waveId=${waveId}, newPickerId=${newPickerId}, reason=${reason}, fc_id=${fcId}`);

      if (!waveId || !newPickerId) {
        return ResponseHandler.error(res, 'Wave ID and new picker ID are required', 400);
      }

      // ✅ Validate wave exists in current FC and is currently assigned
      const wave = await PickingWave.findOne({
        where: { id: waveId, fulfillment_center_id: fcId } // FC-scoped
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (!wave.pickerId) {
        return ResponseHandler.error(res, 'Wave is not currently assigned to any picker', 400);
      }

      if (wave.status === 'COMPLETED' || wave.status === 'CANCELLED') {
        return ResponseHandler.error(res, `Cannot reassign wave with status: ${wave.status}`, 400);
      }

      const oldPickerId = wave.pickerId;

      // ✅ Validate new picker exists in same FC
      const newPicker = await User.findOne({
        where: { id: newPickerId },
        include: [
          {
            association: 'UserFulfillmentCenters',
            where: { fc_id: fcId },
            required: true
          }
        ],
        attributes: ['id', 'email', 'availabilityStatus', 'isActive', 'roleId']
      });

      if (!newPicker) {
        return ResponseHandler.error(res, `New picker not found in fulfillment center ${fcId}`, 404);
      }

      // Check if new picker is available
      if (newPicker.availabilityStatus !== 'available') {
        return ResponseHandler.error(
          res,
          `New picker is not available. Current status: ${newPicker.availabilityStatus}`,
          400
        );
      }

      // Check if new picker has picking permissions (roleId 4 = wh_staff_2 has picking permissions)
      if (newPicker.roleId !== 4) {
        return ResponseHandler.error(res, 'New picker does not have picking permissions', 403);
      }

      // Prevent reassigning to the same picker
      if (oldPickerId === newPickerId) {
        return ResponseHandler.error(res, 'Cannot reassign wave to the same picker', 400);
      }

      console.log(`🔄 Reassigning wave ${waveId} (FC ${fcId}) from picker ${oldPickerId} to picker ${newPickerId} (${newPicker.email})`);

      // ✅ Update wave with new assignment
      await wave.update({
        pickerId: newPickerId,
        assignedAt: new Date(),
        status: wave.status === 'PICKING' ? 'PICKING' : 'ASSIGNED'
      });

      console.log(`✅ Successfully reassigned wave ${waveId} to picker ${newPicker.email} in FC ${fcId}`);

      // 🔥 Emit event to new assigned picker
      socketManager.emitToPicker(Number(newPickerId), 'waveReassigned', {
        waveId: wave.id,
        waveNumber: wave.waveNumber,
        orderId: wave.orderId,
        fc_id: fcId, // ✅ add fc_id
        assignment: {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          pickerId: newPickerId,
          pickerEmail: newPicker.email,
          assignedAt: wave.assignedAt,
          priority: wave.priority,
          reason: reason || 'Manual reassignment'
        }
      });
      console.log(`📨 Emitted waveReassigned to new picker_${newPickerId}`);

      // 🔥 Emit event to old picker to notify about reassignment
      socketManager.emitToPicker(Number(oldPickerId), 'waveUnassigned', {
        waveId: wave.id,
        waveNumber: wave.waveNumber,
        orderId: wave.orderId,
        fc_id: fcId, // ✅ add fc_id
        reason: reason || 'Wave reassigned to another picker',
        reassignedTo: {
          pickerId: newPickerId,
          pickerEmail: newPicker.email
        }
      });
      console.log(`📨 Emitted waveUnassigned to old picker_${oldPickerId}`);

      // 👉 Push Notification to new picker
      console.log(`🔍 Looking up new picker ${newPickerId} for push notification...`);
      const newPickerWithDevices = await User.findByPk(newPickerId, {
        include: [{ model: UserDevice, as: "devices" }],
      });

      if (newPickerWithDevices && (newPickerWithDevices as any).devices?.length > 0) {
        console.log(`📱 Found ${(newPickerWithDevices as any).devices.length} device(s) for new picker ${newPickerId}`);

        for (const device of (newPickerWithDevices as any).devices) {
          if (device.snsEndpointArn) {
            try {
              await sendPushNotification(
                device.snsEndpointArn,
                "📦 Wave Reassigned to You",
                `Wave #${wave.waveNumber} has been reassigned to you.`,
                { 
                  route: "/waves",
                  waveId: waveId.toString(),
                  fc_id: fcId, // ✅ include fc_id in payload
                  type: "wave_reassigned",
                  priority: wave.priority,
                  reason: reason || 'Manual reassignment'
                }
              );
              console.log(`✅ Push notification sent to new picker device ${device.id}`);
            } catch (pushError: any) {
              console.error(`❌ Failed to send push notification to new picker device ${device.id}:`, pushError.message);
            }
          }
        }
      }

      // 👉 Push Notification to old picker
      console.log(`🔍 Looking up old picker ${oldPickerId} for push notification...`);
      const oldPickerWithDevices = await User.findByPk(oldPickerId, {
        include: [{ model: UserDevice, as: "devices" }],
      });

      if (oldPickerWithDevices && (oldPickerWithDevices as any).devices?.length > 0) {
        console.log(`📱 Found ${(oldPickerWithDevices as any).devices.length} device(s) for old picker ${oldPickerId}`);

        for (const device of (oldPickerWithDevices as any).devices) {
          if (device.snsEndpointArn) {
            try {
              await sendPushNotification(
                device.snsEndpointArn,
                "📦 Wave Unassigned",
                `Wave #${wave.waveNumber} has been reassigned to another picker.`,
                { 
                  route: "/waves",
                  waveId: waveId.toString(),
                  fc_id: fcId, // ✅ include fc_id in payload
                  type: "wave_unassigned",
                  reason: reason || 'Wave reassigned to another picker'
                }
              );
              console.log(`✅ Push notification sent to old picker device ${device.id}`);
            } catch (pushError: any) {
              console.error(`❌ Failed to send push notification to old picker device ${device.id}:`, pushError.message);
            }
          }
        }
      }

      return ResponseHandler.success(res, {
        message: `Wave reassigned successfully in fulfillment center ${fcId}`,
        reassignment: {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          oldPickerId: oldPickerId,
          newPickerId: newPickerId,
          newPickerEmail: newPicker.email,
          reassignedAt: wave.assignedAt,
          reason: reason || 'Manual reassignment',
          priority: wave.priority,
          fc_id: fcId // ✅ include fc_id in response
        }
      });

    } catch (error) {
      console.error('Reassign wave to picker error:', error);
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

      // ✅ Extract FC ID from user
      const fcId = req.user?.fc_id;
      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      const whereClause: any = { fulfillment_center_id: fcId }; // ✅ Scope all queries to current FC
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;

      // Role-based filtering: Dynamic role checking from database
      const user = req.user;
      if (!user) {
        return ResponseHandler.error(res, 'User not authenticated', 401);
      }

      // Get user's role from database to check permissions dynamically
      const userWithRole = await User.findByPk(user.id, {
        include: [{
          model: Role,
          as: 'Role',
          attributes: ['id', 'name']
        }]
      });

      if (!userWithRole) {
        return ResponseHandler.error(res, 'User not found', 404);
      }

      const userRole = userWithRole.Role;
      const isAdmin = userRole?.name === 'admin' || user.permissions?.includes('admin:all');

      if (!isAdmin) {
        // Non-admin users can only see waves assigned to them
        whereClause.pickerId = user.id;
        console.log(`🔒 Filtering waves for user ${user.id} in FC ${fcId} with role: ${userRole?.name || 'unknown'}`);
      } else {
        console.log(`👑 Admin user ${user.id} (role: ${userRole?.name}) can view all waves in FC ${fcId}`);
      }

      // ✅ Fetch only waves for this FC
      const waves = await PickingWave.findAndCountAll({
        where: whereClause,
        order: [['id', 'DESC']],
        limit: parseInt(limit.toString()),
        offset
      });

      return ResponseHandler.success(res, {
        message: `Waves fetched successfully for fulfillment center ${fcId}`,
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
      const fcId = req.user?.fc_id; // ✅ current fulfillment center
      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      console.log(`🚀 Start picking request: waveId=${waveId}, pickerId=${pickerId}, fc_id=${fcId}`);

      // ✅ Fetch wave only within user's fulfillment center
      const wave = await PickingWave.findOne({
        where: { id: waveId, fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (wave.status !== 'ASSIGNED') {
        return ResponseHandler.error(res, `Wave is not in ASSIGNED status (current: ${wave.status})`, 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'Wave is not assigned to you', 403);
      }

      // ✅ Update wave status to PICKING
      await wave.update({
        status: 'PICKING',
        startedAt: new Date()
      });

      console.log(`✅ Wave ${wave.waveNumber} (FC ${fcId}) marked as PICKING by picker ${pickerId}`);

      // ✅ Fetch picklist items for this wave (scoped by FC)
      const picklistItems = await PicklistItem.findAndCountAll({
        where: { 
          waveId: wave.id,
          fulfillment_center_id: fcId 
        },
        order: [['scanSequence', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
      });

      console.log(`📦 Found ${picklistItems.count} picklist items for wave ${wave.waveNumber} in FC ${fcId}`);

      return ResponseHandler.success(res, {
        message: `Picking started successfully in fulfillment center ${fcId}`,
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
      const fcId = req.user?.fc_id; // ✅ current fulfillment center

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      if (!sku || !binLocation) {
        return ResponseHandler.error(res, 'SKU and bin location are required', 400);
      }

      console.log(`📦 Scan item request: waveId=${waveId}, sku=${sku}, bin=${binLocation}, fc_id=${fcId}, picker=${pickerId}`);

      // ✅ Find the picklist item in this FC
      const picklistItem = await PicklistItem.findOne({
        where: {
          waveId: parseInt(waveId),
          sku,
          binLocation,
          fulfillment_center_id: fcId, // ✅ ensure the item belongs to same FC
          status: ['PENDING', 'PICKING']
        }
      });

      if (!picklistItem) {
        return ResponseHandler.error(res, `Item not found in picklist for fulfillment center ${fcId}`, 404);
      }

      // ✅ Fetch wave and ensure it belongs to this FC
      const wave = await PickingWave.findOne({
        where: { id: parseInt(waveId), fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'You are not assigned to this wave', 403);
      }

      // ✅ Update item status
      const pickedQuantity = Math.min(quantity, picklistItem.quantity);
      const newStatus = pickedQuantity === picklistItem.quantity ? 'PICKED' : 'PARTIAL';

      await picklistItem.update({
        status: newStatus,
        pickedQuantity: pickedQuantity,
        pickedAt: new Date(),
        pickedBy: pickerId
      });

      console.log(`✅ Updated picklist item ${picklistItem.id} in FC ${fcId}: status=${newStatus}, pickedQuantity=${pickedQuantity}`);

      // ✅ Check if all items in this FC’s wave are picked
      const remainingItems = await PicklistItem.count({
        where: {
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          status: ['PENDING', 'PICKING']
        }
      });

      if (remainingItems === 0) {
        await wave.update({
          status: 'COMPLETED',
          completedAt: new Date()
        });
        console.log(`🎯 Wave ${wave.waveNumber} (FC ${fcId}) marked as COMPLETED`);
      }

      return ResponseHandler.success(res, {
        message: `Item scanned successfully in fulfillment center ${fcId}`,
        item: {
          id: picklistItem.id,
          sku: picklistItem.sku,
          productName: picklistItem.productName,
          status: picklistItem.status,
          pickedQuantity: picklistItem.pickedQuantity,
          remainingQuantity: picklistItem.quantity - picklistItem.pickedQuantity
        },
        waveStatus: wave.status,
        remainingItems,
        fc_id: fcId
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
      const fcId = req.user?.fc_id; // ✅ current FC

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      if (!scannedId || !skuID || !binlocation) {
        return ResponseHandler.error(res, 'scannedId, skuID, and binlocation are required', 400);
      }

      console.log(`📍 Bin scan request: waveId=${waveId}, skuID=${skuID}, bin=${binlocation}, fc_id=${fcId}, picker=${pickerId}`);

      // ✅ Fetch wave only from the same FC
      const wave = await PickingWave.findOne({
        where: { id: parseInt(waveId), fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'You are not assigned to this wave', 403);
      }

      // ✅ Check for any picklist items with DEFAULT-BIN location for this SKU (scoped by FC)
      const defaultBinItems = await PicklistItem.findAll({
        where: { 
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          sku: skuID,
          binLocation: 'DEFAULT-BIN',
          status: ['PENDING', 'PICKING']
        }
      });

      const hasDefaultBinItems = defaultBinItems.length > 0;

      // ✅ DEFAULT-BIN bypass logic
      if (hasDefaultBinItems) {
        console.log(`DEFAULT-BIN bypass [FC ${fcId}]: Allowing scan for SKU ${skuID} at bin ${binlocation}`);

        return ResponseHandler.success(res, {
          message: `DEFAULT-BIN item validated successfully in fulfillment center ${fcId}`,
          binLocationFound: true,
          scannedId,
          skuID,
          binlocation,
          defaultBinBypass: true,
          picklistItems: defaultBinItems.map(item => ({
            id: item.id,
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            status: item.status,
            scanSequence: item.scanSequence,
            binLocation: item.binLocation
          })),
          waveId: parseInt(waveId),
          fc_id: fcId
        });
      }

      // ✅ Normal validation bypass (same as before)
      console.log(`Bypassing strict validation for SKU ${skuID} at bin ${binlocation} (FC ${fcId})`);

      // ✅ Find picklist items for this FC and SKU (regardless of bin location)
      const picklistItems = await PicklistItem.findAll({
        where: { 
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          sku: skuID,
          status: ['PENDING', 'PICKING']
        }
      });

      const binLocationFound = picklistItems.length > 0;

      return ResponseHandler.success(res, {
        message: binLocationFound
          ? `SKU validated successfully in fulfillment center ${fcId} (validation bypassed)`
          : `SKU validated but no picklist items found in fulfillment center ${fcId}`,
        binLocationFound,
        scannedId,
        skuID,
        binlocation,
        validationBypassed: true,
        picklistItems: picklistItems.map(item => ({
          id: item.id,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          status: item.status,
          scanSequence: item.scanSequence,
          binLocation: item.binLocation
        })),
        waveId: parseInt(waveId),
        fc_id: fcId
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
      const fcId = req.user?.fc_id; // ✅ current FC context

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      if (!scannedId || !skuID || !binlocation) {
        return ResponseHandler.error(res, 'scannedId, skuID, and binlocation are required', 400);
      }

      console.log(`🧾 Scan SKU request: waveId=${waveId}, skuID=${skuID}, bin=${binlocation}, fc_id=${fcId}, picker=${pickerId}`);

      // ✅ Resolve SKU (by SKU or EAN)
      let resolvedSku: string;
      let foundBy: 'sku' | 'ean';
      
      let product = await Product.findOne({ where: { sku: skuID } });
      if (product) {
        resolvedSku = product.sku;
        foundBy = 'sku';
      } else {
        product = await Product.findOne({ where: { ean_upc: skuID } });
        if (product) {
          resolvedSku = product.sku;
          foundBy = 'ean';
        } else {
          return ResponseHandler.error(res, `Both SKU and EAN not found for: ${skuID}`, 404);
        }
      }

      // ✅ Fetch wave scoped by FC
      const wave = await PickingWave.findOne({
        where: { id: parseInt(waveId), fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'You are not assigned to this wave', 403);
      }

      // ✅ Check for DEFAULT-BIN items (scoped by FC)
      const defaultBinItems = await PicklistItem.findAll({
        where: {
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          sku: resolvedSku,
          binLocation: 'DEFAULT-BIN',
          status: ['PENDING', 'PICKING']
        }
      });

      const hasDefaultBinItems = defaultBinItems.length > 0;

      // ✅ DEFAULT-BIN bypass
      if (hasDefaultBinItems) {
        console.log(`DEFAULT-BIN bypass [FC ${fcId}]: SKU ${resolvedSku} at bin ${binlocation}`);

        const currentItem = defaultBinItems[0];
        await currentItem.update({
          status: 'PICKED',
          pickedQuantity: currentItem.quantity,
          pickedAt: new Date(),
          pickedBy: pickerId
        });

        return ResponseHandler.success(res, {
          message: `DEFAULT-BIN item picked successfully in fulfillment center ${fcId}`,
          skuFound: true,
          scannedId,
          skuID,
          resolvedSku,
          foundBy,
          binlocation,
          defaultBinBypass: true,
          pickedItem: {
            id: currentItem.id,
            sku: currentItem.sku,
            productName: currentItem.productName,
            quantity: currentItem.quantity,
            pickedQuantity: currentItem.pickedQuantity,
            status: currentItem.status,
            scanSequence: currentItem.scanSequence,
            binLocation: currentItem.binLocation
          },
          waveId: parseInt(waveId),
          fc_id: fcId
        });
      }

      // ✅ Find SKU scan in scanner_sku table
      const scannerSku = await ScannerSku.findOne({
        where: { skuScanId: resolvedSku }
      });

      if (!scannerSku) {
        return ResponseHandler.success(res, {
          message: `SKU scan not found in system for FC ${fcId}`,
          skuFound: false,
          scannedId,
          skuID,
          resolvedSku,
          foundBy,
          waveId: parseInt(waveId),
          fc_id: fcId,
          error: 'INVALID_SKU_SCAN'
        });
      }

      console.log(`Allowing SKU scan for ${resolvedSku} at bin ${binlocation} (validation bypassed, FC ${fcId})`);

      // ✅ Find picklist item (scoped by FC)
      const currentItem = await PicklistItem.findOne({
        where: {
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          sku: resolvedSku,
          binLocation: binlocation,
          status: ['PENDING', 'PICKING']
        }
      });

      if (!currentItem) {
        return ResponseHandler.success(res, {
          message: `No matching picklist item found in fulfillment center ${fcId}`,
          skuFound: false,
          scannedId,
          skuID,
          resolvedSku,
          foundBy,
          binlocation,
          waveId: parseInt(waveId),
          fc_id: fcId,
          error: 'NO_MATCHING_PICKLIST_ITEM'
        });
      }

      // ✅ Update item status to PICKED
      await currentItem.update({
        status: 'PICKED',
        pickedQuantity: currentItem.quantity,
        pickedAt: new Date(),
        pickedBy: pickerId
      });

      console.log(`✅ Picked SKU ${resolvedSku} (itemId=${currentItem.id}, FC ${fcId})`);

      // ✅ Inventory update remains the same
      try {
        const inventoryResult = await DirectInventoryService.updateInventory({
          sku: resolvedSku,
          operation: INVENTORY_OPERATIONS.PICKLIST,
          quantity: currentItem.quantity,
          referenceId: `PICK-WAVE-${waveId}`,
          operationDetails: {
            waveId: parseInt(waveId),
            waveNumber: wave.waveNumber,
            picklistItemId: currentItem.id,
            binLocation: binlocation,
            pickedAt: new Date(),
            pickedBy: pickerId,
            fc_id: fcId //TODO: check for this can cause problem
          },
          performedBy: pickerId
        });

        if (!inventoryResult.success) {
          console.error(`❌ Inventory update failed for SKU ${resolvedSku} (FC ${fcId}):`, inventoryResult.message);
        }
      } catch (inventoryError) {
        console.error(`⚠️ Inventory update error (FC ${fcId}):`, inventoryError);
      }

      // ✅ Check if all items in this FC’s wave are picked
      const remainingItems = await PicklistItem.count({
        where: {
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          status: ['PENDING', 'PICKING']
        }
      });

      if (remainingItems === 0) {
        await wave.update({
          status: 'PACKED',
          completedAt: new Date()
        });
        console.log(`🎯 Wave ${wave.waveNumber} marked as PACKED (FC ${fcId})`);
      }

      return ResponseHandler.success(res, {
        message: `SKU validated and item picked successfully in fulfillment center ${fcId}`,
        skuFound: true,
        scannedId,
        skuID,
        resolvedSku,
        foundBy,
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
        remainingItems,
        fc_id: fcId
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
      const fcId = req.user?.fc_id; // ✅ Extract FC ID

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      if (!sku || !binLocation || !reason) {
        return ResponseHandler.error(res, 'SKU, bin location, and reason are required', 400);
      }

      console.log(`⚠️ Partial pick report: waveId=${waveId}, sku=${sku}, reason=${reason}, fc_id=${fcId}, picker=${pickerId}`);

      // ✅ Find the picklist item scoped by FC
      const picklistItem = await PicklistItem.findOne({
        where: { 
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          sku,
          binLocation
        }
      });

      if (!picklistItem) {
        return ResponseHandler.error(res, `Item not found in picklist for fulfillment center ${fcId}`, 404);
      }

      // ✅ Fetch wave scoped by FC
      const wave = await PickingWave.findOne({
        where: { id: parseInt(waveId), fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      // ✅ Update item status
      await picklistItem.update({
        status: 'PARTIAL',
        pickedQuantity: pickedQuantity,
        partialReason: reason,
        partialPhoto: photo,
        notes,
        pickedAt: new Date(),
        pickedBy: pickerId
      });

      console.log(`🟠 Marked SKU ${sku} as PARTIAL in wave ${wave.waveNumber} (FC ${fcId})`);

      // ✅ Create FC-specific picking exception if applicable
      if (['OOS', 'DAMAGED', 'EXPIRY'].includes(reason)) {
        await PickingException.create({
          waveId: parseInt(waveId),
          orderId: picklistItem.orderId,
          sku: picklistItem.sku,
          // fc_id: fcId, // ✅ include FC ID
          exceptionType: reason as any,
          severity: reason === 'EXPIRY' ? 'HIGH' : 'MEDIUM',
          description: `Partial pick reported: ${reason}. ${notes || ''}`,
          reportedBy: pickerId,
          reportedAt: new Date(),
          status: 'OPEN',
          slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        } as any);

        console.log(`🚨 Picking exception logged for SKU ${sku} in FC ${fcId} with reason: ${reason}`);
      }

      return ResponseHandler.success(res, {
        message: `Partial pick reported successfully in fulfillment center ${fcId}`,
        item: {
          id: picklistItem.id,
          sku: picklistItem.sku,
          status: picklistItem.status,
          partialReason: picklistItem.partialReason,
          pickedQuantity: picklistItem.pickedQuantity
        },
        fc_id: fcId
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
      const fcId = req.user?.fc_id; // ✅ Extract fulfillment center ID

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      console.log(`✅ Complete picking request: waveId=${waveId}, pickerId=${pickerId}, fc_id=${fcId}`);

      // ✅ Fetch wave for this FC only
      const wave = await PickingWave.findOne({
        where: { id: parseInt(waveId), fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      if (wave.status !== 'PICKING') {
        return ResponseHandler.error(res, 'Wave is not in picking status', 400);
      }

      if (wave.pickerId !== pickerId) {
        return ResponseHandler.error(res, 'You are not assigned to this wave', 403);
      }

      // ✅ Check for unprocessed items in the same FC
      const pendingItems = await PicklistItem.count({
        where: { 
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId,
          status: ['PENDING', 'PICKING']
        }
      });

      if (pendingItems > 0) {
        return ResponseHandler.error(res, `Cannot complete: ${pendingItems} items still pending in FC ${fcId}`, 400);
      }

      // ✅ Mark wave as PACKED
      await wave.update({
        status: 'PACKED',
        completedAt: new Date()
      });

      console.log(`🎯 Wave ${wave.waveNumber} marked as PACKED by picker ${pickerId} in FC ${fcId}`);

      // ✅ Compute metrics (FC-scoped)
      const totalItems = await PicklistItem.count({ 
        where: { 
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId 
        } 
      });
      const pickedItems = await PicklistItem.count({ 
        where: {
          waveId: parseInt(waveId), 
          fulfillment_center_id: fcId, 
          status: 'PICKED' 
        } 
      });
      const partialItems = await PicklistItem.count({ 
        where: { 
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId, 
          status: 'PARTIAL' 
        } 
      });
      const accuracy = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;

      return ResponseHandler.success(res, {
        message: `Picking completed successfully in fulfillment center ${fcId}`,
        wave: {
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          completedAt: wave.completedAt,
          fc_id: fcId
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
      const fcId = req.user?.fc_id; // ✅ Current fulfillment center

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      console.log(`📊 Fetching SLA status for FC ${fcId}, page=${page}, limit=${limit}, waveId=${waveId || 'ALL'}`);

      // ✅ Filter waves by FC
      const whereClause: any = { fulfillment_center_id: fcId };
      if (waveId) whereClause.id = parseInt(waveId.toString());

      // ✅ Fetch only waves from current FC
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
          picker: wave.pickerId || null,
          fc_id: fcId
        });
      }

      const { total, onTime, atRisk, breached } = slaMetrics;

      const summary = total > 0 ? {
        onTimePercentage: Math.round((onTime / total) * 100),
        atRiskPercentage: Math.round((atRisk / total) * 100),
        breachedPercentage: Math.round((breached / total) * 100)
      } : {
        onTimePercentage: 0,
        atRiskPercentage: 0,
        breachedPercentage: 0
      };

      return ResponseHandler.success(res, {
        message: `SLA metrics fetched successfully for fulfillment center ${fcId}`,
        slaMetrics,
        summary,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: waves.count,
          totalPages: Math.ceil(waves.count / parseInt(limit.toString()))
        },
        fc_id: fcId
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
      const fcId = req.user?.fc_id; // ✅ Extract fulfillment center ID

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      const thresholdDate = new Date(Date.now() + parseInt(daysThreshold.toString()) * 24 * 60 * 60 * 1000);

      console.log(`⏰ Fetching expiry alerts for FC ${fcId} within ${daysThreshold} days`);

      // ✅ Fetch only picklist items for this FC
      const expiringItems = await PicklistItem.findAndCountAll({
        where: {
          fulfillment_center_id: fcId, // ✅ Scope by fulfillment center
          expiryDate: {
            [require('sequelize').Op.lte]: thresholdDate
          },
          status: ['PENDING', 'PICKING']
        },
        order: [['expiryDate', 'ASC']],
        limit: parseInt(limit.toString()),
        offset
      });

      const alerts = expiringItems.rows.map(item => {
        const daysUntilExpiry = Math.ceil((item.expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const urgency =
          item.expiryDate!.getTime() <= Date.now()
            ? 'EXPIRED'
            : item.expiryDate!.getTime() <= Date.now() + 24 * 60 * 60 * 1000
            ? 'CRITICAL'
            : item.expiryDate!.getTime() <= Date.now() + 3 * 24 * 60 * 60 * 1000
            ? 'HIGH'
            : 'MEDIUM';

        return {
          id: item.id,
          sku: item.sku,
          productName: item.productName,
          expiryDate: item.expiryDate,
          daysUntilExpiry,
          orderId: item.orderId,
          fc_id: fcId,
          urgency,
          waveNumber: 'N/A', // To be linked when associations are resolved
          wavePriority: 'N/A'
        };
      });

      // ✅ Sort by urgency
      const urgencyOrder = { EXPIRED: 0, CRITICAL: 1, HIGH: 2, MEDIUM: 3 };
      alerts.sort((a, b) => urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder]);

      return ResponseHandler.success(res, {
        message: `Expiry alerts fetched successfully for fulfillment center ${fcId}`,
        totalAlerts: expiringItems.count,
        alerts,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: expiringItems.count,
          totalPages: Math.ceil(expiringItems.count / parseInt(limit.toString()))
        },
        fc_id: fcId
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
      const fcId = req.user?.fc_id; // ✅ Fulfillment Center context

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      console.log(`📦 Fetching picklist items for wave ${waveId} in FC ${fcId}`);

      // ✅ Verify wave belongs to the current FC
      const wave = await PickingWave.findOne({
        where: { id: parseInt(waveId), fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      // ✅ Check permissions
      const userPermissions = req.user!.permissions || [];
      const canView =
        userPermissions.includes('picking:view') ||
        userPermissions.includes('picking:assign_manage') ||
        (userPermissions.includes('picking:execute') && wave.pickerId === req.user!.id);

      if (!canView) {
        return ResponseHandler.error(res, 'Insufficient permissions to view this wave', 403);
      }

      // ✅ Build where clause (scoped by FC)
      const whereClause: any = { 
        waveId: parseInt(waveId), 
        fulfillment_center_id: fcId 
      };
      if (status) whereClause.status = status;

      console.log('Querying for waveId:', waveId, 'in FC:', fcId);
      console.log('Where clause:', whereClause);

      // ✅ Debug: Count picklist items for this FC and wave
      const totalItemsForWave = await PicklistItem.count({
        where: { 
          waveId: parseInt(waveId),
          fulfillment_center_id: fcId 
        }
      });
      console.log(`Total picklist items found for wave ${waveId} in FC ${fcId}: ${totalItemsForWave}`);

      interface PicklistItemWithProduct extends PicklistItem { productInfo?: Product; }

      // ✅ Fetch picklist items including product info
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
            required: false, // left join
          }
        ],
        logging: console.log
      }) as { count: number; rows: PicklistItemWithProduct[] };;

      // ✅ Build response
      return ResponseHandler.success(res, {
        message: `Fetched picklist items successfully for FC ${fcId}`,
        wave: {
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          totalItems: wave.totalItems,
          fc_id: fcId
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
          imageUrl: item.productInfo?.image_url || null,
          ean: item.productInfo?.ean_upc || null,
          mrp: item.productInfo?.mrp || null,
          fc_id: fcId
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


  /**
   * Manually create picklist items for a wave
   */
  static async createPicklistItems(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId } = req.params;
      const fcId = req.user?.fc_id; // ✅ Current fulfillment center

      if (!fcId) {
        return ResponseHandler.error(res, 'Missing fulfillment center context (fc_id)', 400);
      }

      console.log(`🧾 Create picklist items request for wave ${waveId} in FC ${fcId}`);

      // ✅ Verify wave belongs to current fulfillment center
      const wave = await PickingWave.findOne({
        where: { id: parseInt(waveId), fulfillment_center_id: fcId }
      });

      if (!wave) {
        return ResponseHandler.error(res, `Wave not found in fulfillment center ${fcId}`, 404);
      }

      // ✅ Check permissions
      const userPermissions = req.user!.permissions || [];
      const canManage =
        userPermissions.includes('picking:assign_manage') ||
        userPermissions.includes('picking:view');

      if (!canManage) {
        return ResponseHandler.error(res, 'Insufficient permissions to manage this wave', 403);
      }

      // ✅ Create picklist items (pass FC ID to internal method)
      const result = await PickingController.createPicklistItemsForWave(parseInt(waveId), fcId);

      if (result.success) {
        console.log(`✅ ${result.createdItems} picklist items created successfully for wave ${waveId} in FC ${fcId}`);
        return ResponseHandler.success(res, {
          message: result.message,
          createdItems: result.createdItems,
          waveId: parseInt(waveId),
          fc_id: fcId
        });
      } else {
        console.warn(`⚠️ Failed to create picklist items for wave ${waveId}: ${result.message}`);
        return ResponseHandler.error(res, result.message, 400);
      }

    } catch (error) {
      console.error('Create picklist items error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }


  /**
   * Internal method to generate picklist for a single order (called from Helpers)
   */
static async generatePicklistInternal(
  orderId: number,
  fcId?: number // ✅ Added optional FC ID param for multi-fulfillment center context
): Promise<{ success: boolean; message: string; waveId?: number }> {
  try {
    console.log(`🔄 Generating picklist internally for order ID: ${orderId} ${fcId ? `(FC: ${fcId})` : ''}`);
    
    // Get the order data
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const orderData = order.get({ plain: true });
    const waveNumber = `W${Date.now()}-${orderData.order_id}`;
    
    // Calculate SLA deadline (24 hours from now)
    const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Calculate total items for this single order
    let totalItems = 0;
    if (orderData.cart && Array.isArray(orderData.cart)) {
      totalItems = orderData.cart.reduce((sum: number, item: any) => {
        return sum + (item.quantity || 1);
      }, 0);
    }
    
    // ✅ Create the picking wave with FC info
    const wave = await PickingWave.create({
      waveNumber,
      status: 'GENERATED',
      priority: 'HIGH',
      totalOrders: 1,
      totalItems: totalItems,
      estimatedDuration: 2,
      slaDeadline,
      routeOptimization: true,
      fefoRequired: false,
      tagsAndBags: false,
      orderId: orderData.id,
      fulfillment_center_id: fcId || (orderData.fc_id ?? null) // ✅ attach FC if provided or from order
    } as any);
    
    console.log(`✅ Created picking wave ${wave.id} for order ${orderId} (FC: ${wave.fulfillment_center_id})`);

    // Create picklist items for this single order
    let actualTotalItems = 0;
    let createdItems = 0;
    
    if (orderData.cart && Array.isArray(orderData.cart)) {
      for (let i = 0; i < orderData.cart.length; i++) {
        const item = orderData.cart[i];
        
        if (item && item.sku !== undefined && item.sku !== null) {
          const quantity = item.quantity || (item.amount ? 1 : 1);
          
          try {
            const skuString = item.sku.toString();

            // First, ensure the SKU exists in product_master table
            let productExists = await Product.findOne({
              where: { sku: skuString }
            });

            if (!productExists) {
              console.log(`📦 Creating placeholder product for SKU ${skuString}`);
              try {
                await Product.create({
                  SKU: skuString,
                  ProductName: `Product-${skuString}`,
                  ImageURL: '',
                  EAN_UPC: '',
                  MRP: orderData.order_amount || 0.00,
                  CreatedDate: new Date().toISOString(),
                  updated_at: new Date()
                } as any);
                console.log(`✅ Created placeholder product for SKU ${skuString} with MRP: ${orderData.order_amount}`);
              } catch (productCreateError: any) {
                console.error(`❌ Failed to create placeholder product for SKU ${skuString}:`, productCreateError.message);
              }
            } else {
              // Update MRP if needed
              const currentMRP = parseFloat(String(productExists.mrp || '0'));
              const orderMRP = orderData.order_amount || 0.00;
              
              if (orderMRP > 0 && orderMRP !== currentMRP) {
                console.log(`📦 Updating MRP for existing SKU ${skuString} from ${currentMRP} to ${orderMRP}`);
                try {
                  await Product.update(
                    { 
                      mrp: orderMRP,
                      updated_at: new Date()
                    },
                    { where: { sku: skuString } }
                  );
                  console.log(`✅ Updated MRP for SKU ${skuString} to ${orderMRP}`);
                } catch (updateError: any) {
                  console.error(`❌ Failed to update MRP for SKU ${skuString}:`, updateError.message);
                }
              }
            }

            // Find the SKU in ScannerSku table to get bin location (FC Scoped)
            const scannerSku = await ScannerSku.findOne({
              where: fcId
                ? { skuScanId: skuString, fc_id: fcId } // ✅ Added FC scope
                : { skuScanId: skuString }
            });

            let binLocation: string = PICKING_CONSTANTS.DEFAULT_BIN_LOCATION;
            let productName = `Product-${skuString}`;

            if (scannerSku) {
              const scannerBin = await ScannerBin.findOne({
                where: fcId
                  ? { binLocationScanId: scannerSku.binLocationScanId, fc_id: fcId } // ✅ Added FC scope
                  : { binLocationScanId: scannerSku.binLocationScanId }
              });

              if (scannerBin) {
                binLocation = scannerBin.binLocationScanId;
              } else {
                console.warn(`Bin location not found for SKU ${skuString}. Checking category-based fallback.`);
                
                const product = await Product.findOne({
                  where: { sku: skuString },
                  attributes: ['Category']
                });

                if (product && product.category) {
                  console.log(`Found product category "${product.category}" for SKU ${skuString}. Checking bin_locations.`);
                  
                  const { BinLocation } = await import('../models/index.js');
                  const { Sequelize } = require('sequelize');
                  const categoryBasedBin = await BinLocation.findOne({
                    where: fcId
                      ? Sequelize.and(
                          { fulfillment_center_id: fcId }, // ✅ Added FC filter
                          { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                          Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                        )
                      : Sequelize.and(
                          { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                          Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                        ),
                    order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC
                  });

                  if (categoryBasedBin) {
                    binLocation = categoryBasedBin.bin_code;
                    console.log(`✅ Found category-based bin location: ${binLocation} for category "${product.category}"`);
                  } else {
                    console.warn(`No active bin found for category "${product.category}". Using default bin location.`);
                  }
                } else {
                  console.warn(`No category found for SKU ${skuString}. Using default bin location.`);
                }
              }
            } else {
              console.warn(`SKU ${skuString} not found in scanner system. Checking category-based fallback.`);
              
              const product = await Product.findOne({
                where: { sku: skuString },
                attributes: ['Category']
              });

              if (product && product.category) {
                console.log(`Found product category "${product.category}" for SKU ${skuString}. Checking bin_locations.`);
                
                const { BinLocation } = await import('../models/index.js');
                const categoryBasedBin = await BinLocation.findOne({
                  where: fcId
                    ? {
                        fulfillment_center_id: fcId, // ✅ Added FC filter
                        category_mapping: {
                          [require('sequelize').Op.contains]: [product.category]
                        },
                        status: 'active'
                      }
                    : {
                        category_mapping: {
                          [require('sequelize').Op.contains]: [product.category]
                        },
                        status: 'active'
                      },
                  order: [['id', 'ASC']]
                });

                if (categoryBasedBin) {
                  binLocation = categoryBasedBin.bin_code;
                  console.log(`✅ Found category-based bin location: ${binLocation} for category "${product.category}"`);
                } else {
                  console.warn(`No active bin found for category "${product.category}". Using default bin location.`);
                }
              } else {
                console.warn(`No category found for SKU ${skuString}. Using default bin location.`);
              }
            }

            // ✅ Create picklist item (attach FC ID)
            const picklistItem = await PicklistItem.create({
              waveId: wave.id,
              orderId: orderData.id,
              sku: skuString,
              productName: productName,
              binLocation: binLocation,
              quantity: quantity,
              scanSequence: Math.floor(Math.random() * 100) + 1,
              fefoBatch: false ? `BATCH-${Date.now()}` : undefined,
              expiryDate: false ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
              fulfillment_center_id: fcId || wave.fulfillment_center_id // ✅ attach FC info to picklist
            } as any);
            
            createdItems++;
            actualTotalItems += quantity;
            console.log(`✅ Created picklist item for SKU ${item.sku} (FC ${fcId || wave.fulfillment_center_id}) with bin location ${binLocation}`);
            
          } catch (createError) {
            console.error(`❌ Error creating picklist item for SKU ${item.sku}:`, createError);
            // Fallback creation
            try {
              const skuString = item.sku.toString();
              
              await PicklistItem.create({
                waveId: wave.id,
                orderId: orderData.id,
                sku: skuString,
                productName: `Product-${skuString}`,
                binLocation: PICKING_CONSTANTS.DEFAULT_BIN_LOCATION,
                quantity: quantity,
                scanSequence: Math.floor(Math.random() * 100) + 1,
                fefoBatch: false ? `BATCH-${Date.now()}` : undefined,
                expiryDate: false ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
                fulfillment_center_id: fcId || wave.fulfillment_center_id // ✅ attach FC info
              } as any);
              
              createdItems++;
              actualTotalItems += quantity;
              console.log(`✅ Created fallback picklist item for SKU ${item.sku} (FC ${fcId || wave.fulfillment_center_id })`);
            } catch (fallbackError) {
              console.error(`❌ Failed to create fallback picklist item for SKU ${item.sku}:`, fallbackError);
            }
          }
        }
      }
    }

    // Update wave with actual total items
    await wave.update({ totalItems: actualTotalItems });

    console.log(`🎉 Successfully created ${createdItems} picklist items for wave ${wave.id} (FC ${fcId || wave.fulfillment_center_id})`);
    
    return {
      success: true,
      message: `Successfully created ${createdItems} picklist items`,
      waveId: wave.id
    };

  } catch (error: any) {
    console.error(`❌ Error in generatePicklistInternal for order ${orderId}:`, error);
    return {
      success: false,
      message: `Failed to generate picklist: ${error.message}`
    };
  }
}


  /**
   * Create picklist items for an existing wave (utility function)
   */
  static async createPicklistItemsForWave(
    waveId: number,
    fcId?: number // ✅ Added optional fcId param
  ): Promise<{ success: boolean; message: string; createdItems: number }> {
    try {
      // Check if picklist items already exist for this wave (FC scoped)
      const existingItems = await PicklistItem.count({
        where: fcId ? { waveId, fulfillment_center_id: fcId } : { waveId } // ✅ Added fc_id check
      });

      if (existingItems > 0) {
        return {
          success: true,
          message: `Wave ${waveId} already has ${existingItems} picklist items${fcId ? ` in FC ${fcId}` : ''}`,
          createdItems: existingItems
        };
      }

      // Get the wave details (FC scoped)
      const wave = await PickingWave.findOne({
        where: fcId ? { id: waveId, fulfillment_center_id: fcId } : { id: waveId } // ✅ Added fc_id condition
      });

      if (!wave) {
        return {
          success: false,
          message: `Wave ${waveId} not found${fcId ? ` in FC ${fcId}` : ''}`,
          createdItems: 0
        };
      }

      // Derive fc_id from wave if not provided
      const effectiveFcId = fcId || (wave as any).fc_id;

      // Find the order associated with this wave
      const orderIdFromWave = wave.waveNumber.split('-')[1]; // Extract order_id from wave number

      const order = await Order.findOne({
        where: { order_id: orderIdFromWave },
        attributes: ['id', 'order_id', 'cart']
      });

      if (!order) {
        return {
          success: false,
          message: `Order not found for wave ${waveId}, order_id: ${orderIdFromWave}`,
          createdItems: 0
        };
      }

      const orderData = order.get({ plain: true });
      console.log(`Creating picklist items for wave ${waveId}, order: ${orderData.order_id}, FC: ${effectiveFcId}`);

      // Create picklist items for this order
      let actualTotalItems = 0;
      let createdItems = 0;

      if (orderData.cart && Array.isArray(orderData.cart)) {
        for (let i = 0; i < orderData.cart.length; i++) {
          const item = orderData.cart[i];

          if (item && item.sku !== undefined && item.sku !== null) {
            const quantity = item.quantity || (item.amount ? 1 : 1);

            try {
              // Find the SKU in ScannerSku table to get bin location (FC scoped)
              const scannerSku = await ScannerSku.findOne({
                where: fcId
                  ? { skuScanId: item.sku.toString(), fc_id: effectiveFcId } // ✅ Added fc_id filter
                  : { skuScanId: item.sku.toString() }
              });

              let binLocation: string = PICKING_CONSTANTS.DEFAULT_BIN_LOCATION; // Default bin location
              let productName = `Product-${item.sku}`;

              if (scannerSku) {
                // Get the bin location from ScannerBin table (FC scoped)
                const scannerBin = await ScannerBin.findOne({
                  where: fcId
                    ? { binLocationScanId: scannerSku.binLocationScanId, fc_id: effectiveFcId } // ✅ Added fc_id filter
                    : { binLocationScanId: scannerSku.binLocationScanId }
                });

                if (scannerBin) {
                  binLocation = scannerBin.binLocationScanId;
                } else {
                  console.warn(`Bin location not found for SKU ${item.sku}. Checking category-based fallback.`);

                  const product = await Product.findOne({
                    where: { sku: item.sku.toString() },
                    attributes: ['Category']
                  });

                  if (product && product.category) {
                    console.log(`Found product category "${product.category}" for SKU ${item.sku}. Checking bin_locations.`);

                    const { BinLocation } = await import('../models/index.js');
                    const { Sequelize } = require('sequelize');

                    const categoryBasedBin = await BinLocation.findOne({
                      where: fcId
                        ? Sequelize.and(
                            { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                            { fulfillment_center_id: effectiveFcId }, // ✅ Added fc_id filter
                            Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                          )
                        : Sequelize.and(
                            { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                            Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                          ),
                      order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC
                    });

                    if (categoryBasedBin) {
                      binLocation = categoryBasedBin.get('bin_code');
                      console.log(`✅ Found category-based bin location: ${binLocation} for category "${product.category}"`);
                    } else {
                      console.warn(`No active bin found for category "${product.category}". Using default bin location.`);
                    }
                  } else {
                    console.warn(`No category found for SKU ${item.sku}. Using default bin location.`);
                  }
                }
              } else {
                console.warn(`SKU ${item.sku} not found in scanner system. Checking category-based fallback.`);

                const product = await Product.findOne({
                  where: { sku: item.sku.toString() },
                  attributes: ['Category']
                });

                if (product && product.category) {
                  console.log(`Found product category "${product.category}" for SKU ${item.sku}. Checking bin_locations.`);

                  const { BinLocation } = await import('../models/index.js');
                  const categoryBasedBin = await BinLocation.findOne({
                    where: fcId
                      ? {
                          fulfillment_center_id: effectiveFcId, // ✅ Added fc_id filter
                          category_mapping: {
                            [require('sequelize').Op.contains]: [product.category]
                          },
                          status: 'active'
                        }
                      : {
                          category_mapping: {
                            [require('sequelize').Op.contains]: [product.category]
                          },
                          status: 'active'
                        },
                    order: [['id', 'ASC']]
                  });

                  if (categoryBasedBin) {
                    binLocation = categoryBasedBin.bin_code;
                    console.log(`✅ Found category-based bin location: ${binLocation} for category "${product.category}"`);
                  } else {
                    console.warn(`No active bin found for category "${product.category}". Using default bin location.`);
                  }
                } else {
                  console.warn(`No category found for SKU ${item.sku}. Using default bin location.`);
                }
              }

              // ✅ Add FC info when creating the item
              const picklistItem = await PicklistItem.create({
                waveId: waveId,
                orderId: orderData.id,
                sku: item.sku.toString(),
                productName: productName,
                binLocation: binLocation,
                quantity: quantity,
                scanSequence: Math.floor(Math.random() * 100) + 1,
                fefoBatch: wave.fefoRequired ? `BATCH-${Date.now()}` : undefined,
                expiryDate: wave.fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
                fulfillment_center_id: effectiveFcId // ✅ Injected FC ID
              } as any);

              createdItems++;
              actualTotalItems += quantity;
              console.log(`Created picklist item for SKU ${item.sku} (FC ${effectiveFcId}) with bin ${binLocation}`);

            } catch (createError) {
              console.error(`Error creating picklist item for SKU ${item.sku}:`, createError);

              // Try minimal fallback (unchanged logic, but add fc_id)
              try {
                const picklistItem = await PicklistItem.create({
                  waveId: waveId,
                  orderId: orderData.id,
                  sku: item.sku.toString(),
                  productName: `Product-${item.sku}`,
                  binLocation: PICKING_CONSTANTS.DEFAULT_BIN_LOCATION,
                  quantity: quantity,
                  scanSequence: Math.floor(Math.random() * 100) + 1,
                  fefoBatch: wave.fefoRequired ? `BATCH-${Date.now()}` : undefined,
                  expiryDate: wave.fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
                  fulfillment_center_id: effectiveFcId // ✅ Injected FC ID
                } as any);

                createdItems++;
                actualTotalItems += quantity;
                console.log(`Created fallback picklist item for SKU ${item.sku} (FC ${effectiveFcId})`);
              } catch (fallbackError) {
                console.error(`Failed to create fallback picklist item for SKU ${item.sku}:`, fallbackError);
              }
            }
          }
        }
      }

      // Update wave totals (unchanged)
      await wave.update({ totalItems: actualTotalItems });

      console.log(`Created ${createdItems} picklist items for wave ${waveId} in FC ${effectiveFcId}, total items: ${actualTotalItems}`);

      return {
        success: true,
        message: `Successfully created ${createdItems} picklist items for wave ${waveId} in FC ${effectiveFcId}`,
        createdItems: createdItems
      };

    } catch (error) {
      console.error(`Error creating picklist items for wave ${waveId}:`, error);
      return {
        success: false,
        message: `Error creating picklist items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createdItems: 0
      };
    }
  }

}


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
        where: { id: uniqueOrderIds },
        attributes: ['id', 'order_id', 'order_amount', 'created_at', 'cart']
      });

      if (orders.length !== uniqueOrderIds.length) {
        return ResponseHandler.error(res, `Some order IDs not found: ${uniqueOrderIds.filter(id => !orders.find(order => order.get({ plain: true }).id === id)).join(', ')}`, 404);
      }

      // Create one wave per order (one-order-per-wave restriction)
      const waves: any[] = [];
      for (const order of orders) {
        const orderData = order.get({ plain: true });
        const waveNumber = `W${Date.now()}-${orderData.id}`;
        
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
          tagsAndBags,
          orderId: orderData.id
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
                // First, ensure the SKU exists in product_master table
                const skuString = item.sku.toString();
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
                      MRP: orderData.order_amount || 0.00, // Use total order amount from PHP
                      CreatedDate: new Date().toISOString(),
                      updated_at: new Date()
                    } as any);
                    console.log(`✅ Created placeholder product for SKU ${skuString} with MRP: ${orderData.order_amount}`);
                  } catch (productCreateError: any) {
                    console.error(`❌ Failed to create placeholder product for SKU ${skuString}:`, productCreateError.message);
                    // Continue anyway, we'll try to create the picklist item
                  }
                } else {
                  // Product exists, but let's update MRP if the current order has a different amount
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

                // Find the SKU in ScannerSku table to get bin location
                const scannerSku = await ScannerSku.findOne({
                  where: { skuScanId: skuString }
                });

                let binLocation: string = PICKING_CONSTANTS.DEFAULT_BIN_LOCATION; // Default bin location
                let productName = `Product-${skuString}`;

                if (scannerSku) {
                  // Get the bin location from ScannerBin table
                  const scannerBin = await ScannerBin.findOne({
                    where: {
                      binLocationScanId: scannerSku.binLocationScanId
                    }
                  });

                  if (scannerBin) {
                    binLocation = scannerBin.binLocationScanId;
                  } else {
                    console.warn(`${PICKING_CONSTANTS.LOG_MESSAGES.BIN_LOCATION_NOT_FOUND.replace('SKU', `SKU ${skuString}`)}`);
                    
                    // iii. Category-based fallback: Get SKU category from product_master
                    const product = await Product.findOne({
                      where: { [PICKING_CONSTANTS.COLUMNS.SKU]: skuString },
                      attributes: [PICKING_CONSTANTS.COLUMNS.CATEGORY]
                    });

                    if (product && product.category) {
                      console.log(`Found product category "${product.category}" for SKU ${skuString}. Checking bin_locations.`);
                      
                      // Find bin location by category mapping
                      const { BinLocation } = await import('../models/index.js');
                      const categoryBasedBin = await BinLocation.findOne({
                        where: Sequelize.and(
                          { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                          Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                        ),
                        order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC // Get first matching bin
                      });

                      if (categoryBasedBin) {
                        binLocation = categoryBasedBin.get('bin_code');
                        console.log(`✅ Found category-based bin location: ${binLocation} for category "${product.category}"`);
                      } else {
                        console.warn(`No active bin found for category "${product.category}". Using default bin location.`);
                      }
                    } else {
                      console.warn(`No category found for SKU ${skuString}. Using default bin location.`);
                    }
                  }
                } else {
                  console.warn(`${PICKING_CONSTANTS.LOG_MESSAGES.SKU_NOT_FOUND_IN_SCANNER.replace('SKU', `SKU ${skuString}`)}`);
                  
                  // iii. Category-based fallback: Get SKU category from product_master
                  const product = await Product.findOne({
                    where: { sku: skuString },
                    attributes: ['Category']
                  });

                  if (product && product.category) {
                    console.log(`Found product category "${product.category}" for SKU ${skuString}. Checking bin_locations.`);
                    
                      // Find bin location by category mapping using MySQL JSON_CONTAINS
                      const { BinLocation } = await import('../models/index.js');
                      const { Sequelize } = require('sequelize');
                      const categoryBasedBin = await BinLocation.findOne({
                        where: Sequelize.and(
                          { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                          Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                        ),
                        order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC // Get first matching bin
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

                const picklistItem = await PicklistItem.create({
                  waveId: wave.id,
                  orderId: orderData.id, // Keep using internal ID for database relationships
                  sku: skuString, // Convert number to string for storage
                  productName: productName, // Generate product name from SKU
                  binLocation: binLocation, // Use actual or default bin location
                  quantity: quantity, // Use quantity or default to 1
                  scanSequence: Math.floor(Math.random() * 100) + 1, // Random sequence for demo
                  fefoBatch: fefoRequired ? `BATCH-${Date.now()}` : undefined,
                  expiryDate: fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
                } as any);
                
                createdItems++;
                actualTotalItems += quantity;
                console.log(`Created picklist item for SKU ${item.sku} with bin location ${binLocation}`);
                
              } catch (createError) {
                console.error(`Error creating picklist item for SKU ${item.sku}:`, createError);
                // Try to create with minimal data
                try {
                  const skuString = item.sku.toString();
                  
                  // Ensure product exists before creating picklist item
                  let productExists = await Product.findOne({
                    where: { sku: skuString }
                  });

                  if (!productExists) {
                    console.log(`📦 Creating placeholder product for SKU ${skuString} (fallback)`);
                    try {
                      await Product.create({
                        SKU: skuString,
                        ProductName: `Product-${skuString}`,
                        ImageURL: '',
                        EAN_UPC: '',
                        MRP: orderData.order_amount || 0.00, // Use total order amount from PHP
                        CreatedDate: new Date().toISOString(),
                        updated_at: new Date()
                      } as any);
                      console.log(`✅ Created placeholder product for SKU ${skuString} (fallback)`);
                    } catch (productCreateError: any) {
                      console.error(`❌ Failed to create placeholder product for SKU ${skuString} (fallback):`, productCreateError.message);
                    }
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
                    expiryDate: fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
                  } as any);
                  
                  createdItems++;
                  actualTotalItems += quantity;
                  console.log(`Created fallback picklist item for SKU ${item.sku}`);
                } catch (fallbackError) {
                  console.error(`Failed to create even fallback picklist item for SKU ${item.sku}:`, fallbackError);
                }
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
          orderId: orders[index].get({ plain: true }).id // Include the order id for each wave
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
   * Get next available picker using round-robin assignment
   */
  static async getNextPicker(): Promise<any> {
    try {
      // Get all active pickers with picking permissions (roleId = 4 for wh_staff_2)
      const pickers = await User.findAll({
        where: {
          isActive: true,
          availabilityStatus: 'available',
          roleId: 4 // wh_staff_2 role has picking permissions
        },
        order: [['id', 'ASC']],
        attributes: ['id', 'email', 'availabilityStatus']
      });

      if (pickers.length === 0) {
        console.warn('No available pickers found');
        return null;
      }

      // Get the last assigned picker ID from the most recent wave
      const lastAssignedWave = await PickingWave.findOne({
        where: Sequelize.where(Sequelize.col('pickerId'), Op.ne, null),
        order: [['assignedAt', 'DESC']],
        attributes: ['pickerId']
      });

      let nextPickerIndex = 0;
      
      if (lastAssignedWave) {
        // Find the index of the last assigned picker
        const lastPickerIndex = pickers.findIndex(p => p.id === lastAssignedWave.pickerId);
        if (lastPickerIndex !== -1) {
          // Next picker is the one after the last assigned, with wrap-around
          nextPickerIndex = (lastPickerIndex + 1) % pickers.length;
        }
      }

      const nextPicker = pickers[nextPickerIndex];
      console.log(`Round-robin: Selected picker ${nextPicker.id} (${nextPicker.email}) from ${pickers.length} available pickers`);
      
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

      console.log(`🎯 Assignment request: waveId=${waveId}, pickerId=${pickerId}, priority=${priority}`);

      if (!waveId) {
        return ResponseHandler.error(res, 'Wave ID is required', 400);
      }

      let targetPickerId = pickerId;

      // If no pickerId provided, use round-robin assignment
      if (!targetPickerId) {
        console.log(`Auto-assigning wave ${waveId} using round-robin`);
        
        // Get all available pickers with picking permissions (roleId = 4 for wh_staff_2)
        // Exclude users who are off-shift (availabilityStatus = 'off-shift')
        const pickers = await User.findAll({
          where: {
            availabilityStatus: 'available',
            roleId: 4 // wh_staff_2 role has picking permissions
          },
          order: [['id', 'ASC']],
          attributes: ['id', 'email', 'availabilityStatus', 'isActive', 'roleId']
        });

        if (pickers.length === 0) {
          console.warn('No available pickers found');
          return ResponseHandler.error(res, 'No available pickers found for assignment', 400);
        }

        console.log(`Available pickers: ${pickers.map(p => `${p.id}(${p.email})`).join(', ')}`);

        // Get the last assigned picker ID from the most recent wave
        const lastAssignedWave = await PickingWave.findOne({
          where: Sequelize.where(Sequelize.col('pickerId'), Op.ne, null),
          order: [['assignedAt', 'DESC']],
          attributes: ['pickerId']
        });

        let nextPickerIndex = 0;
        
        if (lastAssignedWave) {
          console.log(`Last assigned picker ID: ${lastAssignedWave.pickerId}`);
          // Find the index of the last assigned picker
          const lastPickerIndex = pickers.findIndex(p => p.id === lastAssignedWave.pickerId);
          if (lastPickerIndex !== -1) {
            // Round-robin: next picker in the list
            nextPickerIndex = (lastPickerIndex + 1) % pickers.length;
          }
        }

        const nextPicker = pickers[nextPickerIndex];
        targetPickerId = nextPicker.id;
        console.log(`Auto-assigned picker ${targetPickerId} (${nextPicker.email}) to wave ${waveId}`);
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
      const picker = await User.findByPk(targetPickerId, {
        attributes: ['id', 'email', 'availabilityStatus', 'isActive', 'roleId']
      });

      if (!picker) {
        return ResponseHandler.error(res, 'Picker not found', 404);
      }

      // Check if picker is available (not off-shift)
      if (picker.availabilityStatus !== 'available') {
        return ResponseHandler.error(res, `Picker is not available. Current status: ${picker.availabilityStatus}`, 400);
      }

      // Check if picker has picking permissions (roleId 4 = wh_staff_2 has picking permissions)
      if (picker.roleId !== 4) {
        return ResponseHandler.error(res, 'Picker does not have picking permissions', 403);
      }

      // Wave limit check removed - pickers can now handle unlimited waves

      console.log(`Assigning wave ${waveId} to picker ${picker.id} (${picker.email})`);

      // Update wave with assignment
      await wave.update({
        status: 'ASSIGNED',
        pickerId: targetPickerId,
        assignedAt: new Date(),
        priority: priority || wave.priority // Use provided priority or keep existing
      });

      console.log(`✅ Successfully assigned wave ${waveId} to picker ${picker.email}`);

      // 🔥 Emit Socket.IO event to assigned picker
      socketManager.emitToPicker(Number(targetPickerId), 'waveAssigned', {
        orderId: wave.orderId,
        waveId: wave.id,
        waveNumber: wave.waveNumber,
        assignment: {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          pickerId: targetPickerId,
          pickerEmail: picker.email,
          assignedAt: wave.assignedAt,
          priority: wave.priority
        }
      });
      console.log(`📨 Emitted waveAssigned to picker_${targetPickerId}`);

      // 👉 Send Push Notification via SNS
      console.log(`🔍 Looking up picker ${targetPickerId} for push notification...`);
      const pickerWithDevices = await User.findByPk(targetPickerId, {
        include: [{ model: UserDevice, as: "devices" }],
      });

      if (pickerWithDevices && (pickerWithDevices as any).devices && (pickerWithDevices as any).devices.length > 0) {
        const devices = (pickerWithDevices as any).devices;
        console.log(`📱 Found ${devices.length} device(s) for picker ${targetPickerId}`);

        for (const device of devices) {
          console.log(`📤 Sending push notification to device ${device.id} (${device.platform})`);
          
          try {
            await sendPushNotification(
              device.arn,
              "📦 New Wave Assigned",
              `Wave #${wave.waveNumber} has been assigned to you.`,
              { 
                route: "/waves",
                waveId: wave.id.toString(),
                waveNumber: wave.waveNumber,
                orderId: wave.orderId?.toString() || "",
                priority: wave.priority,
                assignedAt: wave.assignedAt?.toString() || ""
              }
            );
            console.log(`✅ Push notification sent to device ${device.id}`);
          } catch (pushError: any) {
            console.error(`❌ Failed to send push notification to device ${device.id}:`, pushError.message);
          }
        }
      } else {
        console.log(`⚠️ No devices registered for picker ${targetPickerId}`);
      }

      return ResponseHandler.success(res, {
        message: 'Wave assigned successfully',
        assignment: {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          pickerId: targetPickerId,
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
   * Manually reassign a wave to a different picker
   */
  static async reassignWaveToPicker(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { waveId, newPickerId, reason } = req.body;

      console.log(`🔄 Reassignment request: waveId=${waveId}, newPickerId=${newPickerId}, reason=${reason}`);

      if (!waveId || !newPickerId) {
        return ResponseHandler.error(res, 'Wave ID and new picker ID are required', 400);
      }

      // Validate wave exists and is currently assigned
      const wave = await PickingWave.findByPk(waveId);
      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      if (!wave.pickerId) {
        return ResponseHandler.error(res, 'Wave is not currently assigned to any picker', 400);
      }

      if (wave.status === 'COMPLETED' || wave.status === 'CANCELLED') {
        return ResponseHandler.error(res, `Cannot reassign wave with status: ${wave.status}`, 400);
      }

      const oldPickerId = wave.pickerId;

      // Validate new picker exists and has picking permissions
      const newPicker = await User.findByPk(newPickerId, {
        attributes: ['id', 'email', 'availabilityStatus', 'isActive', 'roleId']
      });

      if (!newPicker) {
        return ResponseHandler.error(res, 'New picker not found', 404);
      }

      // Check if new picker is available
      if (newPicker.availabilityStatus !== 'available') {
        return ResponseHandler.error(res, `New picker is not available. Current status: ${newPicker.availabilityStatus}`, 400);
      }

      // Check if new picker has picking permissions (roleId 4 = wh_staff_2 has picking permissions)
      if (newPicker.roleId !== 4) {
        return ResponseHandler.error(res, 'New picker does not have picking permissions', 403);
      }

      // Wave limit check removed - pickers can now handle unlimited waves

      // Prevent reassigning to the same picker
      if (oldPickerId === newPickerId) {
        return ResponseHandler.error(res, 'Cannot reassign wave to the same picker', 400);
      }

      console.log(`🔄 Reassigning wave ${waveId} from picker ${oldPickerId} to picker ${newPickerId} (${newPicker.email})`);

      // Update wave with new assignment
      await wave.update({
        pickerId: newPickerId,
        assignedAt: new Date(),
        // Keep the wave status as ASSIGNED or PICKING, don't reset to GENERATED
        status: wave.status === 'PICKING' ? 'PICKING' : 'ASSIGNED'
      });

      console.log(`✅ Successfully reassigned wave ${waveId} to picker ${newPicker.email}`);

      // WebSocket and push notification modules are already imported at the top

      // 🔥 Emit event to new assigned picker
      socketManager.emitToPicker(Number(newPickerId), 'waveReassigned', {
        waveId: wave.id,
        waveNumber: wave.waveNumber,
        orderId: wave.orderId,
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
        reason: reason || 'Wave reassigned to another picker',
        reassignedTo: {
          pickerId: newPickerId,
          pickerEmail: newPicker.email
        }
      });
      console.log(`📨 Emitted waveUnassigned to old picker_${oldPickerId}`);

      // 👉 Send Push Notification to new picker
      console.log(`🔍 Looking up new picker ${newPickerId} for push notification...`);
      const newPickerWithDevices = await User.findByPk(newPickerId, {
        include: [{ model: UserDevice, as: "devices" }],
      });

      if (newPickerWithDevices && (newPickerWithDevices as any).devices && (newPickerWithDevices as any).devices.length > 0) {
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

      // 👉 Send Push Notification to old picker
      console.log(`🔍 Looking up old picker ${oldPickerId} for push notification...`);
      const oldPickerWithDevices = await User.findByPk(oldPickerId, {
        include: [{ model: UserDevice, as: "devices" }],
      });

      if (oldPickerWithDevices && (oldPickerWithDevices as any).devices && (oldPickerWithDevices as any).devices.length > 0) {
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
        message: 'Wave reassigned successfully',
        reassignment: {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          oldPickerId: oldPickerId,
          newPickerId: newPickerId,
          newPickerEmail: newPicker.email,
          reassignedAt: wave.assignedAt,
          reason: reason || 'Manual reassignment',
          priority: wave.priority
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

      const whereClause: any = {};
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
        console.log(`🔒 Filtering waves for user ${user.id} with role: ${userRole?.name || 'unknown'}`);
      } else {
        console.log(`👑 Admin user ${user.id} with role: ${userRole?.name} can see all waves`);
      }

      const waves = await PickingWave.findAndCountAll({
        where: whereClause,
        //order: [['priority', 'DESC'], ['slaDeadline', 'ASC']],
        order: [['id', 'DESC']],
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

      // Check if there are any picklist items with DEFAULT-BIN location for this SKU
      const defaultBinItems = await PicklistItem.findAll({
        where: { 
          waveId: parseInt(waveId),
          sku: skuID,
          binLocation: 'DEFAULT-BIN',
          status: ['PENDING', 'PICKING']
        }
      });

      const hasDefaultBinItems = defaultBinItems.length > 0;

      // If there are DEFAULT-BIN items, bypass strict validation
      if (hasDefaultBinItems) {
        console.log(`DEFAULT-BIN bypass: Allowing scan for SKU ${skuID} at bin location ${binlocation}`);
        
        return ResponseHandler.success(res, {
          message: 'DEFAULT-BIN item validated successfully - bypassing strict validation',
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
          waveId: parseInt(waveId)
        });
      }

      // Removed strict validation - now accepts any bin location
      console.log(`Allowing scan for SKU ${skuID} at bin location ${binlocation} (validation bypassed)`);

      // Removed scanner bin validation - now accepts any bin location and SKU combination
      console.log(`Bypassing scanner bin validation for SKU ${skuID} at bin location ${binlocation}`);

      // Find picklist items with matching SKU (regardless of bin location)
      const picklistItems = await PicklistItem.findAll({
        where: { 
          waveId: parseInt(waveId),
          sku: skuID,
          status: ['PENDING', 'PICKING']
        }
      });

      const binLocationFound = picklistItems.length > 0;

      return ResponseHandler.success(res, {
        message: binLocationFound ? 'SKU validated successfully - all validations bypassed' : 'SKU validated but no picklist items found',
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

      // Resolve SKU from input (could be SKU or EAN)
      let resolvedSku: string;
      let foundBy: 'sku' | 'ean';
      
      // First, try to find by SKU directly
      let product = await Product.findOne({
        where: { sku: skuID }
      });
      
      if (product) {
        resolvedSku = product.sku;
        foundBy = 'sku';
      } else {
        // If not found by SKU, try to find by EAN_UPC
        product = await Product.findOne({
          where: { ean_upc: skuID }
        });
        
        if (product) {
          resolvedSku = product.sku;
          foundBy = 'ean';
        } else {
          // Neither SKU nor EAN found
          return ResponseHandler.error(res, `Both SKU and EAN not found for: ${skuID}`, 404);
        }
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

      // Check if there are any picklist items with DEFAULT-BIN location for this SKU
      const defaultBinItems = await PicklistItem.findAll({
        where: { 
          waveId: parseInt(waveId),
          sku: resolvedSku,
          binLocation: 'DEFAULT-BIN',
          status: ['PENDING', 'PICKING']
        }
      });

      const hasDefaultBinItems = defaultBinItems.length > 0;

      // If there are DEFAULT-BIN items, bypass strict validation
      if (hasDefaultBinItems) {
        console.log(`DEFAULT-BIN bypass: Allowing SKU scan for ${resolvedSku} at bin location ${binlocation}`);
        
        // Find the first DEFAULT-BIN item to update
        const currentItem = defaultBinItems[0];
        
        // Update item status to PICKED
        await currentItem.update({
          status: 'PICKED',
          pickedQuantity: currentItem.quantity,
          pickedAt: new Date(),
          pickedBy: pickerId
        });

        return ResponseHandler.success(res, {
          message: 'DEFAULT-BIN item picked successfully - bypassing strict validation',
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
          waveId: parseInt(waveId)
        });
      }

      // Find SKU scan in scanner_sku table (only for non-DEFAULT-BIN items)
      const scannerSku = await ScannerSku.findOne({
        where: { skuScanId: resolvedSku }
      });

      if (!scannerSku) {
        return ResponseHandler.success(res, {
          message: 'SKU scan not found in system',
          skuFound: false,
          scannedId,
          skuID,
          resolvedSku,
          foundBy,
          waveId: parseInt(waveId),
          error: 'INVALID_SKU_SCAN'
        });
      }

      // Removed strict bin location validation - now accepts any bin location
      console.log(`Allowing SKU scan for ${resolvedSku} at bin location ${binlocation} (validation bypassed)`);

      // Find picklist item with matching SKU and bin location
      const currentItem = await PicklistItem.findOne({
        where: { 
          waveId: parseInt(waveId),
          sku: resolvedSku,
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
          resolvedSku,
          foundBy,
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

      // Update inventory - increase picklist_quantity when items are picked
      try {
        const inventoryResult = await DirectInventoryService.updateInventory({
          sku: resolvedSku,
          operation: INVENTORY_OPERATIONS.PICKLIST,
          quantity: currentItem.quantity, // Positive to increase picklist quantity
          referenceId: `PICK-WAVE-${waveId}`,
          operationDetails: {
            waveId: parseInt(waveId),
            waveNumber: wave.waveNumber,
            picklistItemId: currentItem.id,
            binLocation: binlocation,
            pickedAt: new Date(),
            pickedBy: pickerId
          },
          performedBy: pickerId
        });

        if (!inventoryResult.success) {
          console.error(`Failed to update inventory for SKU ${resolvedSku}:`, inventoryResult.message);
          // Don't fail the picking process, just log the error
        }
      } catch (inventoryError) {
        console.error('Inventory update error during picking:', inventoryError);
        // Don't fail the picking process, just log the error
      }

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

    // Debug: Check if any picklist items exist for this wave
    const totalItemsForWave = await PicklistItem.count({
      where: { waveId: parseInt(waveId) }
    });
    console.log(`Total picklist items found for wave ${waveId}: ${totalItemsForWave}`);

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
    imageUrl: item.productInfo?.image_url || null,  // Safely access productInfo
    ean: item.productInfo?.ean_upc || null,
    mrp: item.productInfo?.mrp || null,
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

      // Verify wave exists
      const wave = await PickingWave.findByPk(waveId);
      if (!wave) {
        return ResponseHandler.error(res, 'Wave not found', 404);
      }

      // Check permissions
      const userPermissions = req.user!.permissions || [];
      const canManage = userPermissions.includes('picking:assign_manage') || userPermissions.includes('picking:view');
      if (!canManage) {
        return ResponseHandler.error(res, 'Insufficient permissions to manage this wave', 403);
      }

      // Create picklist items
      const result = await PickingController.createPicklistItemsForWave(parseInt(waveId));

      if (result.success) {
        return ResponseHandler.success(res, {
          message: result.message,
          createdItems: result.createdItems,
          waveId: parseInt(waveId)
        });
      } else {
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
  static async generatePicklistInternal(orderId: number): Promise<{ success: boolean; message: string; waveId?: number }> {
    try {
      console.log(`🔄 Generating picklist internally for order ID: ${orderId}`);
      
      // Get the order data
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const orderData = order.get({ plain: true });
      const waveNumber = `W${Date.now()}-${orderData.id}`;
      
      // Calculate SLA deadline (24 hours from now)
      const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Calculate total items for this single order
      let totalItems = 0;
      if (orderData.cart && Array.isArray(orderData.cart)) {
        totalItems = orderData.cart.reduce((sum: number, item: any) => {
          return sum + (item.quantity || 1);
        }, 0);
      }
      
      // Create the picking wave
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
        orderId: orderData.id
      } as any);
      
      console.log(`✅ Created picking wave ${wave.id} for order ${orderId}`);

      // Create picklist items for this single order
      let actualTotalItems = 0;
      let createdItems = 0;
      
      if (orderData.cart && Array.isArray(orderData.cart)) {
        for (let i = 0; i < orderData.cart.length; i++) {
          const item = orderData.cart[i];
          
          if (item && item.sku !== undefined && item.sku !== null) {
            const quantity = item.quantity || (item.amount ? 1 : 1);
            
            try {
              // First, ensure the SKU exists in product_master table
              const skuString = item.sku.toString();
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
                    MRP: orderData.order_amount || 0.00, // Use total order amount from PHP
                    CreatedDate: new Date().toISOString(),
                    updated_at: new Date()
                  } as any);
                  console.log(`✅ Created placeholder product for SKU ${skuString} with MRP: ${orderData.order_amount}`);
                } catch (productCreateError: any) {
                  console.error(`❌ Failed to create placeholder product for SKU ${skuString}:`, productCreateError.message);
                  // Continue anyway, we'll try to create the picklist item
                }
              } else {
                // Product exists, but let's update MRP if the current order has a different amount
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

              // Find the SKU in ScannerSku table to get bin location
              const scannerSku = await ScannerSku.findOne({
                where: { skuScanId: skuString }
              });

              let binLocation: string = PICKING_CONSTANTS.DEFAULT_BIN_LOCATION;
              let productName = `Product-${skuString}`;

              if (scannerSku) {
                const scannerBin = await ScannerBin.findOne({
                  where: {
                    binLocationScanId: scannerSku.binLocationScanId
                  }
                });

                if (scannerBin) {
                  binLocation = scannerBin.binLocationScanId;
                } else {
                  console.warn(`Bin location not found for SKU ${skuString}. Checking category-based fallback.`);
                  
                  // iii. Category-based fallback: Get SKU category from product_master
                  const product = await Product.findOne({
                    where: { sku: skuString },
                    attributes: ['Category']
                  });

                  if (product && product.category) {
                    console.log(`Found product category "${product.category}" for SKU ${skuString}. Checking bin_locations.`);
                    
                      // Find bin location by category mapping using MySQL JSON_CONTAINS
                      const { BinLocation } = await import('../models/index.js');
                      const { Sequelize } = require('sequelize');
                      const categoryBasedBin = await BinLocation.findOne({
                        where: Sequelize.and(
                          { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                          Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                        ),
                        order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC // Get first matching bin
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
                
                // iii. Category-based fallback: Get SKU category from product_master
                const product = await Product.findOne({
                  where: { sku: skuString },
                  attributes: ['Category']
                });

                if (product && product.category) {
                  console.log(`Found product category "${product.category}" for SKU ${skuString}. Checking bin_locations.`);
                  
                  // Find bin location by category mapping
                  const { BinLocation } = await import('../models/index.js');
                  const categoryBasedBin = await BinLocation.findOne({
                    where: {
                      category_mapping: {
                        [require('sequelize').Op.contains]: [product.category]
                      },
                      status: 'active'
                    },
                    order: [['id', 'ASC']] // Get first matching bin
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

              const picklistItem = await PicklistItem.create({
                waveId: wave.id,
                orderId: orderData.id,
                sku: skuString,
                productName: productName,
                binLocation: binLocation,
                quantity: quantity,
                scanSequence: Math.floor(Math.random() * 100) + 1,
                fefoBatch: false ? `BATCH-${Date.now()}` : undefined,
                expiryDate: false ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
              } as any);
              
              createdItems++;
              actualTotalItems += quantity;
              console.log(`✅ Created picklist item for SKU ${item.sku} with bin location ${binLocation}`);
              
              } catch (createError) {
                console.error(`❌ Error creating picklist item for SKU ${item.sku}:`, createError);
                // Try to create with minimal data
                try {
                  const skuString = item.sku.toString();
                  
                  // Ensure product exists before creating picklist item
                  let productExists = await Product.findOne({
                    where: { sku: skuString }
                  });

                  if (!productExists) {
                    console.log(`📦 Creating placeholder product for SKU ${skuString} (fallback)`);
                    try {
                      await Product.create({
                        SKU: skuString,
                        ProductName: `Product-${skuString}`,
                        ImageURL: '',
                        EAN_UPC: '',
                        MRP: orderData.order_amount || 0.00, // Use total order amount from PHP
                        CreatedDate: new Date().toISOString(),
                        updated_at: new Date()
                      } as any);
                      console.log(`✅ Created placeholder product for SKU ${skuString} (fallback)`);
                    } catch (productCreateError: any) {
                      console.error(`❌ Failed to create placeholder product for SKU ${skuString} (fallback):`, productCreateError.message);
                    }
                  }

                  await PicklistItem.create({
                    waveId: wave.id,
                    orderId: orderData.id,
                    sku: skuString,
                    productName: `Product-${skuString}`,
                    binLocation: PICKING_CONSTANTS.DEFAULT_BIN_LOCATION,
                    quantity: quantity,
                    scanSequence: Math.floor(Math.random() * 100) + 1,
                    fefoBatch: false ? `BATCH-${Date.now()}` : undefined,
                    expiryDate: false ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
                  } as any);
                  
                  createdItems++;
                  actualTotalItems += quantity;
                  console.log(`✅ Created fallback picklist item for SKU ${item.sku}`);
                } catch (fallbackError) {
                  console.error(`❌ Failed to create even fallback picklist item for SKU ${item.sku}:`, fallbackError);
                }
              }
          }
        }
      }

      // Update wave with actual total items
      await wave.update({ totalItems: actualTotalItems });

      console.log(`🎉 Successfully created ${createdItems} picklist items for wave ${wave.id}`);
      
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
  static async createPicklistItemsForWave(waveId: number): Promise<{ success: boolean; message: string; createdItems: number }> {
    try {
      // Check if picklist items already exist for this wave
      const existingItems = await PicklistItem.count({
        where: { waveId }
      });

      if (existingItems > 0) {
        return {
          success: true,
          message: `Wave ${waveId} already has ${existingItems} picklist items`,
          createdItems: existingItems
        };
      }

      // Get the wave details
      const wave = await PickingWave.findByPk(waveId);
      if (!wave) {
        return {
          success: false,
          message: `Wave ${waveId} not found`,
          createdItems: 0
        };
      }

      // Find the order associated with this wave
      // Since we use one-order-per-wave, we can find the order by looking at the wave number
      const orderIdFromWave = wave.waveNumber.split('-')[1]; // Extract order_id from wave number
      
      const order = await Order.findOne({
        where: { id: orderIdFromWave },
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
      console.log(`Creating picklist items for wave ${waveId}, order: ${orderData.id}`);

      // Create picklist items for this order
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

              let binLocation: string = PICKING_CONSTANTS.DEFAULT_BIN_LOCATION; // Default bin location
              let productName = `Product-${item.sku}`;

              if (scannerSku) {
                // Get the bin location from ScannerBin table
                const scannerBin = await ScannerBin.findOne({
                  where: {
                    binLocationScanId: scannerSku.binLocationScanId
                  }
                });

                if (scannerBin) {
                  binLocation = scannerBin.binLocationScanId;
                } else {
                  console.warn(`Bin location not found for SKU ${item.sku}. Checking category-based fallback.`);
                  
                  // iii. Category-based fallback: Get SKU category from product_master
                  const product = await Product.findOne({
                    where: { sku: item.sku.toString() },
                    attributes: ['Category']
                  });

                  if (product && product.category) {
                    console.log(`Found product category "${product.category}" for SKU ${item.sku}. Checking bin_locations.`);
                    
                      // Find bin location by category mapping using MySQL JSON_CONTAINS
                      const { BinLocation } = await import('../models/index.js');
                      const { Sequelize } = require('sequelize');
                      const categoryBasedBin = await BinLocation.findOne({
                        where: Sequelize.and(
                          { [PICKING_CONSTANTS.COLUMNS.STATUS]: PICKING_CONSTANTS.STATUS.ACTIVE },
                          Sequelize.literal(`JSON_CONTAINS(category_mapping, JSON_QUOTE('${product.category}'))`)
                        ),
                        order: PICKING_CONSTANTS.QUERY_OPTIONS.ORDER_BY_ID_ASC // Get first matching bin
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
              } else {
                console.warn(`SKU ${item.sku} not found in scanner system. Checking category-based fallback.`);
                
                // iii. Category-based fallback: Get SKU category from product_master
                const product = await Product.findOne({
                  where: { sku: item.sku.toString() },
                  attributes: ['Category']
                });

                if (product && product.category) {
                  console.log(`Found product category "${product.category}" for SKU ${item.sku}. Checking bin_locations.`);
                  
                  // Find bin location by category mapping
                  const { BinLocation } = await import('../models/index.js');
                  const categoryBasedBin = await BinLocation.findOne({
                    where: {
                      category_mapping: {
                        [require('sequelize').Op.contains]: [product.category]
                      },
                      status: 'active'
                    },
                    order: [['id', 'ASC']] // Get first matching bin
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

              const picklistItem = await PicklistItem.create({
                waveId: waveId,
                orderId: orderData.id,
                sku: item.sku.toString(),
                productName: productName,
                binLocation: binLocation,
                quantity: quantity,
                scanSequence: Math.floor(Math.random() * 100) + 1,
                fefoBatch: wave.fefoRequired ? `BATCH-${Date.now()}` : undefined,
                expiryDate: wave.fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
              } as any);
              
              createdItems++;
              actualTotalItems += quantity;
              console.log(`Created picklist item for SKU ${item.sku} with bin location ${binLocation}`);
              
            } catch (createError) {
              console.error(`Error creating picklist item for SKU ${item.sku}:`, createError);
              // Try to create with minimal data
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
                  expiryDate: wave.fefoRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
                } as any);
                
                createdItems++;
                actualTotalItems += quantity;
                console.log(`Created fallback picklist item for SKU ${item.sku}`);
              } catch (fallbackError) {
                console.error(`Failed to create even fallback picklist item for SKU ${item.sku}:`, fallbackError);
              }
            }
          }
        }
      }

      // Update wave with actual counts
      await wave.update({
        totalItems: actualTotalItems
      });

      console.log(`Created ${createdItems} picklist items for wave ${waveId}, total items: ${actualTotalItems}`);

      return {
        success: true,
        message: `Successfully created ${createdItems} picklist items for wave ${waveId}`,
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


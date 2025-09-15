import { Request, Response } from 'express';
import ReturnRequestItem from '../models/ReturnRequestItem';
import Order from '../models/Order';
import OrderDetail from '../models/OrderDetail';
import User from '../models/User';
import Product from '../models/productModel';
import ScannerBin from '../models/ScannerBin';
import ScannerSku from '../models/ScannerSku';
import BinLocation from '../models/BinLocation';
import sequelize from '../config/database';
import { RETURN_CONSTANTS, RETURN_BIN_ROUTING } from '../config/returnConstants';
import { ResponseHandler } from '../middleware/responseHandler';

interface AuthRequest extends Request {
  user?: any;
}

export class ReturnRequestItemController {
  
  /**
   * Create a new return request item (consolidated)
   */
  static async createReturnRequestItem(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const returnData = req.body;
      
      // Generate unique return order ID with timestamp to avoid duplicates
      const timestamp = Date.now();
      const returnOrderId = `${returnData.original_order_id}${RETURN_CONSTANTS.RETURN_ORDER_ID.SUFFIX}`;
      
      // Verify original order exists
      console.log(`🔍 Looking for original order: ${returnData.original_order_id}`);
      const originalOrder = await Order.findOne({ 
        where: { order_id: returnData.original_order_id } 
      });
      
      if (!originalOrder) {
        console.log('❌ Original order not found');
        return ResponseHandler.error(res, 'Original order not found', 404);
      }
      
      console.log('✅ Original order found:', {
        id: originalOrder.id,
        order_id: originalOrder.order_id,
        user_id: originalOrder.user_id
      });
      
      // Validate required fields
      if (!returnData.items || !Array.isArray(returnData.items) || returnData.items.length === 0) {
        return ResponseHandler.error(res, 'Items array is required', 400);
      }
      
      // Create return request items for each item
      const returnRequestItems: any[] = [];
      
      for (const itemData of returnData.items) {
        const returnRequestItem = await ReturnRequestItem.create({
          return_order_id: returnOrderId,
          original_order_id: returnData.original_order_id,
          customer_id: returnData.customer_id,
          return_reason: returnData.return_reason,
          return_type: returnData.return_type || RETURN_CONSTANTS.DEFAULTS.RETURN_TYPE,
          status: returnData.status || RETURN_CONSTANTS.DEFAULTS.STATUS,
          total_items_count: returnData.items.length,
          total_return_amount: returnData.total_return_amount || 0.00,
          pidge_tracking_id: returnData.pidge_tracking_id,
          pickup_address: returnData.pickup_address,
          return_notes: returnData.return_notes,
          images: returnData.images,
          
          item_id: itemData.item_id,
          quantity: itemData.quantity,
          item_details: itemData.item_details,
          variation: itemData.variation,
          price: itemData.price || 0.00,
          item_images: itemData.images,
          item_notes: itemData.notes,
          
          qc_status: RETURN_CONSTANTS.DEFAULTS.QC_STATUS,
          
          timeline_events: [{
            event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.CREATED,
            status: RETURN_CONSTANTS.DEFAULTS.STATUS,
            notes: `Return request created for item ${itemData.item_id}`,
            metadata: returnData.customer_feedback ? { 
              customer_feedback: returnData.customer_feedback,
              overall_rating: returnData.overall_rating 
            } : null,
            created_at: Date.now(),
            created_by: returnData.created_by || 1
          }],
          last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.CREATED,
          last_event_notes: `Return request created for item ${itemData.item_id}`,
          last_event_metadata: returnData.customer_feedback ? { 
            customer_feedback: returnData.customer_feedback,
            overall_rating: returnData.overall_rating 
          } : null,
          
          is_try_and_buy: returnData.return_type === 'try_and_buy_return' ? 1 : 0,
          customer_feedback: returnData.customer_feedback,
          overall_rating: returnData.overall_rating,
          item_feedback: itemData.item_feedback,
          item_rating: itemData.item_rating,
          try_and_buy_reason: itemData.try_and_buy_reason,
          
          created_at: Date.now(),
          updated_at: Date.now(),
          created_by: returnData.created_by || 1
        });
        
        returnRequestItems.push(returnRequestItem);
      }
      
      // Update Order table with return_item_id
      try {
        console.log(`🔄 Updating Order table with return_item_id: ${returnOrderId} for order_id: ${returnData.original_order_id}`);
        const orderUpdateResult = await Order.update(
          { return_item_id: returnOrderId } as any,
          { where: { order_id: returnData.original_order_id } }
        );
        console.log(`✅ Order update result:`, orderUpdateResult);
        } catch (orderError) {
          console.error('❌ Order update error:', orderError);
        }
      
      // Update OrderDetail table with return_item_id for each returned item
      try {
        for (const returnRequestItem of returnRequestItems) {
          console.log(`🔄 Updating OrderDetail table with return_item_id: ${returnOrderId} for order_id: ${originalOrder.id}, item_id: ${returnRequestItem.item_id}`);
          const orderDetailUpdateResult = await OrderDetail.update(
            { return_item_id: returnOrderId } as any,
            { 
              where: { 
                order_id: originalOrder.id,
                item_id: returnRequestItem.item_id
              } 
            }
          );
          console.log(`✅ OrderDetail update result:`, orderDetailUpdateResult);
        }
      } catch (orderDetailError) {
        console.error('❌ OrderDetail update error:', orderDetailError);
      }
      
      return res.status(201).json({
        statusCode: 201,
        success: true,
        data: {
          returnOrderId,
          returnRequestItems,
          totalItems: returnRequestItems.length
        },
        error: null
      });
      
    } catch (error) {
      console.error('Create return request item error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
  
  /**
   * Get return request items by return order ID
   */
  static async getReturnRequestItems(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { returnOrderId } = req.params;
      
      const returnRequestItems = await ReturnRequestItem.findAll({
        where: { return_order_id: returnOrderId },
        // Commented out user includes due to missing 'name' column in Users table
        // include: [
        //   { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        //   { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
        // ],
        order: [['created_at', 'DESC']]
      });
      
      if (returnRequestItems.length === 0) {
        return ResponseHandler.error(res, 'Return request items not found', 404);
      }
      
      return ResponseHandler.success(res, {
        returnOrderId,
        totalItems: returnRequestItems.length,
        returnRequestItems
      });
      
    } catch (error) {
      console.error('Get return request items error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
  
  /**
   * Update return request item status
   */
  static async updateReturnRequestItemStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, notes, metadata } = req.body;
      
      const returnRequestItem = await ReturnRequestItem.findByPk(id);
      
      if (!returnRequestItem) {
        return ResponseHandler.error(res, 'Return request item not found', 404);
      }
      
      // Add new timeline event
      const timelineEvents = returnRequestItem.timeline_events || [];
        timelineEvents.push({
          event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.STATUS_UPDATED,
          status: status,
          notes: notes || `Status updated to ${status}`,
          metadata: metadata,
          created_at: Date.now(),
          // Commented out user validation - using default created_by value
          // created_by: req.user?.id || 1
          created_by: 1
        });
      
      // Update the return request item
      await returnRequestItem.update({
        status: status,
        timeline_events: timelineEvents,
        last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.STATUS_UPDATED,
        last_event_notes: notes || `Status updated to ${status}`,
        last_event_metadata: metadata,
        updated_at: Date.now()
      });
      
      return ResponseHandler.success(res, {
        message: 'Return request item status updated successfully',
        returnRequestItem
      });
      
    } catch (error) {
      console.error('Update return request item status error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
  
  /**
   * Handle Pidge webhook for return status updates
   */
  static async handlePidgeWebhook(req: Request, res: Response): Promise<Response> {
    try {
      const webhookData = req.body;
      const { reference_id, return_order_id, status, fulfillment } = webhookData;
      
      // Accept either reference_id or return_order_id
      const orderId = reference_id || return_order_id;
      
      if (!orderId) {
        return ResponseHandler.error(res, 'Invalid payload - reference_id or return_order_id required', 400);
      }
      
      // Find return request items by return order ID
      const returnRequestItems = await ReturnRequestItem.findAll({
        where: { return_order_id: orderId }
      });
      
      if (returnRequestItems.length === 0) {
        return ResponseHandler.error(res, 'Return request items not found', 404);
      }
      
      // Map external status to internal status
      let newStatus = returnRequestItems[0].status;
      let eventType = RETURN_CONSTANTS.TIMELINE_EVENTS.STATUS_UPDATED;
      
      switch (status) {
        case 'PICKUP_SCHEDULED':
          newStatus = RETURN_CONSTANTS.STATUSES.PICKUP_SCHEDULED;
          eventType = RETURN_CONSTANTS.TIMELINE_EVENTS.PICKUP_SCHEDULED;
          break;
        case 'IN_TRANSIT':
          newStatus = RETURN_CONSTANTS.STATUSES.IN_TRANSIT;
          eventType = RETURN_CONSTANTS.TIMELINE_EVENTS.IN_TRANSIT;
          break;
        case 'RECEIVED':
          newStatus = RETURN_CONSTANTS.STATUSES.RECEIVED;
          eventType = RETURN_CONSTANTS.TIMELINE_EVENTS.RECEIVED;
          break;
        default:
          newStatus = returnRequestItems[0].status;
      }
      
      // Update all return request items
      for (const returnRequestItem of returnRequestItems) {
        const timelineEvents = returnRequestItem.timeline_events || [];
        timelineEvents.push({
          event_type: eventType,
          status: newStatus,
          notes: `Status updated via Pidge webhook: ${status}`,
          metadata: { 
            external_status: status,
            fulfillment: fulfillment,
            webhook_data: webhookData,
            order_id: orderId
          },
          created_at: Date.now(),
          created_by: 1 // System user
        });
        
        await returnRequestItem.update({
          status: newStatus,
          timeline_events: timelineEvents,
          last_event_type: eventType,
          last_event_notes: `Status updated via Pidge webhook: ${status}`,
          last_event_metadata: { 
            external_status: status,
            fulfillment: fulfillment
          },
          updated_at: Date.now()
        });
      }
      
      return ResponseHandler.success(res, {
        message: 'Webhook processed successfully',
        updatedItems: returnRequestItems.length,
        newStatus
      });
      
    } catch (error) {
      console.error('Pidge webhook error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
  
  /**
   * Process QC for return request item
   */
  static async processQC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { qc_status, qc_notes, condition_assessment } = req.body;
      
      const returnRequestItem = await ReturnRequestItem.findByPk(id);
      
      if (!returnRequestItem) {
        return ResponseHandler.error(res, 'Return request item not found', 404);
      }
      
      // Add QC timeline event
      const timelineEvents = returnRequestItem.timeline_events || [];
      timelineEvents.push({
        event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.QC_COMPLETED,
        status: returnRequestItem.status,
        notes: `QC completed with status: ${qc_status}`,
        metadata: { 
          qc_status,
          qc_notes,
          condition_assessment
        },
        created_at: Date.now(),
        // Commented out user validation - using default created_by value
        // created_by: req.user?.id || 1
        created_by: 1
      });
      
      // Update the return request item
      await returnRequestItem.update({
        qc_status: qc_status,
        qc_notes: qc_notes,
        // Commented out user validation - using default qc_by value
        // qc_by: req.user?.id || 1,
        qc_by: 1,
        qc_at: Date.now(),
        timeline_events: timelineEvents,
        last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.QC_COMPLETED,
        last_event_notes: `QC completed with status: ${qc_status}`,
        last_event_metadata: { 
          qc_status,
          qc_notes,
          condition_assessment
        },
        updated_at: Date.now()
      });
      
      return ResponseHandler.success(res, {
        message: 'QC processed successfully',
        returnRequestItem
      });
      
    } catch (error) {
      console.error('Process QC error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
  
  /**
   * Process GRN for return request item
   */
  static async processGRN(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { grn_id, received_quantity, expected_quantity, notes } = req.body;
      
      const returnRequestItem = await ReturnRequestItem.findByPk(id);
      
      if (!returnRequestItem) {
        return ResponseHandler.error(res, 'Return request item not found', 404);
      }
      
      // Add GRN timeline event
      const timelineEvents = returnRequestItem.timeline_events || [];
      timelineEvents.push({
        event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.GRN_CREATED,
        status: returnRequestItem.status,
        notes: `GRN created for return item`,
        metadata: { 
          grn_id,
          received_quantity,
          expected_quantity,
          notes
        },
        created_at: Date.now(),
        // Commented out user validation - using default created_by value
        // created_by: req.user?.id || 1
        created_by: 1
      });
      
      // Update the return request item
      await returnRequestItem.update({
        grn_id: grn_id,
        grn_status: 'created',
        received_quantity: received_quantity,
        expected_quantity: expected_quantity,
        timeline_events: timelineEvents,
        last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.GRN_CREATED,
        last_event_notes: `GRN created for return item`,
        last_event_metadata: { 
          grn_id,
          received_quantity,
          expected_quantity
        },
        updated_at: Date.now()
      });
      
      return ResponseHandler.success(res, {
        message: 'GRN processed successfully',
        returnRequestItem
      });
      
    } catch (error) {
      console.error('Process GRN error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
  
  /**
   * Process Putaway for return request item
   */
  static async processPutaway(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { bin_location_id, putaway_notes, routing_reason } = req.body;
      
      const returnRequestItem = await ReturnRequestItem.findByPk(id);
      
      if (!returnRequestItem) {
        return ResponseHandler.error(res, 'Return request item not found', 404);
      }
      
      // Determine bin location based on return type and QC status
      let finalBinLocation = bin_location_id;
      if (!finalBinLocation) {
        if (returnRequestItem.is_try_and_buy) {
          finalBinLocation = `${RETURN_BIN_ROUTING.TRY_AND_BUY.BIN_PREFIX}-001`;
        } else if (returnRequestItem.qc_status === 'failed') {
          finalBinLocation = `${RETURN_BIN_ROUTING.DEFECTIVE.BIN_PREFIX}-001`;
        } else if (returnRequestItem.qc_status === 'needs_repair') {
          finalBinLocation = `${RETURN_BIN_ROUTING.QUALITY_ISSUE.BIN_PREFIX}-001`;
        } else {
          finalBinLocation = `${RETURN_BIN_ROUTING.OTHER.BIN_PREFIX}-001`;
        }
      }
      
      // Add Putaway timeline event
      const timelineEvents = returnRequestItem.timeline_events || [];
      timelineEvents.push({
        event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.PUTAWAY_COMPLETED,
        status: returnRequestItem.status,
        notes: `Putaway completed to bin: ${finalBinLocation}`,
        metadata: { 
          bin_location_id: finalBinLocation,
          putaway_notes,
          routing_reason,
          is_try_and_buy: returnRequestItem.is_try_and_buy,
          qc_status: returnRequestItem.qc_status
        },
        created_at: Date.now(),
        // Commented out user validation - using default created_by value
        // created_by: req.user?.id || 1
        created_by: 1
      });
      
      // Update the return request item
      await returnRequestItem.update({
        putaway_status: 'completed',
        bin_location_id: finalBinLocation,
        // Commented out user validation - using default putaway_by value
        // putaway_by: req.user?.id || 1,
        putaway_by: 1,
        putaway_at: Date.now(),
        putaway_notes: putaway_notes,
        timeline_events: timelineEvents,
        last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.PUTAWAY_COMPLETED,
        last_event_notes: `Putaway completed to bin: ${finalBinLocation}`,
        last_event_metadata: { 
          bin_location_id: finalBinLocation,
          routing_reason
        },
        updated_at: Date.now()
      });
      
      return ResponseHandler.success(res, {
        message: 'Putaway processed successfully',
        returnRequestItem: {
          id: returnRequestItem.id,
          bin_location_id: finalBinLocation,
          putaway_status: 'completed',
          routing_reason: routing_reason || 'auto_routed'
        }
      });
      
    } catch (error) {
      console.error('Process Putaway error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
  
  /**
   * Get return request item timeline
   */
  static async getReturnRequestItemTimeline(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      const returnRequestItem = await ReturnRequestItem.findByPk(id, {
        // Commented out user includes due to missing 'name' column in Users table
        // include: [
        //   { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        //   { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
        // ]
      });
      
      if (!returnRequestItem) {
        return ResponseHandler.error(res, 'Return request item not found', 404);
      }
      
      return ResponseHandler.success(res, {
        returnRequestItem: {
          id: returnRequestItem.id,
          return_order_id: returnRequestItem.return_order_id,
          original_order_id: returnRequestItem.original_order_id,
          status: returnRequestItem.status,
          qc_status: returnRequestItem.qc_status,
          putaway_status: returnRequestItem.putaway_status,
          bin_location_id: returnRequestItem.bin_location_id,
          is_try_and_buy: returnRequestItem.is_try_and_buy
        },
        timeline: returnRequestItem.timeline_events || []
      });
      
    } catch (error) {
      console.error('Get return request item timeline error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // ==================== RETURN GRN APIs ====================

  /**
   * Get list of return orders ready for GRN
   */
  static async getReturnOrdersForGRN(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Find return request items with status 'received' that are ready for GRN
      const { count, rows } = await ReturnRequestItem.findAndCountAll({
        where: { 
          status: RETURN_CONSTANTS.STATUSES.RECEIVED,
          grn_status: { [require('sequelize').Op.or]: [null, 'pending'] }
        },
        include: [
          { model: Order, as: 'originalOrder', attributes: ['id', 'order_id', 'user_id', 'order_amount'] },
          { model: Product, as: 'product', attributes: ['SKU', 'ProductName', 'Category', 'Brand'] }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      // Group by return_order_id to get unique return orders
      const returnOrdersMap = new Map();
      
      rows.forEach((item: any) => {
        const returnOrderId = item.return_order_id;
        
        if (!returnOrdersMap.has(returnOrderId)) {
          returnOrdersMap.set(returnOrderId, {
            return_order_id: returnOrderId,
            original_order_id: item.original_order_id,
            customer_id: item.customer_id,
            return_type: item.return_type,
            total_items: 0,
            total_amount: item.total_return_amount || 0,
            received_date: item.created_at,
            items: []
          });
        }
        
        const returnOrder = returnOrdersMap.get(returnOrderId);
        returnOrder.total_items += 1;
        returnOrder.items.push({
          id: item.id,
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
          item_details: item.item_details,
          variation: item.variation,
          product: (item as any).product
        });
      });

      const returnOrders = Array.from(returnOrdersMap.values());

      return ResponseHandler.success(res, {
        returnOrders,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Get return orders for GRN error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Start GRN status update for return items
   */
  static async startReturnGRN(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { returnOrderId } = req.params;
      const { grn_notes } = req.body;

      // Find all return request items for this return order
      const returnRequestItems = await ReturnRequestItem.findAll({
        where: { return_order_id: returnOrderId },
        include: [
          { model: Order, as: 'originalOrder', attributes: ['id', 'order_id', 'user_id'] },
          { model: Product, as: 'product', attributes: ['SKU', 'ProductName', 'Category'] }
        ]
      });

      if (returnRequestItems.length === 0) {
        return ResponseHandler.error(res, 'Return request items not found', 404);
      }

      // Update status to indicate GRN is starting
      for (const item of returnRequestItems) {
        const timelineEvents = item.timeline_events || [];
        timelineEvents.push({
          event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.GRN_CREATED,
          status: item.status,
          notes: `GRN process started for return order ${returnOrderId}`,
          metadata: { 
            grn_notes,
            grn_started_at: Date.now()
          },
          created_at: Date.now(),
          created_by: 1
        });

        await item.update({
          grn_status: 'in_progress',
          timeline_events: timelineEvents,
          last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.GRN_CREATED,
          last_event_notes: `GRN process started for return order ${returnOrderId}`,
          updated_at: Date.now()
        });
      }

      return ResponseHandler.success(res, {
        message: 'GRN process started successfully',
        returnOrderId,
        totalItems: returnRequestItems.length,
        items: returnRequestItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          quantity: item.quantity,
          product: (item as any).product
        }))
      });

    } catch (error) {
      console.error('Start return GRN error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get return order details for GRN (similar to /api/grn/1)
   */
  static async getReturnOrderDetailsForGRN(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { returnOrderId } = req.params;

      // Get all return request items for this return order
      const returnRequestItems = await ReturnRequestItem.findAll({
        where: { return_order_id: returnOrderId },
        include: [
          { model: Order, as: 'originalOrder', attributes: ['id', 'order_id', 'user_id', 'order_amount', 'created_at'] },
          { model: Product, as: 'product', attributes: ['SKU', 'ProductName', 'Category', 'Brand', 'MRP', 'COST'] }
        ],
        order: [['created_at', 'ASC']]
      });

      if (returnRequestItems.length === 0) {
        return ResponseHandler.error(res, 'Return request items not found', 404);
      }

      const firstItem = returnRequestItems[0];
      
      // Prepare GRN details similar to existing GRN structure
      const grnDetails = {
        grn: {
          id: `RET-${returnOrderId}`,
          return_order_id: returnOrderId,
          original_order_id: firstItem.original_order_id,
          customer_id: firstItem.customer_id,
          return_type: firstItem.return_type,
          status: firstItem.grn_status || 'pending',
          total_items_count: returnRequestItems.length,
          total_return_amount: firstItem.total_return_amount || 0,
          created_at: firstItem.created_at,
          updated_at: firstItem.updated_at
        },
        lines: returnRequestItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          sku_id: item.item_id, // Using item_id as SKU for return items
          ordered_qty: item.quantity,
          received_qty: item.quantity, // For returns, received = ordered
          pending_qty: 0,
          rejected_qty: 0,
          held_qty: 0,
          rtv_qty: 0,
          line_status: 'pending',
          product: (item as any).product,
          item_details: item.item_details,
          variation: item.variation,
          price: item.price,
          is_try_and_buy: item.is_try_and_buy
        })),
        originalOrder: (firstItem as any).originalOrder
      };

      return ResponseHandler.success(res, grnDetails);

    } catch (error) {
      console.error('Get return order details for GRN error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Create GRN for return items
   */
  static async createReturnGRN(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { returnOrderId } = req.params;
      const { lines, grn_notes } = req.body;

      if (!lines || !Array.isArray(lines) || lines.length === 0) {
        return ResponseHandler.error(res, 'Lines array is required', 400);
      }

      // Find all return request items for this return order
      const returnRequestItems = await ReturnRequestItem.findAll({
        where: { return_order_id: returnOrderId }
      });

      if (returnRequestItems.length === 0) {
        return ResponseHandler.error(res, 'Return request items not found', 404);
      }

      // Process each line
      for (const line of lines) {
        const returnItem = returnRequestItems.find(item => item.id === line.id);
        
        if (!returnItem) {
          return ResponseHandler.error(res, `Return item with ID ${line.id} not found`, 404);
        }

        // Validate quantities
        if (line.received_qty > returnItem.quantity) {
          return ResponseHandler.error(res, `Received quantity cannot exceed original quantity for item ${line.id}`, 400);
        }

        // Add GRN timeline event
        const timelineEvents = returnItem.timeline_events || [];
        timelineEvents.push({
          event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.GRN_CREATED,
          status: returnItem.status,
          notes: `GRN created for return item`,
          metadata: { 
            grn_id: `RET-${returnOrderId}`,
            received_qty: line.received_qty,
            expected_qty: returnItem.quantity,
            grn_notes
          },
          created_at: Date.now(),
          created_by: 1
        });

        // Update the return request item
        await returnItem.update({
          grn_id: `RET-${returnOrderId}`,
          grn_status: 'completed',
          received_quantity: line.received_qty,
          expected_quantity: returnItem.quantity,
          timeline_events: timelineEvents,
          last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.GRN_CREATED,
          last_event_notes: `GRN created for return item`,
          last_event_metadata: { 
            grn_id: `RET-${returnOrderId}`,
            received_qty: line.received_qty
          },
          updated_at: Date.now()
        });
      }

      return ResponseHandler.success(res, {
        message: 'Return GRN created successfully',
        grn_id: `RET-${returnOrderId}`,
        return_order_id: returnOrderId,
        processed_items: lines.length,
        grn_notes
      });

    } catch (error) {
      console.error('Create return GRN error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  // ==================== RETURN PUTAWAY APIs ====================

  /**
   * Get list of return items with completed GRN ready for putaway
   */
  static async getReturnItemsForPutaway(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Find return request items with completed GRN that are ready for putaway
      const { count, rows } = await ReturnRequestItem.findAndCountAll({
        where: { 
          grn_status: 'completed',
          putaway_status: { [require('sequelize').Op.or]: [null, 'pending'] },
          received_quantity: { [require('sequelize').Op.gt]: 0 }
        },
        include: [
          { model: Order, as: 'originalOrder', attributes: ['id', 'order_id', 'user_id'] },
          { model: Product, as: 'product', attributes: ['SKU', 'ProductName', 'Category', 'Brand'] }
        ],
        order: [['updated_at', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      // Group by return_order_id to get unique return orders
      const returnOrdersMap = new Map();
      
      rows.forEach((item: any) => {
        const returnOrderId = item.return_order_id;
        
        if (!returnOrdersMap.has(returnOrderId)) {
          returnOrdersMap.set(returnOrderId, {
            return_order_id: returnOrderId,
            original_order_id: item.original_order_id,
            customer_id: item.customer_id,
            return_type: item.return_type,
            total_items: 0,
            total_putaway_qty: 0,
            grn_completed_date: item.updated_at,
            items: []
          });
        }
        
        const returnOrder = returnOrdersMap.get(returnOrderId);
        returnOrder.total_items += 1;
        returnOrder.total_putaway_qty += item.received_quantity || 0;
        returnOrder.items.push({
          id: item.id,
          item_id: item.item_id,
          quantity: item.received_quantity || 0,
          price: item.price,
          item_details: item.item_details,
          variation: item.variation,
          is_try_and_buy: item.is_try_and_buy,
          qc_status: item.qc_status,
          product: (item as any).product
        });
      });

      const returnOrders = Array.from(returnOrdersMap.values());

      return ResponseHandler.success(res, {
        returnOrders,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Get return items for putaway error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Scan SKU for return putaway (similar to /api/putaway/scan-sku-product-detail)
   */
  static async scanReturnSkuForPutaway(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { sku_id, return_item_id } = req.body;

      if (!sku_id || !return_item_id) {
        return ResponseHandler.error(res, 'SKU ID and return item ID are required', 400);
      }

      // Find the return request item
      const returnRequestItem = await ReturnRequestItem.findByPk(return_item_id, {
        include: [
          { model: Order, as: 'originalOrder', attributes: ['id', 'order_id', 'user_id'] },
          { model: Product, as: 'product', attributes: ['SKU', 'ProductName', 'Category', 'Brand', 'MRP', 'COST'] }
        ]
      });

      if (!returnRequestItem) {
        return ResponseHandler.error(res, 'Return request item not found', 404);
      }

      // Verify SKU matches
      if (returnRequestItem.item_id.toString() !== sku_id.toString()) {
        return ResponseHandler.error(res, 'SKU does not match the return item', 400);
      }

      // Check if GRN is completed
      if (returnRequestItem.grn_status !== 'completed') {
        return ResponseHandler.error(res, 'GRN must be completed before putaway', 400);
      }

      // Check available quantity for putaway
      const availableQuantity = returnRequestItem.received_quantity || 0;
      if (availableQuantity <= 0) {
        return ResponseHandler.error(res, 'No quantity available for putaway', 400);
      }

      // Determine suggested bin based on return type and QC status
      let suggestedBin: any = null;
      let binError: string | null = null;

      try {
        // Use the same bin routing logic as existing putaway
        if (returnRequestItem.is_try_and_buy) {
          suggestedBin = {
            binCode: `${RETURN_BIN_ROUTING.TRY_AND_BUY.BIN_PREFIX}-001`,
            zone: 'RETURN',
            aisle: 'TRY-BUY',
            rack: 'A',
            shelf: '1',
            capacity: 100,
            currentQuantity: 0,
            availableCapacity: 100,
            utilizationPercentage: 0,
            status: 'active',
            binName: 'Try and Buy Returns',
            binType: 'return',
            zoneName: 'Return Zone',
            preferredProductCategory: 'try_and_buy',
            hasCapacity: true,
            matchType: 'return_routing'
          };
        } else if (returnRequestItem.qc_status === 'failed') {
          suggestedBin = {
            binCode: `${RETURN_BIN_ROUTING.DEFECTIVE.BIN_PREFIX}-001`,
            zone: 'RETURN',
            aisle: 'DEFECTIVE',
            rack: 'A',
            shelf: '1',
            capacity: 100,
            currentQuantity: 0,
            availableCapacity: 100,
            utilizationPercentage: 0,
            status: 'active',
            binName: 'Defective Returns',
            binType: 'return',
            zoneName: 'Return Zone',
            preferredProductCategory: 'defective',
            hasCapacity: true,
            matchType: 'return_routing'
          };
        } else if (returnRequestItem.qc_status === 'needs_repair') {
          suggestedBin = {
            binCode: `${RETURN_BIN_ROUTING.QUALITY_ISSUE.BIN_PREFIX}-001`,
            zone: 'RETURN',
            aisle: 'QUALITY',
            rack: 'A',
            shelf: '1',
            capacity: 100,
            currentQuantity: 0,
            availableCapacity: 100,
            utilizationPercentage: 0,
            status: 'active',
            binName: 'Quality Issue Returns',
            binType: 'return',
            zoneName: 'Return Zone',
            preferredProductCategory: 'quality_issue',
            hasCapacity: true,
            matchType: 'return_routing'
          };
        } else {
          suggestedBin = {
            binCode: `${RETURN_BIN_ROUTING.OTHER.BIN_PREFIX}-001`,
            zone: 'RETURN',
            aisle: 'GENERAL',
            rack: 'A',
            shelf: '1',
            capacity: 100,
            currentQuantity: 0,
            availableCapacity: 100,
            utilizationPercentage: 0,
            status: 'active',
            binName: 'General Returns',
            binType: 'return',
            zoneName: 'Return Zone',
            preferredProductCategory: 'general',
            hasCapacity: true,
            matchType: 'return_routing'
          };
        }
      } catch (error) {
        binError = `Error determining bin location: ${error}`;
      }

      if (binError) {
        return ResponseHandler.error(res, binError, 400);
      }

      return ResponseHandler.success(res, {
        message: 'Return SKU scanned successfully',
        skuId: sku_id,
        returnItemId: return_item_id,
        returnOrderId: returnRequestItem.return_order_id,
        availableQuantity: availableQuantity,
        scannedProductDetail: {
          id: (returnRequestItem as any).product?.SKU || sku_id,
          sku: (returnRequestItem as any).product?.SKU || sku_id,
          productName: (returnRequestItem as any).product?.ProductName || 'Unknown Product',
          category: (returnRequestItem as any).product?.Category || 'Unknown',
          brand: (returnRequestItem as any).product?.Brand || 'Unknown',
          mrp: (returnRequestItem as any).product?.MRP || 0,
          cost: (returnRequestItem as any).product?.COST || 0
        },
        returnDetails: {
          returnType: returnRequestItem.return_type,
          isTryAndBuy: returnRequestItem.is_try_and_buy,
          qcStatus: returnRequestItem.qc_status,
          itemDetails: returnRequestItem.item_details,
          variation: returnRequestItem.variation
        },
        binSuggested: suggestedBin
      });

    } catch (error) {
      console.error('Scan return SKU for putaway error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Confirm return putaway (similar to /api/putaway/confirm)
   */
  static async confirmReturnPutaway(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { sku_id, return_item_id, quantity, bin_location, remarks } = req.body;

      if (!sku_id || !return_item_id || !quantity || !bin_location) {
        return ResponseHandler.error(res, 'SKU ID, return item ID, quantity, and bin location are required', 400);
      }

      // Find the return request item
      const returnRequestItem = await ReturnRequestItem.findByPk(return_item_id);

      if (!returnRequestItem) {
        return ResponseHandler.error(res, 'Return request item not found', 404);
      }

      // Verify SKU matches
      if (returnRequestItem.item_id.toString() !== sku_id.toString()) {
        return ResponseHandler.error(res, 'SKU does not match the return item', 400);
      }

      // Check if GRN is completed
      if (returnRequestItem.grn_status !== 'completed') {
        return ResponseHandler.error(res, 'GRN must be completed before putaway', 400);
      }

      // Check available quantity
      const availableQuantity = returnRequestItem.qc_pass_qty || 0;
      if (quantity > availableQuantity) {
        return ResponseHandler.error(res, 'Quantity exceeds available QC passed quantity', 400);
      }

      // Validate bin location
      const binLocation = await BinLocation.findOne({
        where: { bin_code: bin_location },
      });

      if (!binLocation) {
        return ResponseHandler.error(res, 'Invalid bin location', 400);
      }

      if (binLocation.status !== 'active') {
        // Activate the bin if it's inactive
        await binLocation.update({ status: 'active' });
      }

      // Check bin capacity
      if (binLocation.current_quantity + quantity > binLocation.capacity) {
        return ResponseHandler.error(res, 'Bin capacity exceeded', 400);
      }

      // Calculate new remaining quantity
      const newRemainingQty = availableQuantity - quantity;
      
      // Determine status based on remaining quantity
      let putawayStatus: string;
      if (newRemainingQty <= 0) {
        putawayStatus = 'completed';
      } else {
        putawayStatus = 'partial';
      }

      // Start transaction for data consistency
      const transaction = await sequelize.transaction();

      try {
        // Add Putaway timeline event
        const timelineEvents = returnRequestItem.timeline_events || [];
        timelineEvents.push({
          event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.PUTAWAY_COMPLETED,
          status: returnRequestItem.status,
          notes: `Return putaway completed to bin: ${bin_location}`,
          metadata: { 
            bin_location_id: bin_location,
            putaway_quantity: quantity,
            putaway_notes: remarks,
            remaining_quantity: newRemainingQty,
            is_try_and_buy: returnRequestItem.is_try_and_buy,
            qc_status: returnRequestItem.qc_status
          },
          created_at: Date.now(),
          created_by: 1
        });

        // Update the return request item
        await returnRequestItem.update({
          qc_pass_qty: newRemainingQty,
          putaway_status: putawayStatus,
          bin_location_id: bin_location,
          putaway_by: 1,
          putaway_at: Date.now(),
          putaway_notes: remarks,
          timeline_events: timelineEvents,
          last_event_type: RETURN_CONSTANTS.TIMELINE_EVENTS.PUTAWAY_COMPLETED,
          last_event_notes: `Return putaway completed to bin: ${bin_location}`,
          last_event_metadata: { 
            bin_location_id: bin_location,
            putaway_quantity: quantity,
            remaining_quantity: newRemainingQty
          },
          updated_at: Date.now()
        }, { transaction });

        // Update bin location current quantity
        await binLocation.update(
          { current_quantity: binLocation.current_quantity + quantity },
          { transaction }
        );

        // Update or create ScannerBin entry
        let scannerBin = await ScannerBin.findOne({
          where: { binLocationScanId: bin_location },
          transaction
        });

        if (scannerBin) {
          // Update existing scanner bin - add SKU if not already present
          const existingSkus = Array.isArray(scannerBin.sku) ? scannerBin.sku : [];
          if (!existingSkus.includes(sku_id)) {
            existingSkus.push(sku_id);
            await scannerBin.update({ sku: existingSkus }, { transaction });
          }
        } else {
          // Create new scanner bin entry
          await ScannerBin.create({
            binLocationScanId: bin_location,
            sku: [sku_id]
          }, { transaction });
        }

        // Update or create ScannerSku entry
        // Use the actual SKU as the skuScanId instead of complex format
        const skuScanId = sku_id;
        await ScannerSku.create({
          skuScanId: skuScanId,
          sku: [{ skuId: sku_id, quantity: quantity }],
          binLocationScanId: bin_location
        }, { transaction });

        // Commit transaction
        await transaction.commit();

        return ResponseHandler.success(res, {
          message: 'Return putaway confirmed successfully',
          sku_id,
          return_item_id,
          return_order_id: returnRequestItem.return_order_id,
          quantity,
          bin_location,
          remarks,
          status: putawayStatus,
          updated_return_item: {
            qc_pass_qty: newRemainingQty,
            remaining_qty: newRemainingQty,
            putaway_status: putawayStatus,
            bin_location_id: bin_location
          },
          updated_bin_location: {
            bin_code: bin_location,
            current_quantity: binLocation.current_quantity + quantity,
            capacity: binLocation.capacity
          },
          scanner_updates: {
            scanner_bin_updated: true,
            scanner_sku_created: true,
            bin_location_scan_id: bin_location,
            sku_scan_id: sku_id
          }
        });

      } catch (transactionError) {
        // Rollback transaction on error
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Confirm return putaway error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}

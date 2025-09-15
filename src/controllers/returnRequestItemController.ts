import { Request, Response } from 'express';
import ReturnRequestItem from '../models/ReturnRequestItem';
import Order from '../models/Order';
import OrderDetail from '../models/OrderDetail';
import User from '../models/User';
import Product from '../models/productModel';
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
      const returnOrderId = `${returnData.original_order_id}${RETURN_CONSTANTS.RETURN_ORDER_ID.SUFFIX}-${timestamp}`;
      
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
}

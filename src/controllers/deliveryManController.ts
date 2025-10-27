// deliveryManController.ts - Controller for delivery man operations
import { Request, Response } from 'express';
import DeliveryMan from '../models/DeliveryMan';
import Order from '../models/Order';
import { ResponseHandler } from '../middleware/responseHandler';
import { DELIVERY_MAN_CONSTANTS } from '../config/deliveryManConstants';
import sequelize from '../config/database';

interface AssignDeliveryManRequest {
  f_name?: string;
  l_name?: string;
  phone: string;
  email?: string;
  identity_number?: string;
  identity_type?: string;
  identity_image?: string;
  image?: string;
  password: string;
  auth_token?: string;
  fcm_token?: string;
  zone_id?: number;
  status?: number;
  active?: number;
  earning?: number;
  current_orders?: number;
  type?: string;
  store_id?: number;
  application_status?: 'approved' | 'denied' | 'pending';
  order_count?: number;
  assigned_order_count?: number;
  vehicle_id?: number;
  orderId: number;
}

export class DeliveryManController {
  /**
   * Validates the phone number format
   */
  private static validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const { PHONE_MIN_LENGTH, PHONE_MAX_LENGTH } = DELIVERY_MAN_CONSTANTS.VALIDATION;
    
    return cleanPhone.length >= PHONE_MIN_LENGTH && 
           cleanPhone.length <= PHONE_MAX_LENGTH;
  }

  /**
   * Validates required fields in the request
   */
  private static validateRequiredFields(body: any): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    const { REQUIRED_FIELDS } = DELIVERY_MAN_CONSTANTS.VALIDATION;
    
    REQUIRED_FIELDS.forEach(field => {
      if (!body[field]) {
        missingFields.push(field);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Assigns a delivery man to an order
   * - If phone exists: assigns existing delivery man to order
   * - If phone doesn't exist: creates new delivery man and assigns to order
   */
  static async assignDeliveryMan(req: Request, res: Response): Promise<Response> {
    const transaction = await sequelize.transaction();
    
    try {
      const requestBody = req.body as AssignDeliveryManRequest;
      const { RESPONSE_MESSAGES, STATUS_CODES, DEFAULT_VALUES } = DELIVERY_MAN_CONSTANTS;

      // Validate required fields
      const validation = DeliveryManController.validateRequiredFields(requestBody);
      if (!validation.isValid) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `${RESPONSE_MESSAGES.ERROR_MISSING_FIELDS}: ${validation.missingFields.join(', ')}`,
          STATUS_CODES.BAD_REQUEST
        );
      }

      // Validate phone number
      if (!DeliveryManController.validatePhone(requestBody.phone)) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          RESPONSE_MESSAGES.ERROR_INVALID_PHONE,
          STATUS_CODES.BAD_REQUEST
        );
      }

      // Check if order exists
      const order = await Order.findByPk(requestBody.orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          RESPONSE_MESSAGES.ERROR_ORDER_NOT_FOUND,
          STATUS_CODES.NOT_FOUND
        );
      }

      // Check if delivery man exists with the given phone number
      let deliveryMan = await DeliveryMan.findOne({
        where: { phone: requestBody.phone },
        transaction,
      });

      let isNewDeliveryMan = false;

      if (!deliveryMan) {
        // Create new delivery man
        isNewDeliveryMan = true;
        
        const deliveryManData = {
          f_name: requestBody.f_name || null,
          l_name: requestBody.l_name || null,
          phone: requestBody.phone,
          email: requestBody.email || null,
          identity_number: requestBody.identity_number || null,
          identity_type: requestBody.identity_type || null,
          identity_image: requestBody.identity_image || null,
          image: requestBody.image || null,
          password: requestBody.password,
          auth_token: requestBody.auth_token || null,
          fcm_token: requestBody.fcm_token || null,
          zone_id: requestBody.zone_id || null,
          status: requestBody.status !== undefined ? Boolean(requestBody.status) : DEFAULT_VALUES.STATUS,
          active: requestBody.active !== undefined ? Boolean(requestBody.active) : DEFAULT_VALUES.ACTIVE,
          earning: requestBody.earning !== undefined ? Boolean(requestBody.earning) : DEFAULT_VALUES.EARNING,
          current_orders: requestBody.current_orders || DEFAULT_VALUES.CURRENT_ORDERS,
          type: requestBody.type || DEFAULT_VALUES.TYPE,
          store_id: requestBody.store_id || null,
          application_status: requestBody.application_status || DEFAULT_VALUES.APPLICATION_STATUS,
          order_count: requestBody.order_count || DEFAULT_VALUES.ORDER_COUNT,
          assigned_order_count: requestBody.assigned_order_count || DEFAULT_VALUES.ASSIGNED_ORDER_COUNT,
          vehicle_id: requestBody.vehicle_id || null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        deliveryMan = await DeliveryMan.create(deliveryManData, { transaction });
      }

      // Update order with delivery_man_id
      await order.update(
        { delivery_man_id: deliveryMan.id },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      // Prepare response
      const responseMessage = isNewDeliveryMan
        ? RESPONSE_MESSAGES.SUCCESS_CREATED_AND_ASSIGNED
        : RESPONSE_MESSAGES.SUCCESS_ASSIGNED;

      return ResponseHandler.success(
        res,
        {
          message: responseMessage,
          deliveryMan: {
            id: deliveryMan.id,
            f_name: deliveryMan.f_name,
            l_name: deliveryMan.l_name,
            phone: deliveryMan.phone,
            email: deliveryMan.email,
            zone_id: deliveryMan.zone_id,
            type: deliveryMan.type,
            application_status: deliveryMan.application_status,
          },
          order: {
            id: order.id,
            order_id: order.id,
            delivery_man_id: order.delivery_man_id,
            order_status: order.order_status,
          },
          isNewDeliveryMan,
        },
        isNewDeliveryMan ? STATUS_CODES.CREATED : STATUS_CODES.SUCCESS
      );
    } catch (error) {
      await transaction.rollback();
      console.error('Error in assignDeliveryMan:', error);
      
      return ResponseHandler.error(
        res,
        `${DELIVERY_MAN_CONSTANTS.RESPONSE_MESSAGES.ERROR_DATABASE}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        DELIVERY_MAN_CONSTANTS.STATUS_CODES.INTERNAL_ERROR
      );
    }
  }

  /**
   * Get delivery man by phone number
   */
  static async getDeliveryManByPhone(req: Request, res: Response): Promise<Response> {
    try {
      const { phone } = req.params;
      const { RESPONSE_MESSAGES, STATUS_CODES } = DELIVERY_MAN_CONSTANTS;

      if (!phone) {
        return ResponseHandler.error(
          res,
          RESPONSE_MESSAGES.ERROR_MISSING_FIELDS,
          STATUS_CODES.BAD_REQUEST
        );
      }

      const deliveryMan = await DeliveryMan.findOne({
        where: { phone },
      });

      if (!deliveryMan) {
        return ResponseHandler.error(
          res,
          RESPONSE_MESSAGES.ERROR_DELIVERY_MAN_NOT_FOUND,
          STATUS_CODES.NOT_FOUND
        );
      }

      return ResponseHandler.success(
        res,
        {
          deliveryMan: {
            id: deliveryMan.id,
            f_name: deliveryMan.f_name,
            l_name: deliveryMan.l_name,
            phone: deliveryMan.phone,
            email: deliveryMan.email,
            zone_id: deliveryMan.zone_id,
            status: deliveryMan.status,
            active: deliveryMan.active,
            type: deliveryMan.type,
            application_status: deliveryMan.application_status,
            order_count: deliveryMan.order_count,
            assigned_order_count: deliveryMan.assigned_order_count,
          },
        },
        STATUS_CODES.SUCCESS
      );
    } catch (error) {
      console.error('Error in getDeliveryManByPhone:', error);
      
      return ResponseHandler.error(
        res,
        `${DELIVERY_MAN_CONSTANTS.RESPONSE_MESSAGES.ERROR_DATABASE}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        DELIVERY_MAN_CONSTANTS.STATUS_CODES.INTERNAL_ERROR
      );
    }
  }

  /**
   * Get delivery man by ID
   */
  static async getDeliveryManById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { RESPONSE_MESSAGES, STATUS_CODES } = DELIVERY_MAN_CONSTANTS;

      if (!id) {
        return ResponseHandler.error(
          res,
          RESPONSE_MESSAGES.ERROR_MISSING_FIELDS,
          STATUS_CODES.BAD_REQUEST
        );
      }

      const deliveryMan = await DeliveryMan.findByPk(id);

      if (!deliveryMan) {
        return ResponseHandler.error(
          res,
          RESPONSE_MESSAGES.ERROR_DELIVERY_MAN_NOT_FOUND,
          STATUS_CODES.NOT_FOUND
        );
      }

      return ResponseHandler.success(
        res,
        {
          deliveryMan: {
            id: deliveryMan.id,
            f_name: deliveryMan.f_name,
            l_name: deliveryMan.l_name,
            phone: deliveryMan.phone,
            email: deliveryMan.email,
            zone_id: deliveryMan.zone_id,
            status: deliveryMan.status,
            active: deliveryMan.active,
            type: deliveryMan.type,
            application_status: deliveryMan.application_status,
            order_count: deliveryMan.order_count,
            assigned_order_count: deliveryMan.assigned_order_count,
            vehicle_id: deliveryMan.vehicle_id,
          },
        },
        STATUS_CODES.SUCCESS
      );
    } catch (error) {
      console.error('Error in getDeliveryManById:', error);
      
      return ResponseHandler.error(
        res,
        `${DELIVERY_MAN_CONSTANTS.RESPONSE_MESSAGES.ERROR_DATABASE}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        DELIVERY_MAN_CONSTANTS.STATUS_CODES.INTERNAL_ERROR
      );
    }
  }
}


// routes/deliveryManRoutes.ts - Routes for delivery man operations
import { Router } from 'express';
import { DeliveryManController } from '../controllers/deliveryManController';

const router = Router();

/**
 * POST /api/delivery-man/assign
 * Assigns a delivery man to an order
 * - If phone exists: assigns existing delivery man to order
 * - If phone doesn't exist: creates new delivery man and assigns to order
 */
router.post('/assign', DeliveryManController.assignDeliveryMan);

/**
 * GET /api/delivery-man/phone/:phone
 * Get delivery man details by phone number
 */
router.get('/phone/:phone', DeliveryManController.getDeliveryManByPhone);

/**
 * GET /api/delivery-man/:id
 * Get delivery man details by ID
 */
router.get('/:id', DeliveryManController.getDeliveryManById);

export default router;


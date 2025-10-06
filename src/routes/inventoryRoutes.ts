import express from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticate } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';

const router = express.Router();

// Apply authentication and FC filtering to all inventory routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createInventoryFilter());

/**
 * @route POST /api/inventory/update
 * @desc Update inventory for a specific SKU
 * @access Authenticated users
 */
router.post('/update', InventoryController.updateInventory);

/**
 * @route GET /api/inventory/:sku/summary
 * @desc Get inventory summary for a SKU
 * @access Authenticated users
 */
router.get('/:sku/summary', InventoryController.getInventorySummary);

/**
 * @route GET /api/inventory/:sku/logs
 * @desc Get inventory logs for a SKU
 * @access Authenticated users
 */
router.get('/:sku/logs', InventoryController.getInventoryLogs);

/**
 * @route GET /api/inventory/:sku/availability
 * @desc Check inventory availability for a SKU
 * @access Authenticated users
 */
router.get('/:sku/availability', InventoryController.checkAvailability);

export default router;

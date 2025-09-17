import express from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

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

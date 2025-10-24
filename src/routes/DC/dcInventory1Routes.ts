import { Router } from 'express';
import { DCInventory1Controller } from '../../controllers/DC/dcInventory1Controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/dc/inventory-1
 * @desc Get all DC Inventory 1 records
 * @access Private
 */
router.get('/', DCInventory1Controller.getAll);

/**
 * @route GET /api/dc/inventory-1/summary
 * @desc Get DC Inventory 1 summary statistics
 * @access Private
 */
router.get('/summary', DCInventory1Controller.getSummary);

/**
 * @route GET /api/dc/inventory-1/sku/:skuId/dc/:dcId
 * @desc Get DC Inventory 1 record by SKU ID and DC ID
 * @access Private
 */
router.get('/sku/:skuId/dc/:dcId', DCInventory1Controller.getBySkuIdAndDcId);

/**
 * @route GET /api/dc/inventory-1/dc/:dcId
 * @desc Get DC Inventory 1 records by DC ID
 * @access Private
 */
router.get('/dc/:dcId', DCInventory1Controller.getByDcId);

export default router;

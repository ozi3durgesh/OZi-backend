import { Router } from 'express';
import { FCSKUController } from '../controllers/FC/fcSKUController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/fc/skus/grn-status
 * @desc Get all approved FC-POs ready for GRN with complete details
 * @access Private (FC users)
 */
router.get('/grn-status', FCSKUController.getSKUsWithGRNStatus);

/**
 * @route GET /api/fc/skus/grn-completed
 * @desc Get all SKUs that have been GRN done (available for FC-PO)
 * @access Private (FC users)
 */
router.get('/grn-completed', FCSKUController.getGRNCompletedSKUs);

/**
 * @route GET /api/fc/skus/All
 * @desc Get all products from ProductMaster with pagination
 * @access Private (FC users)
 */
router.get('/All', FCSKUController.getAllProducts);

/**
 * @route GET /api/fc/skus/:catalogueId
 * @desc Get SKU details by catalogue ID for FC-PO
 * @access Private (FC users)
 */
router.get('/:catalogueId', FCSKUController.getSKUByCatalogueId);

export default router;

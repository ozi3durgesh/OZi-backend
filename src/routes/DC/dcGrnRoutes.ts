import { Router } from 'express';
import { DCGrnController } from '../../controllers/DC/dcGrnController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/dc/grn/dc-po/:dcPoId/products
 * @desc Get DC PO products for GRN creation
 * @access Authenticated
 */
router.get('/dc-po/:dcPoId/products', DCGrnController.getDCPOProductsForGRN);

/**
 * @route POST /api/dc/grn
 * @desc Create a new DC-GRN
 * @access Authenticated
 */
router.post('/', DCGrnController.createDCGrn);

/**
 * @route GET /api/dc/grn/actual
 * @desc Get actual DC GRN records (not POs)
 * @access Authenticated
 */
router.get('/actual', DCGrnController.getActualDCGrnList);

/**
 * @route GET /api/dc/grn/list
 * @desc Get DC GRN list with SKU splits grouped by PO
 * @access Authenticated
 */
router.get('/list', DCGrnController.getDCGrnList);

/**
 * @route GET /api/dc/grn/:id
 * @desc Get DC-GRN by ID with full details
 * @access Authenticated
 */
router.get('/:id', DCGrnController.getDCGrnById);

/**
 * @route GET /api/dc/grn/dc-po/:dcPoId
 * @desc Get DC-GRNs by DC PO ID
 * @access Authenticated
 */
router.get('/dc-po/:dcPoId', DCGrnController.getDCGrnsByDCPOId);

/**
 * @route PUT /api/dc/grn/:id/status
 * @desc Update DC-GRN status
 * @access Authenticated
 */
router.put('/:id/status', DCGrnController.updateDCGrnStatus);

/**
 * @route GET /api/dc/grn/products/ready-for-master
 * @desc Get products ready for product-master insertion
 * @access Authenticated
 */
router.get('/products/ready-for-master', DCGrnController.getProductsReadyForProductMaster);

/**
 * @route GET /api/dc/grn/stats
 * @desc Get DC-GRN statistics
 * @access Authenticated
 */
router.get('/stats', DCGrnController.getDCGrnStats);

export default router;

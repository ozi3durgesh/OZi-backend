import { Router } from 'express';
import { DCGrnController } from '../../controllers/DC/dcGrnController';
import { authenticate, hasPermission } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/dc/grn/dc-po/:dcPoId/products
 * @desc Get DC PO products for GRN creation
 * @access Authenticated
 */
router.get('/dc-po/:dcPoId/products', hasPermission('dc_grns-view'), DCGrnController.getDCPOProductsForGRN);

router.post('/', hasPermission('dc_grns-create'), DCGrnController.createDCGrn);

router.get('/actual', hasPermission('dc_grns-view'), DCGrnController.getActualDCGrnList);

router.get('/list', hasPermission('dc_grns-view'), DCGrnController.getDCGrnList);

router.get('/:id', hasPermission('dc_grns-view'), DCGrnController.getDCGrnById);

router.get('/dc-po/:dcPoId', hasPermission('dc_grns-view'), DCGrnController.getDCGrnsByDCPOId);

router.put('/:id/status', hasPermission('dc_grns-create'), DCGrnController.updateDCGrnStatus);

router.get('/products/ready-for-master', hasPermission('dc_grns-view'), DCGrnController.getProductsReadyForProductMaster);

router.get('/stats', hasPermission('dc_grns-view'), DCGrnController.getDCGrnStats);

export default router;

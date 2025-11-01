import { Router } from 'express';
import { authenticate, hasPermission } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';
import { FCPutawayController } from '../controllers/fcPutawayController';

const router = Router();

// Apply authentication and FC filtering middleware to all putaway routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createPutawayFilter());

router.get('/grn-list', hasPermission('fc_putaway-view'), FCPutawayController.getGrnPutawayList);
router.get('/return-list', hasPermission('fc_putaway-view'), FCPutawayController.getReturnPutawayList);
router.get('/grn/:id', hasPermission('fc_putaway-view'), FCPutawayController.getGrnDetailsById);
router.post('/scan-sku', hasPermission('fc_putaway-create'), FCPutawayController.scanSku);
router.post('/scan-sku-product-detail', hasPermission('fc_putaway-create'), FCPutawayController.scanSkuProductDetail);
router.get('/product-details', hasPermission('fc_putaway-view'), FCPutawayController.getScannedProductDetails);
router.post('/confirm', hasPermission('fc_putaway-create'), FCPutawayController.confirmPutaway);
router.get('/debug', hasPermission('fc_putaway-view'), FCPutawayController.debugDatabase);

export default router;

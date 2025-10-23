import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';
import { FCPutawayController } from '../controllers/fcPutawayController';

const router = Router();

// Apply authentication and FC filtering middleware to all putaway routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createPutawayFilter());

// 1. GRN Putaway List (GET with pagination)
router.get('/grn-list', FCPutawayController.getGrnPutawayList);

// 2. Return Putaway List (GET with pagination)
router.get('/return-list', FCPutawayController.getReturnPutawayList);

// 3. Get GRN Details by ID (GET)
router.get('/grn/:id', FCPutawayController.getGrnDetailsById);

// 4. Scan SKU API (POST)
router.post('/scan-sku', FCPutawayController.scanSku);

// 5. Scan SKU Product Detail API (POST)
router.post('/scan-sku-product-detail', FCPutawayController.scanSkuProductDetail);

// 6. Get Scanned Product Details (GET)
router.get('/product-details', FCPutawayController.getScannedProductDetails);

// 7. Confirm Putaway (POST/PUT)
router.post('/confirm', FCPutawayController.confirmPutaway);

// Debug endpoint
router.get('/debug', FCPutawayController.debugDatabase);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PutawayController } from '../controllers/putawayController';

const router = Router();

// Apply authentication middleware to all putaway routes
router.use(authenticate);

// 1. GRN Putaway List (GET with pagination)
router.get('/grn-list', PutawayController.getGrnPutawayList);

// 2. Return Putaway List (GET with pagination)
router.get('/return-list', PutawayController.getReturnPutawayList);

// 3. Get GRN Details by ID (GET)
router.get('/grn/:id', PutawayController.getGrnDetailsById);

// 4. Scan SKU API (POST)
router.post('/scan-sku', PutawayController.scanSku);

// 5. Get Scanned Product Details (GET)
router.get('/product-details', PutawayController.getScannedProductDetails);

// 6. Confirm Putaway (POST/PUT)
router.post('/confirm', PutawayController.confirmPutaway);

// 7. Get Bin Suggestions (GET)
router.get('/bin-suggestions', PutawayController.getBinSuggestions);

// 8. Get Putaway Tasks by User (GET with pagination)
router.get('/tasks', PutawayController.getPutawayTasksByUser);

// Debug endpoint
router.get('/debug', PutawayController.debugDatabase);

export default router;

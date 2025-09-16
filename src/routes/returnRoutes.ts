// routes/returnRoutes.ts
import { Router } from 'express';
import { ReturnRequestItemController } from '../controllers/returnRequestItemController';

const router = Router();

// Consolidated return request item management routes
router.post('/requests', ReturnRequestItemController.createReturnRequestItem);
router.get('/requests/:returnOrderId', ReturnRequestItemController.getReturnRequestItems);
router.put('/item/:id/status', ReturnRequestItemController.updateReturnRequestItemStatus);

// Pidge webhook for return status updates
router.post('/webhook/pidge', ReturnRequestItemController.handlePidgeWebhook);

// Simulate Pidge webhook for testing
router.post('/simulate/pidge-webhook/:returnOrderId', ReturnRequestItemController.simulatePidgeWebhook);

// QC, GRN, and Putaway processing
router.post('/item/:id/qc', ReturnRequestItemController.processQC);
router.post('/item/:id/grn', ReturnRequestItemController.processGRN);
router.post('/item/:id/putaway', ReturnRequestItemController.processPutaway);

// Timeline tracking
router.get('/item/:id/timeline', ReturnRequestItemController.getReturnRequestItemTimeline);

// ==================== RETURN GRN APIs ====================
// 1. Get list of return orders ready for GRN with complete details
router.get('/grn/ready', ReturnRequestItemController.getReturnOrdersForGRN);

// 2. Create GRN for return items with simultaneous status updates (handles both regular and reject GRN)
router.post('/grn/:returnOrderId/create', ReturnRequestItemController.createReturnGRN);

// ==================== RETURN REJECT GRN APIs ====================
// 3. Get list of rejected return items for review
router.get('/reject-grn/items', ReturnRequestItemController.getRejectedReturnItems);

// 4. Get rejected return item details by ID
router.get('/reject-grn/items/:id', ReturnRequestItemController.getRejectedReturnItemById);

// ==================== RETURN PUTAWAY APIs ====================
// 5. Get list of return items with completed GRN ready for putaway
router.get('/putaway/ready', ReturnRequestItemController.getReturnItemsForPutaway);

// 6. Scan SKU for return putaway (similar to /api/putaway/scan-sku-product-detail)
router.post('/putaway/scan-sku', ReturnRequestItemController.scanReturnSkuForPutaway);

// 7. Confirm return putaway (similar to /api/putaway/confirm)
router.post('/putaway/confirm', ReturnRequestItemController.confirmReturnPutaway);

// 8. Update scanner_sku quantity (dedicated endpoint)
router.post('/putaway/update-sku-quantity', ReturnRequestItemController.updateScannerSkuQuantity);

export default router;

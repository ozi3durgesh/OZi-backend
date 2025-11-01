// routes/returnRoutes.ts
import { Router } from 'express';
import { ReturnRequestItemController } from '../controllers/returnRequestItemController';
import { authenticate, hasPermission } from '../middleware/auth';

const router = Router();

// Apply authentication to all return routes
router.use(authenticate);

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
router.get('/grn/ready', hasPermission('return_grn-view'), ReturnRequestItemController.getReturnOrdersForGRN);
router.post('/grn/:returnOrderId/create', hasPermission('return_grn-create'), ReturnRequestItemController.createReturnGRN);

// ==================== RETURN REJECT GRN APIs ====================
router.get('/reject-grn/items', hasPermission('return_grn-view'), ReturnRequestItemController.getRejectedReturnItems);
router.get('/reject-grn/items/:id', hasPermission('return_grn-view'), ReturnRequestItemController.getRejectedReturnItemById);

// ==================== RETURN PUTAWAY APIs ====================
router.get('/putaway/ready', hasPermission('return_putaway-view'), ReturnRequestItemController.getReturnItemsForPutaway);
router.post('/putaway/scan-sku', hasPermission('return_putaway-create'), ReturnRequestItemController.scanReturnSkuForPutaway);
router.post('/putaway/confirm', hasPermission('return_putaway-create'), ReturnRequestItemController.confirmReturnPutaway);
router.post('/putaway/update-sku-quantity', hasPermission('return_putaway-create'), ReturnRequestItemController.updateScannerSkuQuantity);

export default router;

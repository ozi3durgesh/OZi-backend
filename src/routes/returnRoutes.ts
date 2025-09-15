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

// QC, GRN, and Putaway processing
router.post('/item/:id/qc', ReturnRequestItemController.processQC);
router.post('/item/:id/grn', ReturnRequestItemController.processGRN);
router.post('/item/:id/putaway', ReturnRequestItemController.processPutaway);

// Timeline tracking
router.get('/item/:id/timeline', ReturnRequestItemController.getReturnRequestItemTimeline);

export default router;

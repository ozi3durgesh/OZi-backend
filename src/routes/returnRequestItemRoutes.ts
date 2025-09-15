// routes/returnRequestItemRoutes.ts
import { Router } from 'express';
import { ReturnRequestItemController } from '../controllers/returnRequestItemController';

const router = Router();

// All return request item routes

// Create return request item (consolidated)
router.post('/request', 
  ReturnRequestItemController.createReturnRequestItem
);

// Get return request items by return order ID
router.get('/request/:returnOrderId', 
  ReturnRequestItemController.getReturnRequestItems
);

// Update return request item status
router.put('/item/:id/status', 
  ReturnRequestItemController.updateReturnRequestItemStatus
);

// Handle Pidge webhook for return status updates
router.post('/webhook/pidge', 
  ReturnRequestItemController.handlePidgeWebhook
);

// Process QC for return request item
router.post('/item/:id/qc', 
  ReturnRequestItemController.processQC
);

// Process GRN for return request item
router.post('/item/:id/grn', 
  ReturnRequestItemController.processGRN
);

// Process Putaway for return request item
router.post('/item/:id/putaway', 
  ReturnRequestItemController.processPutaway
);

// Get return request item timeline
router.get('/item/:id/timeline', 
  ReturnRequestItemController.getReturnRequestItemTimeline
);

export default router;

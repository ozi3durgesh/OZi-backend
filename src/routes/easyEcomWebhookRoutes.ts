// routes/easyEcomWebhookRoutes.ts
import { Router } from 'express';
import { EasyEcomWebhookController } from '../controllers/EasyEcomWebhookController';

const router = Router();

// Ecommerce order processing and logs
router.post('/process-orders', 
  EasyEcomWebhookController.Getlogs
);

// Get ecommerce logs with pagination
router.get('/logs', 
  EasyEcomWebhookController.getEcomLogs
);

// Get specific ecommerce log by ID
router.get('/logs/:id', 
  EasyEcomWebhookController.getEcomLogById
);

// Get ecommerce logs for specific order
router.get('/logs/order/:orderId', 
  EasyEcomWebhookController.getEcomLogsByOrderId
);

// Retry failed ecommerce order
router.post('/retry/:orderId', 
  EasyEcomWebhookController.retryFailedOrder
);

// PHP Integration endpoints
router.post('/php-integration', 
  EasyEcomWebhookController.phpIntegration
);

// Test endpoint for EcomLog functionality
router.post('/test-ecomlog', 
  EasyEcomWebhookController.testEcomLog
);

router.get('/health', 
  EasyEcomWebhookController.healthCheck
);

export default router;

// routes/orderRoutes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';

const router = Router();

// All order routes - no authentication required for testing

router.post('/place', 
  OrderController.placeOrder
);

router.post('/validate-coupon', 
  OrderController.validateCoupon
);

router.get('/coupon/:coupon_code', 
  OrderController.getCouponDetails
);

// New order management endpoints - must come before parameterized routes
router.post('/cancel', OrderController.cancelOrder);
router.get('/track', OrderController.trackOrder);
router.post('/refund-request', OrderController.refundRequest);

// FC-filtered order routes (require authentication and FC context)
router.get('/fc/orders', authenticate, FCFilterMiddlewareFactory.createOrderFilter(), OrderController.getOrdersByFC);
router.get('/fc/:id', authenticate, FCFilterMiddlewareFactory.createOrderFilter(), OrderController.getOrderByIdAndFC);
router.put('/fc/:id', authenticate, FCFilterMiddlewareFactory.createOrderFilter(), OrderController.updateOrderByFC);

// Parameterized routes - must come after specific routes
router.get('/:id', 
  OrderController.getOrderById
);

router.get('/:id/items', 
  OrderController.getOrderItems
);

router.get('/custom/:orderId', 
  OrderController.getOrderByCustomId
);

router.get('/', 
  OrderController.getUserOrders
);

router.put('/update/:id', 
  OrderController.updateOrder
);

export default router;
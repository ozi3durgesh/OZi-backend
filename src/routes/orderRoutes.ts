// routes/orderRoutes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate, hasPermission, checkAvailability } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All order routes require version check and authentication
router.use(versionCheck);
router.use(authenticate);

router.post('/place', 
  checkAvailability, 
  hasPermission('orders:view_all'), 
  OrderController.placeOrder
);

router.get('/:id', 
  hasPermission('orders:view_all'), 
  OrderController.getOrderById
);

router.get('/', 
  hasPermission('orders:view_all'), 
  OrderController.getUserOrders
);

router.put('/update/:id', 
  checkAvailability, 
  hasPermission('orders:view_all'), 
  OrderController.updateOrder
);

export default router;
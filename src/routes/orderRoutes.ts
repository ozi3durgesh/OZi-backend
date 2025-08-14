import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post('/place', OrderController.placeOrder);
router.get('/:id', OrderController.getOrderById);
router.get('/', OrderController.getUserOrders);
router.put('/update/:id', OrderController.updateOrder);

export default router;
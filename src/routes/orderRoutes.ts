// routes/orderRoutes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/orderController';



const router = Router();

// All order routes - no authentication required for testing

router.post('/place', 
  OrderController.placeOrder
);

router.get('/:id', 
  OrderController.getOrderById
);

router.get('/', 
  OrderController.getUserOrders
);

router.put('/update/:id', 
  OrderController.updateOrder
);

export default router;
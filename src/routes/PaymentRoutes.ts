import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import PaymentController from '../controllers/PaymentController';
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// POST /api/payments/process
router.post("/process",  PaymentController.submitPayment);

router.get("/:purchaseOrderId", PaymentController.listPaymentsByPO);

export default router;
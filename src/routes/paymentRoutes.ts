// routes/paymentRoutes.ts
import { Router } from 'express';
import { RazorPayController } from '../controllers/razorPayController';

const router = Router();

// RazorPay payment routes
router.get('/razor-pay/pay', RazorPayController.index);
router.post('/razor-pay/payment', RazorPayController.payment);
router.post('/razor-pay/callback', RazorPayController.callback);
router.post('/razor-pay/cancel', RazorPayController.cancel);

export default router;

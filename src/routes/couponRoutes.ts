import { Router } from 'express';
import { CouponController } from '../controllers/couponController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All coupon routes require authentication
router.use(authenticate);

router.get('/apply', CouponController.applyCoupon);
router.post('/validate', CouponController.validateCoupon);

export default router;
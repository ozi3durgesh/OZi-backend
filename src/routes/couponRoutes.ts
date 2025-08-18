// routes/couponRoutes.ts
import { Router } from 'express';
import { CouponController } from '../controllers/couponController';
import { authenticate, hasPermission } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All coupon routes require version check and authentication
router.use(versionCheck);
router.use(authenticate);

router.get('/apply', hasPermission('pos:execute'), CouponController.applyCoupon);
router.post('/validate', hasPermission('pos:execute'), CouponController.validateCoupon);

export default router;
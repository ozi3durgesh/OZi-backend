import { Router } from 'express';
import { createVendor, getVendorById, getVendors } from '../controllers/vendorController';
import { authenticate } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';

const router = Router();

// Apply authentication and FC filtering to all vendor routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createVendorFilter());

router.post('/vendors', createVendor);
router.get('/vendors', getVendors);
router.get('/vendors/:vid', getVendorById); // Assuming getVendors can handle fetching by ID

export default router;
import { Router } from 'express';
import { createVendor, getVendorById, getVendors } from '../controllers/vendorController';
import { authenticate, hasPermission } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';

const router = Router();

// Apply authentication and FC filtering to all vendor routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createVendorFilter());

router.post('/vendors', hasPermission('vendor_managements-create'), createVendor);
router.get('/vendors', hasPermission('vendor_managements-view'), getVendors);
router.get('/vendors/:vid', hasPermission('vendor_managements-view'), getVendorById); // Assuming getVendors can handle fetching by ID

export default router;
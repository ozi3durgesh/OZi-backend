import { Router } from 'express';
import { authenticate, hasPermission } from '../../middleware/auth';
import { DCVendorController } from '../../controllers/DC/vendorController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/vendors', hasPermission('vendor_managements-create'), DCVendorController.createVendor);
router.get('/vendors', hasPermission('vendor_managements-view'), DCVendorController.getVendors);
router.get('/vendors/:id', hasPermission('vendor_managements-view'), DCVendorController.getVendorById);
router.get('/vendors/code/:vendorId', hasPermission('vendor_managements-view'), DCVendorController.getVendorByVendorId);
router.put('/vendors/:id', hasPermission('vendor_managements-edit'), DCVendorController.updateVendor);
router.delete('/vendors/:id', hasPermission('vendor_managements-edit'), DCVendorController.deleteVendor);

export default router;


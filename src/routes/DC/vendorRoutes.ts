import { Router } from 'express';
import { authenticate, isAdmin } from '../../middleware/auth';
import { DCVendorController } from '../../controllers/DC/vendorController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * DC Vendor Routes
 * All vendor creation, update, and delete operations require admin role
 */

// Create vendor (Admin only)
router.post('/vendors', isAdmin, DCVendorController.createVendor);

// Get all vendors (Authenticated users)
router.get('/vendors', DCVendorController.getVendors);

// Get vendor by ID (Authenticated users)
router.get('/vendors/:id', DCVendorController.getVendorById);

// Get vendor by vendor ID (OZIVID format) (Authenticated users)
router.get('/vendors/code/:vendorId', DCVendorController.getVendorByVendorId);

// Update vendor (Admin only)
router.put('/vendors/:id', isAdmin, DCVendorController.updateVendor);


// Delete vendor (Admin only)
router.delete('/vendors/:id', isAdmin, DCVendorController.deleteVendor);

export default router;


import { Router } from 'express';
import { createVendor, getVendorById, getVendors } from '../controllers/vendorController';

const router = Router();

router.post('/vendors', createVendor);
router.get('/vendors', getVendors);
router.get('/vendors/:vid', getVendorById); // Assuming getVendors can handle fetching by ID

export default router;
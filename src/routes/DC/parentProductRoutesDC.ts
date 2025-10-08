import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createParentProduct,
  updateParentProduct,
  getParentProducts,
  getParentProductBySKU,
  getParentProductById,
  deleteParentProduct,
} from '../../controllers/DC/parentProductControllerDC';

const router = Router();

// Apply authentication to all parent product routes
router.use(authenticate);

// Create parent product
router.post('/parent-products', createParentProduct);

// Get all parent products (with pagination and filters)
router.get('/parent-products', getParentProducts);

// Get parent product by ID (must be before /:sku route to avoid conflict)
router.get('/parent-products/id/:id', getParentProductById);

// Get parent product by SKU
router.get('/parent-products/:sku', getParentProductBySKU);

// Update parent product
router.put('/parent-products/:id', updateParentProduct);

// Delete parent product
router.delete('/parent-products/:id', deleteParentProduct);

export default router;


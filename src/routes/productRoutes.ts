import { Router } from 'express';
import multer from 'multer';
import { createProduct, updateProduct, getProducts, getProductBySKU, bulkUpdateProducts, updateProductEAN } from '../controllers/productsController';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // saves file to uploads/

// Create product
router.post('/products', createProduct);

// Get products
router.get('/products', getProducts);

// Bulk insert/update via CSV upload
router.post('/products/bulk', upload.single('file'), bulkUpdateProducts);

// Update EAN/UPC for product and related GRN lines (MUST be before parameterized routes)
router.put('/products/update-ean', updateProductEAN);

// Update product (parameterized route)
router.put('/products/:id', updateProduct);

// Get product by SKU (parameterized route)
router.get('/products/:sku', getProductBySKU);

export default router;

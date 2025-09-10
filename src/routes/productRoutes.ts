import { Router } from 'express';
import multer from 'multer';
import { createProduct, updateProduct, getProducts, getProductBySKU, bulkUpdateProducts } from '../controllers/productsController';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // saves file to uploads/

// Create product
router.post('/products', createProduct);

// Update product
router.put('/products/:id', updateProduct);

// Get products
router.get('/products', getProducts);

// Get product by SKU
router.get('/products/:sku', getProductBySKU);

// Bulk insert/update via CSV upload
router.post('/products/bulk', upload.single('file'), bulkUpdateProducts);

export default router;

import { Router } from 'express';
import { createProduct, updateProduct, getProducts, getProductBySKU } from '../controllers/productsController';

const router = Router();

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.get('/products', getProducts);
router.get('/products/:sku', getProductBySKU);

export default router;
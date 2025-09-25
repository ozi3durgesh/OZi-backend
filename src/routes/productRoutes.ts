import { Router } from 'express';
import multer from 'multer';
import { 
  createProduct, 
  updateProduct, 
  getProducts, 
  getProductBySKU, 
  bulkUpdateProducts, 
  updateProductEAN,
  getBulkImportLogsByUser,
  getBulkImportLogsByStatus,
  getBulkImportLogById,
  processCSVForPO
} from '../controllers/productsController';

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

// Bulk import log endpoints
router.get('/products/bulk/logs/user/:userId', getBulkImportLogsByUser);
router.get('/products/bulk/logs/status/:status', getBulkImportLogsByStatus);
router.get('/products/bulk/logs/:id', getBulkImportLogById);

// Process CSV for PO creation - Get enriched product data
router.post('/products/csv-process', upload.single('file'), processCSVForPO);

export default router;
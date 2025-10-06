import { Router } from 'express';
import multer from 'multer';
import { authenticate, checkFulfillmentCenterAccess } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';
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
  processCSVForPO,
  getProductsByFC
} from '../controllers/productsController';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // saves file to uploads/

// Apply authentication and FC filtering to all product routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createProductFilter());

// Create product
router.post('/products', createProduct);

// Get products (FC-filtered) - temporarily commented out
// router.get('/products', authenticate, fcFilterMiddleware, getProductsByFC);
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

// FC-filtered product routes - temporarily commented out
// router.get('/products/fc/products', authenticate, fcFilterMiddleware, getProductsByFC);
// router.get('/products/fc/:id', authenticate, fcFilterMiddleware, getProductByIdAndFC);
// router.put('/products/fc/:id', authenticate, fcFilterMiddleware, updateProductByFC);
// router.post('/products/fc/create', authenticate, fcFilterMiddleware, createProductByFC);

export default router;
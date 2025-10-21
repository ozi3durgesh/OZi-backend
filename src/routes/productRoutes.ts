import { Router } from 'express';
import multer from 'multer';
import { authenticate, checkFulfillmentCenterAccess } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';
import { 
  createProductMaster, 
  updateProductMaster, 
  getProductMasters, 
  getProductMasterBySKU, 
  bulkUpdateProductMasters, 
  updateProductMasterEAN,
  getBulkImportLogsByUser,
  getBulkImportLogsBystatus,
  getBulkImportLogById,
  processCSVForPO,
  getProductMastersByFC
} from '../controllers/productsController';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // saves file to uploads/

// Apply authentication and FC filtering to all product routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createProductFilter());

// Create product
router.post('/products', createProductMaster);

// Get products (FC-filtered) - temporarily commented out
// router.get('/products', authenticate, fcFilterMiddleware, getProductMastersByFC);
router.get('/products', getProductMasters);

// Bulk insert/update via CSV upload
router.post('/products/bulk', upload.single('file'), bulkUpdateProductMasters);

// Update EAN/UPC for product and related GRN lines (MUST be before parameterized routes)
router.put('/products/update-ean', updateProductMasterEAN);

// Update product (parameterized route)
router.put('/products/:id', updateProductMaster);

// Get product by SKU (parameterized route)
router.get('/products/:sku', getProductMasterBySKU);

// Bulk import log endpoints
router.get('/products/bulk/logs/user/:userId', getBulkImportLogsByUser);
router.get('/products/bulk/logs/status/:status', getBulkImportLogsBystatus);
router.get('/products/bulk/logs/:id', getBulkImportLogById);

// Process CSV for PO creation - Get enriched product data
router.post('/products/csv-process', upload.single('file'), processCSVForPO);

// FC-filtered product routes - temporarily commented out
// router.get('/products/fc/products', authenticate, fcFilterMiddleware, getProductsByFC);
// router.get('/products/fc/:id', authenticate, fcFilterMiddleware, getProductByIdAndFC);
// router.put('/products/fc/:id', authenticate, fcFilterMiddleware, updateProductByFC);
// router.post('/products/fc/create', authenticate, fcFilterMiddleware, createProductByFC);

export default router;
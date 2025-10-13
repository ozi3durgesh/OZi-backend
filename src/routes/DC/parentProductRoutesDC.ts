import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import {
  createParentProduct,
  updateParentProduct,
  getParentProducts,
  getParentProductByCatalogueId,
  getParentProductById,
  deleteParentProduct,
  bulkUploadParentProducts,
} from '../../controllers/DC/parentProductControllerDC';
import { fetchSKUByCatalogueId } from '../../controllers/DC/fetchSKUController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Apply authentication to all parent product routes
router.use(authenticate);

// Create parent product
router.post('/parent-products', createParentProduct);

// Get all parent products (with pagination and filters)
router.get('/parent-products', getParentProducts);

// Get parent product by ID (must be before /:catalogueId route to avoid conflict)
router.get('/parent-products/id/:id', getParentProductById);

// Get parent product by catalogue ID
router.get('/parent-products/catalogue/:catalogueId', getParentProductByCatalogueId);

// Update parent product
router.put('/parent-products/:id', updateParentProduct);

// Delete parent product
router.delete('/parent-products/:id', deleteParentProduct);

// Bulk upload parent products via Excel
router.post('/parent-products/bulk-upload', upload.single('file'), bulkUploadParentProducts);

// Fetch SKUs by catalogue ID
router.get('/fetchSKU/:catalogue_id', fetchSKUByCatalogueId);

export default router;


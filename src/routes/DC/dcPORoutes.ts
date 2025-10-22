import { Router } from 'express';
import { authenticate, isAdmin } from '../../middleware/auth';
import { DCPOController } from '../../controllers/DC/dcPOController';
import dcSkuSplittingRoutes from './dcSkuSplittingRoutes';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed') as any, false);
    }
  }
});

// All routes require authentication
router.use(authenticate);

/**
 * DC Purchase Order Routes
 * Following the approval workflow: Creator >> Category Head >> Admin/Founder >> Creator Review
 */

// Create DC Purchase Order (Admin only)
router.post('/purchase-orders', isAdmin, DCPOController.createDCPO);

// Get all DC Purchase Orders (Authenticated users)
router.get('/purchase-orders', DCPOController.getDCPOs);

// Get DC Purchase Order by ID (Authenticated users)
router.get('/purchase-orders/:id', DCPOController.getDCPOById);

// Get complete product details for a DC Purchase Order (Authenticated users)
router.get('/purchase-orders/:id/products', DCPOController.getDCPOProductDetails);

// Update DC Purchase Order (Admin only, only if status is DRAFT)
router.put('/purchase-orders/:id', isAdmin, DCPOController.updateDCPO);

// Submit DC Purchase Order for approval (Admin only)
router.post('/purchase-orders/:id/submit', isAdmin, DCPOController.submitForApproval);

// Creator upload PI and set delivery date (Authenticated users)
router.post('/purchase-orders/:id/upload-pi', upload.single('piFile'), DCPOController.uploadPIAndSetDeliveryDate);

// Delete DC Purchase Order (Admin only, only if status is DRAFT)
router.delete('/purchase-orders/:id', isAdmin, DCPOController.deleteDCPO);

// Approval workflow routes (public routes for email links)
// Get approval details by token (for frontend approval page)
router.get('/approval/:token', DCPOController.getApprovalDetails);

// Process approval/rejection via token (public route for email links)
router.post('/approval/:token', DCPOController.processApproval);

router.put('/purchase-orders/:id/edit', DCPOController.editPO);
router.put('/purchase-orders/:id/approve',isAdmin, DCPOController.approvePO);

// Direct approval/rejection without hierarchy (Authorized users - Role ID 1, 3, or 7)
router.post('/purchase-orders/:id/direct-approve', DCPOController.directApproval);

// SKU Splitting routes
router.use('/', dcSkuSplittingRoutes);

export default router;

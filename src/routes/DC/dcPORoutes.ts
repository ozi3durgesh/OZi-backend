import { Router } from 'express';
import { authenticate, hasPermission } from '../../middleware/auth';
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

// Create DC Purchase Order
router.post('/purchase-orders', hasPermission('dc_po_raise-create'), DCPOController.createDCPO);

// Get all DC Purchase Orders
router.get('/purchase-orders', hasPermission('dc_po_raise-view'), DCPOController.getDCPOs);

// Get DC Purchase Order by ID
router.get('/purchase-orders/:id', hasPermission('dc_po_raise-view'), DCPOController.getDCPOById);

// Get complete product details for a DC Purchase Order
router.get('/purchase-orders/:id/products', hasPermission('dc_po_raise-view'), DCPOController.getDCPOProductDetails);

// Update DC Purchase Order (only if status is DRAFT)
router.put('/purchase-orders/:id', hasPermission('dc_po_approve-edit'), DCPOController.updateDCPO);

// Submit DC Purchase Order for approval
router.post('/purchase-orders/:id/submit', hasPermission('dc_po_approve-edit'), DCPOController.submitForApproval);

// Creator upload PI and set delivery date
router.post('/purchase-orders/:id/upload-pi', hasPermission('dc_po_payments-create'), upload.single('piFile'), DCPOController.uploadPIAndSetDeliveryDate);

// Delete DC Purchase Order (only if status is DRAFT)
router.delete('/purchase-orders/:id', hasPermission('dc_po_approve-edit'), DCPOController.deleteDCPO);

// Approval workflow routes (public routes for email links)
// Get approval details by token (for frontend approval page)
router.get('/approval/:token', DCPOController.getApprovalDetails);

// Process approval/rejection via token (public route for email links)
router.post('/approval/:token', DCPOController.processApproval);

router.put('/purchase-orders/:id/edit', hasPermission('dc_po_approve-edit'), DCPOController.editPO);
router.put('/purchase-orders/:id/approve', hasPermission('dc_po_approve'), DCPOController.approvePO);

// Direct approval/rejection without hierarchy
router.post('/purchase-orders/:id/direct-approve', hasPermission('dc_po_approve'), DCPOController.directApproval);

// SKU Splitting routes
router.use('/', dcSkuSplittingRoutes);

export default router;

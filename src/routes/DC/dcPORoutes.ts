import { Router } from 'express';
import { authenticate, isAdmin } from '../../middleware/auth';
import { DCPOController } from '../../controllers/DC/dcPOController';

const router = Router();

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

// Delete DC Purchase Order (Admin only, only if status is DRAFT)
router.delete('/purchase-orders/:id', isAdmin, DCPOController.deleteDCPO);

// Approval workflow routes (public routes for email links)
// Get approval details by token (for frontend approval page)
router.get('/approval/:token', DCPOController.getApprovalDetails);

// Process approval/rejection via token (public route for email links)
router.post('/approval/:token', DCPOController.processApproval);

export default router;

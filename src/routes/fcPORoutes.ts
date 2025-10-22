import { Router } from 'express';
import { FCPOController } from '../controllers/FC/fcPOController';
import { authenticate, hasRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route POST /api/fc-po
 * @desc Create a new FC Purchase Order
 * @access Private (FC users)
 */
router.post('/', FCPOController.createFCPO);

/**
 * @route POST /api/fc-po/raise
 * @desc Raise FC Purchase Order (alias for create)
 * @access Private (FC users)
 */
router.post('/raise', FCPOController.raiseFCPO);

/**
 * @route GET /api/fc-po
 * @desc Get FC Purchase Orders with filters and pagination
 * @access Private
 */
router.get('/', FCPOController.getFCPOs);

/**
 * @route GET /api/fc-po/available-products
 * @desc Get available products for FC PO (products that have been GRN'd from DC)
 * @access Private
 */
router.get('/available-products', FCPOController.getAvailableProducts);

/**
 * @route GET /api/fc-po/:id
 * @desc Get FC Purchase Order by ID
 * @access Private
 */
router.get('/:id', FCPOController.getFCPOById);

/**
 * @route PUT /api/fc-po/:id
 * @desc Update FC Purchase Order
 * @access Private (FC users)
 */
router.put('/:id', FCPOController.updateFCPO);

/**
 * @route DELETE /api/fc-po/:id
 * @desc Delete FC Purchase Order
 * @access Private (FC users)
 */
router.delete('/:id', FCPOController.deleteFCPO);

/**
 * @route POST /api/fc-po/:id/submit
 * @desc Submit FC Purchase Order for approval
 * @access Private (FC users)
 */
router.post('/:id/submit', FCPOController.submitForApproval);

/**
 * @route POST /api/fc-po/:id/approve
 * @desc Approve/Reject FC Purchase Order (DC Dashboard - Role ID 1, 3, or 7)
 * @access Private (DC Admin/Manager/Approver - Role ID 1, 3, or 7)
 */
router.post('/:id/approve', FCPOController.processApproval);

export default router;

import { Router } from 'express';
import { DCFCPOController } from '../controllers/DC/dcFCPOController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/dc/fc-pos
 * @desc Get all FC-POs assigned to DC for approval
 * @access Private (DC users - Role ID 1 or 3)
 */
router.get('/', DCFCPOController.getFCPOsForApproval);

/**
 * @route GET /api/dc/fc-pos/statistics
 * @desc Get FC-PO statistics for DC dashboard
 * @access Private (DC users - Role ID 1 or 3)
 */
router.get('/statistics', DCFCPOController.getFCPOStatistics);

/**
 * @route GET /api/dc/fc-pos/:id
 * @desc Get FC-PO details for approval
 * @access Private (DC users - Role ID 1 or 3)
 */
router.get('/:id', DCFCPOController.getFCPOForApproval);

/**
 * @route POST /api/dc/fc-pos/:id/approve
 * @desc Approve/Reject FC Purchase Order (DC Dashboard)
 * @access Private (DC users - Role ID 1 or 3)
 */
router.post('/:id/approve', DCFCPOController.approveRejectFCPO);

export default router;

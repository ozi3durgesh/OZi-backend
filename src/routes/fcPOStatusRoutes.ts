import { Router } from 'express';
import { FCPOStatusController } from '../controllers/FC/fcPOStatusController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/fc-po/status
 * @desc Get FC-PO status summary (approved, rejected, pending)
 * @access Private
 */
router.get('/status', FCPOStatusController.getFCPOStatus);

/**
 * @route GET /api/fc-po/status/:status
 * @desc Get FC-POs by specific status
 * @access Private
 */
router.get('/status/:status', FCPOStatusController.getFCPOsByStatus);

/**
 * @route GET /api/fc-po/:id/status-history
 * @desc Get FC-PO status history/timeline
 * @access Private
 */
router.get('/:id/status-history', FCPOStatusController.getFCPOStatusHistory);

export default router;

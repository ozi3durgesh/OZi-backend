import { Router } from 'express';
import { DCFCPOController } from '../controllers/DC/dcFCPOController';
import { authenticate, hasPermission } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.get('/', hasPermission('fc_po_approve-view'), DCFCPOController.getFCPOsForApproval);
router.get('/statistics', hasPermission('fc_po_approve-view'), DCFCPOController.getFCPOStatistics);
router.get('/:id', hasPermission('fc_po_approve-view'), DCFCPOController.getFCPOForApproval);
router.post('/:id/approve', hasPermission('fc_po_approve'), DCFCPOController.approveRejectFCPO);

export default router;

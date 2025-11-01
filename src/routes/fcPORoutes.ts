import { Router } from 'express';
import { FCPOController } from '../controllers/FC/fcPOController';
import { authenticate, hasPermission } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', hasPermission('fc_po_raise-create'), FCPOController.createFCPO);
router.post('/raise', hasPermission('fc_po_raise-create'), FCPOController.raiseFCPO);
router.get('/', hasPermission('fc_po_raise-view'), FCPOController.getFCPOs);
router.get('/available-products', hasPermission('fc_po_raise-view'), FCPOController.getAvailableProducts);
router.get('/:id', hasPermission('fc_po_raise-view'), FCPOController.getFCPOById);
router.put('/:id', hasPermission('fc_po_raise-create'), FCPOController.updateFCPO);
router.delete('/:id', hasPermission('fc_po_raise-create'), FCPOController.deleteFCPO);
router.post('/:id/submit', hasPermission('fc_po_approve-view'), FCPOController.submitForApproval);
router.post('/:id/approve', hasPermission('fc_po_approve'), FCPOController.processApproval);

export default router;

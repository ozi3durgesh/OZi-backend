import { Router } from 'express';
import { createPurchaseOrder, approvePO, getAllPOs, getPOById } from '../controllers/purchaseOrderController';

const router = Router();

router.post('/', createPurchaseOrder);       // Create PO
router.put('/:id/approve', approvePO);       // Approve/Reject via API
router.get('/:id/approve', approvePO);       // Approve/Reject via Email link
router.get('/', getAllPOs);                  // Get all POs
router.get('/:id', getPOById);               // Get PO by ID

export default router;

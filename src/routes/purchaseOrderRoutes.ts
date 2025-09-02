import { Router } from 'express';
import {
  createPurchaseOrder,
  getAllPOs,
  getPOById,
  approvePO
} from '../controllers/purchaseOrderController';

const router = Router();

router.post('/', createPurchaseOrder);
router.get('/', getAllPOs);
router.get('/:id', getPOById);
router.post('/approve/:id', approvePO);

export default router;
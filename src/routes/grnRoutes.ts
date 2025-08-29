import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { GrnController } from '../controllers/grnController';
import { GrnLineController } from '../controllers/grnLineController';
import { GrnBatchController } from '../controllers/grnBatchController';
import { GrnPhotoController } from '../controllers/grnPhotoController';

const router = Router();

// Apply authentication middleware to all warehouse routes
router.use(authenticate);

router.get('/');

// GRN Management Routes
router.post('/', GrnController.createGrn);
router.get('/', GrnController.getGrnDetails);
router.get('/:id', GrnController.getGrnById);
router.put('/:id', GrnController.updateGrn);
router.patch('/:id/status', GrnController.updateGrnStatus);
router.delete('/:id', GrnController.deleteGrn);

// Grn-line route

router.post('/line/', GrnLineController.createGrnLine);
router.get('/line/', GrnLineController.getGrnLines);
router.get('/line/:id', GrnLineController.getGrnLineById);
router.put('/line/:id', GrnLineController.updateGrnLine);
router.delete('/line/:id', GrnLineController.deleteGrnLine);

router.post('/batch/', GrnBatchController.createGrnBatch);
router.get('/batch/', GrnBatchController.getGrnBatchs);
router.get('/batch/:id', GrnBatchController.getGrnBatchById);
router.put('/batch/:id', GrnBatchController.updateGrnBatch);
router.delete('/batch/:id', GrnBatchController.deleteGrnBatch);

router.post('/photo/', GrnPhotoController.createGRNPhotos);

export default router;

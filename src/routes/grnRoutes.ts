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
router.get('/:id', GrnController.getGrnById);
router.get('/', GrnController.getGrnDetails);

router.put('/:id', GrnController.updateGrn);
router.patch('/:id/status', GrnController.updateGrnStatus);
router.delete('/:id', GrnController.deleteGrn);

// Grn-line route

router.post('/line/', GrnLineController.createGrnLine);
router.get('/line/list', GrnLineController.getGrnLines);
router.get('/line/:id', GrnLineController.getGrnLineById);
router.put('/line/:id', GrnLineController.updateGrnLine);
router.delete('/line/:id', GrnLineController.deleteGrnLine);

router.post('/batch/', GrnBatchController.createGrnBatch);
router.get('/batch/list', GrnBatchController.getGrnBatchs);
router.get('/batch/:id', GrnBatchController.getGrnBatchById);
router.get('/grn-line-batch/:id', GrnBatchController.getGrnBatchByGrnLineId);
router.put('/batch/:id', GrnBatchController.updateGrnBatch);
router.delete('/batch/:id', GrnBatchController.deleteGrnBatch);

router.post('/photo/', GrnPhotoController.createGRNPhotos);
router.get('/photo/line/:id', GrnPhotoController.getGrnPhotoByLineId);
router.get('/photo/:id', GrnPhotoController.getGrnPhotoById);
router.delete('/photo/:id', GrnPhotoController.deleteGrnPhoto);

export default router;

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { GrnController } from '../controllers/grnController';
import { GrnLineController } from '../controllers/grnLineController';
import { GrnBatchController } from '../controllers/grnBatchController';
import { GrnPhotoController } from '../controllers/grnPhotoController';
import { S3Service } from '../services/s3Service';

const router = Router();

// Apply authentication middleware to all warehouse routes
router.use(authenticate);

router.get('/');

// GRN Management Routes
router.post('/', GrnController.createGrn);
router.get('/list', GrnController.getGrnDetails);
router.get('/stats/status-wise', GrnController.getGrnStats);
router.get('/:id', GrnController.getGrnById);
router.post('/create-flow', GrnController.createFullGRN);
router.get('/po/:poId', GrnController.getGrnsByPoIdWithDetails);

router.put('/:id', GrnController.updateGrn);
router.patch('/:id/status', GrnController.updateGrnStatus);
router.delete('/:id', GrnController.deleteGrn);

// Grn-line route

router.post('/line/create', GrnLineController.createGrnLine);
router.post('/line/create-grn-id', GrnLineController.createGrnLineByGrnId);
router.get('/line/list', GrnLineController.getGrnLines);
router.get('/line/grn-id/:id', GrnLineController.getGrnLineByGrnId);
router.get('/line/:id', GrnLineController.getGrnLineById);
router.put('/line/:id', GrnLineController.updateGrnLineById);
router.delete('/line/:id', GrnLineController.deleteGrnLine);

router.post('/batch/', GrnBatchController.createGrnBatch);
router.get('/batch/list', GrnBatchController.getGrnBatchs);
router.get('/batch/:id', GrnBatchController.getGrnBatchById);
router.get('/grn-line-batch/:id', GrnBatchController.getGrnBatchByGrnLineId);
router.put('/batch/:id', GrnBatchController.updateGrnBatch);
router.delete('/batch/:id', GrnBatchController.deleteGrnBatch);

router.post('/photo/', GrnPhotoController.createGRNPhotos);
router.post('/photo/upload', S3Service.upload.array('photos', 10), GrnPhotoController.uploadGRNPhotos);
router.get('/photo/line/:id', GrnPhotoController.getGrnPhotoByLineId);
router.get('/photo/:id', GrnPhotoController.getGrnPhotoById);
router.delete('/photo/:id', GrnPhotoController.deleteGrnPhoto);

// New routes for signed URLs
router.get('/photo/signed-urls/:id', GrnPhotoController.getSignedUrlsForPhoto);
router.get('/photo/signed-urls/line/:lineId', GrnPhotoController.getSignedUrlsForGrnLine);

export default router;

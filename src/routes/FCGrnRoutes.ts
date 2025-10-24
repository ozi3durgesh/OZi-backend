import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { FCFilterMiddlewareFactory } from '../middleware/fcFilterMiddleware';
import { FCGrnController } from '../controllers/FCGrnController';
import { FCGrnLineController } from '../controllers/FCGrnLineController';
import { FCGrnBatchController } from '../controllers/FCGrnBatchController';
import { FCGrnPhotoController } from '../controllers/FCGrnPhotoController';
import { S3Service } from '../services/s3Service';

const router = Router();

// Create controller instance
const fcGrnController = new FCGrnController();

// Apply authentication and FC filtering to all GRN routes
router.use(authenticate);
router.use(FCFilterMiddlewareFactory.createGRNFilter());

router.get('/');

// FC GRN Management Routes
router.post('/', fcGrnController.createFCGrn.bind(fcGrnController));
router.get('/list', FCGrnController.getFCGrnDetails);
router.get('/stats/status-wise', FCGrnController.getFCGrnStats);
router.get('/fix-constraints', FCGrnController.fixConstraints);
router.get('/po/:poId', FCGrnController.getFCGrnsByPoIdWithDetails);
router.get('/:id', FCGrnController.getFCGrnById);
router.post('/create-flow', fcGrnController.createFullFCFCGrn.bind(fcGrnController));

router.put('/:id', FCGrnController.updateFCGrn);
router.patch('/:id/status', fcGrnController.updateFCGrnStatus.bind(fcGrnController));
router.delete('/:id', FCGrnController.deleteFCGrn);

// FC Grn-line route

router.post('/line/create', FCGrnLineController.createFCGrnLine);
router.post('/line/create-grn-id', FCGrnLineController.createFCGrnLineByGrnId);
router.get('/line/list', FCGrnLineController.getFCGrnLines);
router.get('/line/grn-id/:id', FCGrnLineController.getFCGrnLineByGrnId);
router.get('/line/:id', FCGrnLineController.getFCGrnLineById);
router.put('/line/:id', FCGrnLineController.updateFCGrnLineById);
router.delete('/line/:id', FCGrnLineController.deleteFCGrnLine);

router.post('/batch/', FCGrnBatchController.createFCGrnBatch);
router.get('/batch/list', FCGrnBatchController.getFCGrnBatchs);
router.get('/batch/:id', FCGrnBatchController.getFCGrnBatchById);
router.get('/grn-line-batch/:id', FCGrnBatchController.getFCGrnBatchByGrnLineId);
router.put('/batch/:id', FCGrnBatchController.updateFCGrnBatch);
router.delete('/batch/:id', FCGrnBatchController.deleteFCGrnBatch);

router.post('/photo/', FCGrnPhotoController.createFCGrnPhotos);
router.post('/photo/upload', S3Service.upload.array('photos', 10), FCGrnPhotoController.uploadFCGrnPhotos);
router.get('/photo/line/:id', FCGrnPhotoController.getFCGrnPhotoByLineId);
router.get('/photo/:id', FCGrnPhotoController.getFCGrnPhotoById);
router.delete('/photo/:id', FCGrnPhotoController.deleteFCGrnPhoto);

// New routes for signed URLs
router.get('/photo/signed-urls/:id', FCGrnPhotoController.getSignedUrlsForPhoto);
router.get('/photo/signed-urls/line/:lineId', FCGrnPhotoController.getSignedUrlsForGrnLine);

export default router;

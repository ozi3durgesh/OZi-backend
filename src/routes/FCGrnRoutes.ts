import { Router, Request, Response } from 'express';
import { authenticate, hasPermission } from '../middleware/auth';
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
router.post('/', hasPermission('fc_grns-create'), fcGrnController.createFCGrn.bind(fcGrnController));
router.get('/list', hasPermission('fc_grns-view'), FCGrnController.getFCGrnDetails);
router.get('/stats/status-wise', hasPermission('fc_grns-view'), FCGrnController.getFCGrnStats);
router.get('/fix-constraints', hasPermission('fc_grns-view'), FCGrnController.fixConstraints);
router.get('/po/:poId', hasPermission('fc_grns-view'), FCGrnController.getFCGrnsByPoIdWithDetails);
router.get('/:id', hasPermission('fc_grns-view'), FCGrnController.getFCGrnById);
router.post('/create-flow', hasPermission('fc_grns-create'), fcGrnController.createFullFCFCGrn.bind(fcGrnController));

router.put('/:id', hasPermission('fc_grns-create'), FCGrnController.updateFCGrn);
router.patch('/:id/status', hasPermission('fc_grns-create'), fcGrnController.updateFCGrnStatus.bind(fcGrnController));
router.delete('/:id', hasPermission('fc_grns-create'), FCGrnController.deleteFCGrn);

// FC Grn-line routes
router.post('/line/create', hasPermission('fc_grns-create'), FCGrnLineController.createFCGrnLine);
router.post('/line/create-grn-id', hasPermission('fc_grns-create'), FCGrnLineController.createFCGrnLineByGrnId);
router.get('/line/list', hasPermission('fc_grns-view'), FCGrnLineController.getFCGrnLines);
router.get('/line/grn-id/:id', hasPermission('fc_grns-view'), FCGrnLineController.getFCGrnLineByGrnId);
router.get('/line/:id', hasPermission('fc_grns-view'), FCGrnLineController.getFCGrnLineById);
router.put('/line/:id', hasPermission('fc_grns-create'), FCGrnLineController.updateFCGrnLineById);
router.delete('/line/:id', hasPermission('fc_grns-create'), FCGrnLineController.deleteFCGrnLine);

// FC Grn-batch routes
router.post('/batch/', hasPermission('fc_grns-create'), FCGrnBatchController.createFCGrnBatch);
router.get('/batch/list', hasPermission('fc_grns-view'), FCGrnBatchController.getFCGrnBatchs);
router.get('/batch/:id', hasPermission('fc_grns-view'), FCGrnBatchController.getFCGrnBatchById);
router.get('/grn-line-batch/:id', hasPermission('fc_grns-view'), FCGrnBatchController.getFCGrnBatchByGrnLineId);
router.put('/batch/:id', hasPermission('fc_grns-create'), FCGrnBatchController.updateFCGrnBatch);
router.delete('/batch/:id', hasPermission('fc_grns-create'), FCGrnBatchController.deleteFCGrnBatch);

// FC Grn-photo routes
router.post('/photo/', hasPermission('fc_grns-create'), FCGrnPhotoController.createFCGrnPhotos);
router.post('/photo/upload', hasPermission('fc_grns-create'), S3Service.upload.array('photos', 10), FCGrnPhotoController.uploadFCGrnPhotos);
router.get('/photo/line/:id', hasPermission('fc_grns-view'), FCGrnPhotoController.getFCGrnPhotoByLineId);
router.get('/photo/:id', hasPermission('fc_grns-view'), FCGrnPhotoController.getFCGrnPhotoById);
router.delete('/photo/:id', hasPermission('fc_grns-create'), FCGrnPhotoController.deleteFCGrnPhoto);

// New routes for signed URLs
router.get('/photo/signed-urls/:id', hasPermission('fc_grns-view'), FCGrnPhotoController.getSignedUrlsForPhoto);
router.get('/photo/signed-urls/line/:lineId', hasPermission('fc_grns-view'), FCGrnPhotoController.getSignedUrlsForGrnLine);

export default router;

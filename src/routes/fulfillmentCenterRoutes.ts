import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createFulfillmentCenter,
  getFulfillmentCenters,
  getFulfillmentCenterById,
  updateFulfillmentCenter,
  deleteFulfillmentCenter,
  updateFulfillmentCenterStatus,
  getFulfillmentCentersByDC
} from '../controllers/fulfillmentCenterController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Fulfillment Center routes
router.post('/', createFulfillmentCenter);
router.get('/', getFulfillmentCenters);
router.get('/dc/:dc_id', getFulfillmentCentersByDC);
router.get('/:id', getFulfillmentCenterById);
router.put('/:id', updateFulfillmentCenter);
router.delete('/:id', deleteFulfillmentCenter);
router.patch('/:id/status', updateFulfillmentCenterStatus);

export default router;

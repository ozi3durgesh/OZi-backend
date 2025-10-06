import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  selectFulfillmentCenter,
  getAvailableFulfillmentCenters,
  getCurrentFulfillmentCenter
} from '../controllers/fcSelectionController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// FC Selection routes
router.post('/select', selectFulfillmentCenter);
router.get('/available', getAvailableFulfillmentCenters);
router.get('/current', getCurrentFulfillmentCenter);

export default router;

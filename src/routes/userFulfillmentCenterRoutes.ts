import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  assignUserToFulfillmentCenter,
  getUserFulfillmentCenters,
  getFulfillmentCenterUsers,
  updateUserFulfillmentCenterAssignment,
  removeUserFromFulfillmentCenter,
  getUserAvailableFulfillmentCenters,
  setDefaultFulfillmentCenter
} from '../controllers/userFulfillmentCenterController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User-Fulfillment Center assignment routes
router.post('/assign', assignUserToFulfillmentCenter);
router.get('/user/:user_id', getUserFulfillmentCenters);
router.get('/fc/:fc_id', getFulfillmentCenterUsers);
router.put('/:id', updateUserFulfillmentCenterAssignment);
router.delete('/:id', removeUserFromFulfillmentCenter);

// User-specific routes
router.get('/available', getUserAvailableFulfillmentCenters);
router.post('/set-default', setDefaultFulfillmentCenter);

export default router;

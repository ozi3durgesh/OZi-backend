import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createDistributionCenter,
  getDistributionCenters,
  getDistributionCenterById,
  updateDistributionCenter,
  deleteDistributionCenter,
  updateDistributionCenterStatus
} from '../controllers/distributionCenterController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Distribution Center routes
router.post('/', createDistributionCenter);
router.get('/', getDistributionCenters);
router.get('/:id', getDistributionCenterById);
router.put('/:id', updateDistributionCenter);
router.delete('/:id', deleteDistributionCenter);
router.patch('/:id/status', updateDistributionCenterStatus);

export default router;

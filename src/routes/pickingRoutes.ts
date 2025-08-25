// routes/pickingRoutes.ts
import express from 'express';
import { PickingController } from '../controllers/pickingController';
import { authenticate, hasPermission, checkAvailability } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = express.Router();

// Apply version check middleware to all picking routes
router.use(versionCheck);

// Picklist Management
router.post('/generate', 
  authenticate, 
  hasPermission('picking:assign_manage'), 
  PickingController.generateWaves
);

router.get('/assign', 
  authenticate, 
  hasPermission('picking:assign_manage'), 
  PickingController.assignWaves
);

router.get('/available', 
  authenticate, 
  hasPermission('picking:view'), 
  PickingController.getAvailableWaves
);

// Picker Operations
router.post('/:waveId/start', 
  authenticate, 
  hasPermission('picking:execute'), 
  checkAvailability, 
  PickingController.startPicking
);

router.get('/:waveId/items', 
  authenticate, 
  hasPermission('picking:view'), 
  PickingController.getPicklistItems
);

router.post('/:waveId/scan', 
  authenticate, 
  hasPermission('picking:execute'), 
  checkAvailability, 
  PickingController.scanItem
);

router.post('/:waveId/partial', 
  authenticate, 
  hasPermission('picking:execute'), 
  checkAvailability, 
  PickingController.reportPartialPick
);

router.post('/:waveId/complete', 
  authenticate, 
  hasPermission('picking:execute'), 
  checkAvailability, 
  PickingController.completePicking
);

// Monitoring
router.get('/sla-status', 
  authenticate, 
  hasPermission('picking:view'), 
  PickingController.getSlaStatus
);

router.get('/expiry-alerts', 
  authenticate, 
  hasPermission('picking:view'), 
  PickingController.getExpiryAlerts
);

export default router;

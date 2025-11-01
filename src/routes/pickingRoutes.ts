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
  PickingController.generateWaves
);

router.get('/assign', 
  authenticate, 
  hasPermission('picklist-view'), 
  PickingController.assignWaves
);

router.post('/assign', 
  // Removed authentication middleware for automated assignment
  PickingController.assignWaveToPicker
);

router.post('/reassign', 
  authenticate, 
  hasPermission('picklist-create'), 
  PickingController.reassignWaveToPicker
);

router.get('/available', 
  authenticate, 
  hasPermission('picklist-view'), 
  PickingController.getAvailableWaves
);

// Picker Operations
router.post('/:waveId/start', 
  authenticate, 
  hasPermission('picklist-create'), 
  checkAvailability, 
  PickingController.startPicking
);

router.get('/:waveId/items', 
  authenticate, 
  hasPermission('picklist-view'), 
  PickingController.getPicklistItems
);

router.post('/:waveId/items/create', 
  authenticate, 
  hasPermission('picklist-create'), 
  PickingController.createPicklistItems
);

router.post('/:waveId/scan', 
  authenticate, 
  hasPermission('picklist-create'), 
  checkAvailability, 
  PickingController.scanItem
);

// New scanning routes for bin location and SKU validation
router.post('/:waveId/scan/binLocation', 
  authenticate, 
  hasPermission('picklist-create'), 
  checkAvailability, 
  PickingController.scanBinLocation
);

router.post('/:waveId/scan/sku', 
  authenticate, 
  hasPermission('picklist-create'), 
  checkAvailability, 
  PickingController.scanSku
);

router.post('/:waveId/partial', 
  authenticate, 
  hasPermission('picklist-create'), 
  checkAvailability, 
  PickingController.reportPartialPick
);

router.post('/:waveId/complete', 
  authenticate, 
  hasPermission('picklist-create'), 
  checkAvailability, 
  PickingController.completePicking
);

// Monitoring
router.get('/sla-status', 
  authenticate, 
  hasPermission('picklist-view'), 
  PickingController.getSlaStatus
);

router.get('/expiry-alerts', 
  authenticate, 
  hasPermission('picklist-view'), 
  PickingController.getExpiryAlerts
);

export default router;

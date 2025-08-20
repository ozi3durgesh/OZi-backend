import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouseController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all warehouse routes
router.use(authenticate);

// Warehouse Management Routes
router.post('/', validateRequest, WarehouseController.createWarehouse);
router.get('/', WarehouseController.getWarehouses);
router.get('/:id', WarehouseController.getWarehouseById);
router.put('/:id', validateRequest, WarehouseController.updateWarehouse);
router.patch('/:id/status', validateRequest, WarehouseController.updateWarehouseStatus);
router.delete('/:id', WarehouseController.deleteWarehouse);

// Zone Management Routes
router.post('/:warehouseId/zones', validateRequest, WarehouseController.createZone);
router.get('/:warehouseId/zones', WarehouseController.getWarehouseZones);
router.put('/zones/:zoneId', validateRequest, WarehouseController.updateZone);
router.delete('/zones/:zoneId', WarehouseController.deleteZone);

// Staff Assignment Routes
router.post('/:warehouseId/staff', validateRequest, WarehouseController.assignStaff);
router.get('/:warehouseId/staff', WarehouseController.getWarehouseStaff);
router.delete('/staff-assignments/:assignmentId', WarehouseController.removeStaffAssignment);

export default router;

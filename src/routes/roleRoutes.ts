// routes/roleRoutes.ts
import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { authenticate, hasPermission } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All role routes require version check, authentication, and permissions
router.use(versionCheck);
router.use(authenticate);

router.post('/', hasPermission('roles-create'), RoleController.createRole);
router.post('/assign-permissions', hasPermission('roles-edit'), RoleController.assignPermissions);
router.get('/', hasPermission('roles-view'), RoleController.listRoles);

export default router;
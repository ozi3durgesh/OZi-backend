// routes/roleRoutes.ts
import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { authenticate, hasPermission } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All role routes require version check, authentication, and admin permissions
router.use(versionCheck);
router.use(authenticate, hasPermission('users_roles:manage'));

router.post('/', RoleController.createRole);
router.post('/assign-permissions', RoleController.assignPermissions);
router.get('/', RoleController.listRoles);

export default router;
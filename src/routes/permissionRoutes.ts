// routes/permissionRoutes.ts
import { Router } from 'express';
import { PermissionController } from '../controllers/permissionController';
import { authenticate, hasPermission } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All permission routes require version check, authentication, and admin permissions
router.use(versionCheck);
router.use(authenticate, hasPermission('users_roles:manage'));

router.post('/', PermissionController.createPermission);
router.get('/', PermissionController.listPermissions);

export default router;
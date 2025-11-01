// routes/permissionRoutes.ts
import { Router } from 'express';
import { PermissionController } from '../controllers/permissionController';
import { authenticate, hasPermission } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All permission routes require version check, authentication, and permissions
router.use(versionCheck);
router.use(authenticate);

router.post('/', hasPermission('permissions-create'), PermissionController.createPermission);
router.get('/', hasPermission('permissions-view'), PermissionController.listPermissions);

export default router;
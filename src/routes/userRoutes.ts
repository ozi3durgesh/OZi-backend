// routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, hasPermission } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All user routes require version check and authentication
router.use(versionCheck);
router.use(authenticate);

router.post('/', 
  hasPermission('users-create'), 
  UserController.createUser
);

router.get('/', 
  hasPermission('users-view'), 
  UserController.listUsers
);

router.put('/:userId/status', 
  hasPermission('users-edit'), 
  UserController.updateUserStatus
);

router.put('/:userId/role', 
  hasPermission('users-edit'), 
  UserController.changeUserRole
);

router.delete('/:userId', 
  hasPermission('users-delete'), 
  UserController.deactivateUser
);

router.put('/:userId/toggle-status', 
  hasPermission('users-edit'), 
  UserController.toggleUserStatus
);

// Self-management endpoint - no admin permission required
router.post('/self/isActive', 
  UserController.selfManageStatus
);

export default router;
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
  hasPermission('users_roles:manage'), 
  UserController.createUser
);

router.get('/', 
  hasPermission('users_roles:manage'), 
  UserController.listUsers
);

router.put('/:userId/status', 
  UserController.updateUserStatus
);

router.put('/:userId/role', 
  hasPermission('users_roles:manage'), 
  UserController.changeUserRole
);

router.delete('/:userId', 
  hasPermission('users_roles:manage'), 
  UserController.deactivateUser
);

export default router;
// routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, hasPermission } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

// All auth routes require version check
// router.use(versionCheck);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route test endpoint working' });
});

router.get('/system-status', AuthController.checkSystemStatus);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/select-dc', authenticate, AuthController.selectDc);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.post('/logout/:userId', authenticate, hasPermission('users_roles:manage'), AuthController.logoutUser);
router.get('/roles', AuthController.getRoles);
router.get('/profile', authenticate, AuthController.getProfile);

export default router;
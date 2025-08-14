import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { versionCheck } from '../middleware/versionCheck';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', versionCheck, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/profile', authenticate, AuthController.getProfile);

export default router;
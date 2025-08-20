"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const versionCheck_1 = require("../middleware/versionCheck");
const router = (0, express_1.Router)();
router.use(versionCheck_1.versionCheck);
router.get('/test', (req, res) => {
    res.json({ message: 'Auth route test endpoint working' });
});
router.get('/system-status', authController_1.AuthController.checkSystemStatus);
router.post('/register', authController_1.AuthController.register);
router.post('/login', authController_1.AuthController.login);
router.post('/refresh-token', authController_1.AuthController.refreshToken);
router.get('/roles', authController_1.AuthController.getRoles);
router.get('/profile', auth_1.authenticate, authController_1.AuthController.getProfile);
exports.default = router;

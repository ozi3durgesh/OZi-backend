"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionCheck = void 0;
const responseHandler_1 = require("./responseHandler");
const versionCheck = (req, res, next) => {
    try {
        const source = req.headers['source'];
        const appVersion = req.headers['app-version'];
        const minVersion = process.env.MIN_APP_VERSION || '1.0.0';
        if (source && source.toLowerCase() === 'mobile') {
            if (!appVersion) {
                responseHandler_1.ResponseHandler.error(res, 'App version is required for mobile users', 400);
                return;
            }
            const isLowerVersion = (v1, v2) => {
                const v1Parts = v1.split('.').map(Number);
                const v2Parts = v2.split('.').map(Number);
                for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
                    const a = v1Parts[i] || 0;
                    const b = v2Parts[i] || 0;
                    if (a < b)
                        return true;
                    if (a > b)
                        return false;
                }
                return false;
            };
            if (isLowerVersion(appVersion, minVersion)) {
                responseHandler_1.ResponseHandler.error(res, `Please update your app to version ${minVersion} or higher`, 426);
                return;
            }
        }
        next();
    }
    catch (error) {
        responseHandler_1.ResponseHandler.error(res, 'Version check failed', 500);
    }
};
exports.versionCheck = versionCheck;

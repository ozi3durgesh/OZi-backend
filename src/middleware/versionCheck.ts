import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from './responseHandler';

// Extend Request to include our custom props
interface VersionCheckRequest extends Request {
  user?: any;
}

export const versionCheck = (
  req: VersionCheckRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const source = req.headers['source'] as string;
    const appVersion = req.headers['app-version'] as string;
    const minVersion = process.env.MIN_APP_VERSION || '1.0.0';

    if (source && source.toLowerCase() === 'mobile') {
      if (!appVersion) {
        ResponseHandler.error(res, 'App version is required for mobile users', 400);
        return;
      }

      // Simple semantic version compare
      const isLowerVersion = (v1: string, v2: string) => {
        const v1Parts = v1.split('.').map(Number);
        const v2Parts = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
          const a = v1Parts[i] || 0;
          const b = v2Parts[i] || 0;
          if (a < b) return true;
          if (a > b) return false;
        }
        return false;
      };

      if (isLowerVersion(appVersion, minVersion)) {
        ResponseHandler.error(res, `Please update your app to version ${minVersion} or higher`, 426);
        return;
      }
    }

    next();
  } catch (error) {
    ResponseHandler.error(res, 'Version check failed', 500);
  }
};

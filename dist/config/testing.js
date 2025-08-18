"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.isTestingMode = exports.testingConfig = void 0;
exports.testingConfig = {
    s3: {
        bucket: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
    },
    lms: {
        baseUrl: 'https://mock-lms.example.com/api',
        apiKey: 'test-lms-key',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 1000,
    },
    sealSecret: 'test-seal-secret-key',
    jwtSecret: 'test-jwt-secret-key',
};
const isTestingMode = () => {
    return process.env.NODE_ENV === 'test' ||
        process.env.TESTING === 'true' ||
        !process.env.S3_BUCKET ||
        !process.env.LMS_BASE_URL;
};
exports.isTestingMode = isTestingMode;
const getConfig = () => {
    if ((0, exports.isTestingMode)()) {
        return exports.testingConfig;
    }
    return {
        s3: {
            bucket: process.env.S3_BUCKET || '',
            region: process.env.S3_REGION || 'us-east-1',
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        lms: {
            baseUrl: process.env.LMS_BASE_URL || '',
            apiKey: process.env.LMS_API_KEY || '',
            timeout: parseInt(process.env.LMS_TIMEOUT || '30000'),
            retryAttempts: parseInt(process.env.LMS_RETRY_ATTEMPTS || '3'),
            retryDelay: parseInt(process.env.LMS_RETRY_DELAY || '1000'),
        },
        sealSecret: process.env.SEAL_SECRET || 'default-seal-secret',
        jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
    };
};
exports.getConfig = getConfig;

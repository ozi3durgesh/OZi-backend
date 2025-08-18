// config/testing.ts
import { S3Config, LMSIntegrationConfig } from '../types';

/**
 * Testing configuration that provides mock implementations
 * for external services when they're not available
 */
export const testingConfig = {
  // Mock S3 configuration for testing
  s3: {
    bucket: 'test-bucket',
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
  } as S3Config,

  // Mock LMS configuration for testing
  lms: {
    baseUrl: 'https://mock-lms.example.com/api',
    apiKey: 'test-lms-key',
    timeout: 5000,
    retryAttempts: 2,
    retryDelay: 1000,
  } as LMSIntegrationConfig,

  // Mock seal secret for testing
  sealSecret: 'test-seal-secret-key',

  // Mock JWT secret for testing
  jwtSecret: 'test-jwt-secret-key',
};

/**
 * Check if we're in testing mode
 */
export const isTestingMode = (): boolean => {
  return process.env.NODE_ENV === 'test' || 
         process.env.TESTING === 'true' ||
         !process.env.S3_BUCKET ||
         !process.env.LMS_BASE_URL;
};

/**
 * Get configuration based on environment
 */
export const getConfig = () => {
  if (isTestingMode()) {
    return testingConfig;
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

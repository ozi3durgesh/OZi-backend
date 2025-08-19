import { S3Config, LMSIntegrationConfig } from '../types';
export declare const testingConfig: {
    s3: S3Config;
    lms: LMSIntegrationConfig;
    sealSecret: string;
    jwtSecret: string;
};
export declare const isTestingMode: () => boolean;
export declare const getConfig: () => {
    s3: S3Config;
    lms: LMSIntegrationConfig;
    sealSecret: string;
    jwtSecret: string;
};

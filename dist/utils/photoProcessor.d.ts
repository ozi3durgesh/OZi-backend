import AWS from 'aws-sdk';
export interface PhotoUploadResult {
    photoUrl: string;
    thumbnailUrl?: string;
    metadata: {
        timestamp: Date;
        location?: string;
        device?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
}
export interface S3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}
export declare class PhotoProcessor {
    private s3;
    private bucket;
    private region;
    constructor(config: S3Config);
    uploadPhoto(photoBuffer: Buffer, jobId: number, photoType: string, metadata: {
        location?: string;
        device?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    }): Promise<PhotoUploadResult>;
    generateSignedUrl(photoKey: string, expirationSeconds?: number): Promise<string>;
    deletePhoto(photoKey: string): Promise<void>;
    private generatePhotoKey;
    private generateThumbnailKey;
    private generateThumbnail;
    static validateMetadata(metadata: any): boolean;
    static extractMetadataFromS3(s3Object: AWS.S3.Object): {
        jobId: number;
        photoType: string;
        timestamp: Date;
        location?: string;
        device?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
}

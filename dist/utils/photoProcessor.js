"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoProcessor = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
class PhotoProcessor {
    s3;
    bucket;
    region;
    constructor(config) {
        this.bucket = config.bucket;
        this.region = config.region;
        this.s3 = new aws_sdk_1.default.S3({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region: config.region,
        });
    }
    async uploadPhoto(photoBuffer, jobId, photoType, metadata) {
        try {
            const timestamp = new Date();
            const photoKey = this.generatePhotoKey(jobId, photoType, timestamp);
            const uploadResult = await this.s3.upload({
                Bucket: this.bucket,
                Key: photoKey,
                Body: photoBuffer,
                ContentType: 'image/jpeg',
                Metadata: {
                    jobId: jobId.toString(),
                    photoType,
                    timestamp: timestamp.toISOString(),
                    location: metadata.location || '',
                    device: metadata.device || '',
                    coordinates: metadata.coordinates ? JSON.stringify(metadata.coordinates) : '',
                },
            }).promise();
            const thumbnailKey = this.generateThumbnailKey(photoKey);
            const thumbnailBuffer = await this.generateThumbnail(photoBuffer);
            if (thumbnailBuffer) {
                await this.s3.upload({
                    Bucket: this.bucket,
                    Key: thumbnailKey,
                    Body: thumbnailBuffer,
                    ContentType: 'image/jpeg',
                    Metadata: {
                        jobId: jobId.toString(),
                        photoType: `${photoType}_THUMBNAIL`,
                        timestamp: timestamp.toISOString(),
                    },
                }).promise();
            }
            return {
                photoUrl: uploadResult.Location,
                thumbnailUrl: thumbnailBuffer ? `${this.s3.endpoint.href}${this.bucket}/${thumbnailKey}` : undefined,
                metadata: {
                    timestamp,
                    location: metadata.location,
                    device: metadata.device,
                    coordinates: metadata.coordinates,
                },
            };
        }
        catch (error) {
            console.error('Error uploading photo:', error);
            throw new Error('Failed to upload photo');
        }
    }
    async generateSignedUrl(photoKey, expirationSeconds = 3600) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: photoKey,
                Expires: expirationSeconds,
            };
            return await this.s3.getSignedUrlPromise('getObject', params);
        }
        catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    }
    async deletePhoto(photoKey) {
        try {
            const thumbnailKey = this.generateThumbnailKey(photoKey);
            await Promise.all([
                this.s3.deleteObject({ Bucket: this.bucket, Key: photoKey }).promise(),
                this.s3.deleteObject({ Bucket: this.bucket, Key: thumbnailKey }).promise(),
            ]);
        }
        catch (error) {
            console.error('Error deleting photo:', error);
            throw new Error('Failed to delete photo');
        }
    }
    generatePhotoKey(jobId, photoType, timestamp) {
        const date = timestamp.toISOString().split('T')[0];
        const uniqueId = (0, uuid_1.v4)().replace(/-/g, '');
        return `packing/${jobId}/${photoType}/${date}/${uniqueId}.jpg`;
    }
    generateThumbnailKey(photoKey) {
        const parts = photoKey.split('.');
        const extension = parts.pop();
        return `${parts.join('.')}_thumb.${extension}`;
    }
    async generateThumbnail(photoBuffer) {
        try {
            return null;
        }
        catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    }
    static validateMetadata(metadata) {
        if (!metadata.timestamp) {
            return false;
        }
        if (metadata.coordinates) {
            const { lat, lng } = metadata.coordinates;
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                return false;
            }
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return false;
            }
        }
        return true;
    }
    static extractMetadataFromS3(s3Object) {
        const metadata = s3Object.Metadata || {};
        let coordinates;
        if (metadata.coordinates) {
            try {
                coordinates = JSON.parse(metadata.coordinates);
            }
            catch (error) {
                console.warn('Invalid coordinates in S3 metadata');
            }
        }
        return {
            jobId: parseInt(metadata.jobId || '0'),
            photoType: metadata.photoType || '',
            timestamp: new Date(metadata.timestamp || Date.now()),
            location: metadata.location || undefined,
            device: metadata.device || undefined,
            coordinates,
        };
    }
}
exports.PhotoProcessor = PhotoProcessor;

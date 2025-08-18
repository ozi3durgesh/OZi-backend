// utils/photoProcessor.ts
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { PhotoEvidenceCreationAttributes } from '../types';

export interface PhotoUploadResult {
  photoUrl: string;
  thumbnailUrl?: string;
  metadata: {
    timestamp: Date;
    location?: string;
    device?: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class PhotoProcessor {
  private s3: AWS.S3;
  private bucket: string;
  private region: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.region = config.region;
    
    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    });
  }

  /**
   * Upload photo to S3 with metadata
   */
  async uploadPhoto(
    photoBuffer: Buffer,
    jobId: number,
    photoType: string,
    metadata: {
      location?: string;
      device?: string;
      coordinates?: { lat: number; lng: number };
    }
  ): Promise<PhotoUploadResult> {
    try {
      const timestamp = new Date();
      const photoKey = this.generatePhotoKey(jobId, photoType, timestamp);
      
      // Upload original photo
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

      // Generate thumbnail (simplified - in production you'd use sharp or similar)
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
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  }

  /**
   * Generate signed URL for photo access
   */
  async generateSignedUrl(photoKey: string, expirationSeconds: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: photoKey,
        Expires: expirationSeconds,
      };

      return await this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Delete photo and thumbnail from S3
   */
  async deletePhoto(photoKey: string): Promise<void> {
    try {
      const thumbnailKey = this.generateThumbnailKey(photoKey);
      
      // Delete both original and thumbnail
      await Promise.all([
        this.s3.deleteObject({ Bucket: this.bucket, Key: photoKey }).promise(),
        this.s3.deleteObject({ Bucket: this.bucket, Key: thumbnailKey }).promise(),
      ]);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw new Error('Failed to delete photo');
    }
  }

  /**
   * Generate photo key for S3
   */
  private generatePhotoKey(jobId: number, photoType: string, timestamp: Date): string {
    const date = timestamp.toISOString().split('T')[0];
    const uniqueId = uuidv4().replace(/-/g, '');
    
    return `packing/${jobId}/${photoType}/${date}/${uniqueId}.jpg`;
  }

  /**
   * Generate thumbnail key for S3
   */
  private generateThumbnailKey(photoKey: string): string {
    const parts = photoKey.split('.');
    const extension = parts.pop();
    return `${parts.join('.')}_thumb.${extension}`;
  }

  /**
   * Generate thumbnail from photo buffer (simplified implementation)
   * In production, use sharp or similar library for proper image processing
   */
  private async generateThumbnail(photoBuffer: Buffer): Promise<Buffer | null> {
    try {
      // This is a simplified implementation
      // In production, you would use sharp or similar to resize the image
      // For now, we'll return null to indicate no thumbnail
      return null;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Validate photo metadata
   */
  static validateMetadata(metadata: any): boolean {
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

  /**
   * Extract photo metadata from S3 object
   */
  static extractMetadataFromS3(s3Object: AWS.S3.Object): {
    jobId: number;
    photoType: string;
    timestamp: Date;
    location?: string;
    device?: string;
    coordinates?: { lat: number; lng: number };
  } {
    const metadata = (s3Object as any).Metadata || {};
    
    let coordinates;
    if (metadata.coordinates) {
      try {
        coordinates = JSON.parse(metadata.coordinates);
      } catch (error) {
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

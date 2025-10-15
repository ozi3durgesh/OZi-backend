import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const s3Client = new S3Client({
  region: 'ap-south-1', // Mumbai region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class S3Service {
  private static readonly BUCKET_NAME = 'oms-stage-storage';
  private static readonly REGION = 'ap-south-1';

  // Multer configuration for FormData uploads
  static readonly upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed') as any, false);
      }
    }
  });

  /**
   * Upload base64 image to S3
   * @param base64Data - Base64 encoded image data
   * @param fileName - Optional custom filename
   * @param folder - Folder path in S3 bucket
   * @returns Promise<string> - S3 URL of uploaded image
   */
  static async uploadBase64Image(
    base64Data: string,
    fileName?: string,
    folder: string = 'grn-photos'
  ): Promise<string> {
    try {
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64String, 'base64');
      
      // Determine file extension from base64 data or default to jpg
      const extension = this.getFileExtensionFromBase64(base64Data) || 'jpg';
      
      // Generate unique filename
      const uniqueFileName = fileName ? 
        `${fileName}_${uuidv4()}.${extension}` : 
        `${uuidv4()}.${extension}`;
      
      // Create S3 key (path)
      const key = `${folder}/${uniqueFileName}`;
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: this.getContentTypeFromExtension(extension),
        // ACL removed - bucket doesn't allow ACLs
      });
      
      await s3Client.send(command);
      
      // Return the public URL
      return `https://${this.BUCKET_NAME}.s3.${this.REGION}.amazonaws.com/${key}`;
      
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error(`Failed to upload image to S3: ${error}`);
    }
  }

  /**
   * Upload file buffer to S3
   * @param buffer - File buffer
   * @param key - S3 key (path)
   * @param folder - Folder path in S3 bucket
   * @returns Promise<string> - S3 URL
   */
  static async uploadFile(
    buffer: Buffer,
    key: string,
    folder: string = 'dc-po-documents'
  ): Promise<string> {
    try {
      // Create S3 key with folder
      const s3Key = `${folder}/${key}`;
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: 'application/pdf',
      });
      
      await s3Client.send(command);
      
      // Return the public URL
      return `https://${this.BUCKET_NAME}.s3.${this.REGION}.amazonaws.com/${s3Key}`;
      
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  /**
   * Upload brand image to S3
   * @param buffer - File buffer
   * @param fileName - Filename
   * @param contentType - MIME type
   * @returns Promise<string> - S3 signed URL
   */
  static async uploadBrandImage(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      // Create S3 key - directly in brand-images folder
      const s3Key = `brand-images/${fileName}`;
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      });
      
      await s3Client.send(command);
      
      // Return the signed URL (valid for 7 days)
      return await this.getSignedUrl(s3Key);
      
    } catch (error) {
      console.error('Error uploading brand image to S3:', error);
      throw new Error(`Failed to upload brand image to S3: ${error}`);
    }
  }

  /**
   * Upload file buffer to S3 and return signed URL
   * @param buffer - File buffer
   * @param key - S3 key (path)
   * @param folder - Folder path in S3 bucket
   * @returns Promise<string> - Signed S3 URL
   */
  static async uploadFileWithSignedUrl(
    buffer: Buffer,
    key: string,
    folder: string = 'dc-po-documents'
  ): Promise<string> {
    try {
      // Create S3 key with folder
      const s3Key = `${folder}/${key}`;
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: 'application/pdf',
      });
      
      await s3Client.send(command);
      
      // Generate signed URL (valid for 7 days)
      const getCommand = new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: s3Key,
      });
      
      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 }); // 7 days
      return signedUrl;
      
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  /**
   * Upload single base64 image to S3 for SKU
   * @param image - Base64 image data
   * @param skuId - SKU ID for folder organization
   * @returns Promise<string> - S3 URL
   */
  static async uploadSkuBase64Image(
    image: string,
    skuId: string
  ): Promise<string> {
    try {
      return await this.uploadBase64Image(image, skuId, `grn-sku-rejection/${skuId}`);
    } catch (error) {
      console.error('Error uploading SKU image to S3:', error);
      throw new Error(`Failed to upload image for SKU ${skuId} to S3: ${error}`);
    }
  }

  /**
   * Upload multiple base64 images to S3
   * @param images - Array of base64 image data
   * @param skuId - SKU ID for folder organization
   * @returns Promise<string[]> - Array of S3 URLs
   */
  static async uploadMultipleBase64Images(
    images: string[],
    skuId: string
  ): Promise<string[]> {
    try {
      const uploadPromises = images.map((image, index) => 
        this.uploadBase64Image(image, `${skuId}_${index + 1}`, `grn-sku-rejection/${skuId}`)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images to S3:', error);
      throw new Error(`Failed to upload images to S3: ${error}`);
    }
  }

  /**
   * Extract file extension from base64 data URL
   * @param base64Data - Base64 data URL
   * @returns string | null - File extension
   */
  private static getFileExtensionFromBase64(base64Data: string): string | null {
    const match = base64Data.match(/^data:image\/([a-z]+);base64,/);
    return match ? match[1] : null;
  }

  /**
   * Get content type from file extension
   * @param extension - File extension
   * @returns string - MIME type
   */
  private static getContentTypeFromExtension(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
    };
    
    return contentTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Upload FormData file to S3
   * @param file - Multer file object from FormData
   * @param skuId - SKU ID for folder organization
   * @param fileName - Optional custom filename
   * @returns Promise<string> - S3 URL of uploaded image
   */
  static async uploadFormDataImage(
    file: Express.Multer.File,
    skuId: string,
    fileName?: string
  ): Promise<string> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Get file extension from original filename
      const extension = file.originalname.split('.').pop() || 'jpg';
      
      // Generate unique filename
      const uniqueFileName = fileName ? 
        `${fileName}_${uuidv4()}.${extension}` : 
        `${uuidv4()}.${extension}`;
      
      // Create S3 key (path) - upload to grn-sku-rejection folder
      const key = `grn-sku-rejection/${skuId}/${uniqueFileName}`;
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL removed - bucket doesn't allow ACLs
      });
      
      await s3Client.send(command);
      
      // Return the public URL
      return `https://${this.BUCKET_NAME}.s3.${this.REGION}.amazonaws.com/${key}`;
      
    } catch (error) {
      console.error('Error uploading FormData image to S3:', error);
      throw new Error(`Failed to upload image to S3: ${error}`);
    }
  }

  /**
   * Upload multiple FormData files to S3
   * @param files - Array of Multer file objects
   * @param skuId - SKU ID for folder organization
   * @returns Promise<string[]> - Array of S3 URLs
   */
  static async uploadMultipleFormDataImages(
    files: Express.Multer.File[],
    skuId: string
  ): Promise<string[]> {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const uploadPromises = files.map((file, index) => 
        this.uploadFormDataImage(file, skuId, `${skuId}_${index + 1}`)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple FormData images to S3:', error);
      throw new Error(`Failed to upload images to S3: ${error}`);
    }
  }

  /**
   * Generate a signed URL for an S3 object
   * @param key - S3 object key (path)
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Promise<string> - Signed URL
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error}`);
    }
  }

  /**
   * Generate signed URL from existing S3 URL
   * @param s3Url - Existing S3 URL
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Promise<string> - Signed URL
   */
  static async getSignedUrlFromExistingUrl(s3Url: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Extract key from URL
      const url = new URL(s3Url);
      const key = url.pathname.substring(1); // Remove leading slash
      
      return await this.getSignedUrl(key, expiresIn);
    } catch (error) {
      console.error('Error generating signed URL from existing URL:', error);
      throw new Error(`Failed to generate signed URL from existing URL: ${error}`);
    }
  }

  /**
   * Upload base64 image to S3 and return signed URL
   * @param base64Data - Base64 encoded image data
   * @param fileName - Optional custom filename
   * @param folder - Folder path in S3 bucket
   * @returns Promise<string> - Signed S3 URL of uploaded image
   */
  static async uploadBase64ImageWithSignedUrl(
    base64Data: string,
    fileName?: string,
    folder: string = 'grn-photos'
  ): Promise<string> {
    try {
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64String, 'base64');
      
      // Determine file extension from base64 data or default to jpg
      const extension = this.getFileExtensionFromBase64(base64Data) || 'jpg';
      
      // Generate unique filename
      const uniqueFileName = fileName ? 
        `${fileName}_${uuidv4()}.${extension}` : 
        `${uuidv4()}.${extension}`;
      
      // Create S3 key (path)
      const key = `${folder}/${uniqueFileName}`;
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: this.getContentTypeFromExtension(extension),
        // ACL removed - bucket doesn't allow ACLs
      });
      
      await s3Client.send(command);
      
      // Return the signed URL instead of public URL
      return await this.getSignedUrl(key);
      
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error(`Failed to upload image to S3: ${error}`);
    }
  }

  /**
   * Upload FormData file to S3 and return signed URL
   * @param file - Multer file object from FormData
   * @param skuId - SKU ID for folder organization
   * @param fileName - Optional custom filename
   * @returns Promise<string> - Signed S3 URL of uploaded image
   */
  static async uploadFormDataImageWithSignedUrl(
    file: Express.Multer.File,
    skuId: string,
    fileName?: string
  ): Promise<string> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Get file extension from original filename
      const extension = file.originalname.split('.').pop() || 'jpg';
      
      // Generate unique filename
      const uniqueFileName = fileName ? 
        `${fileName}_${uuidv4()}.${extension}` : 
        `${uuidv4()}.${extension}`;
      
      // Create S3 key (path) - upload to grn-sku-rejection folder
      const key = `grn-sku-rejection/${skuId}/${uniqueFileName}`;
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL removed - bucket doesn't allow ACLs
      });
      
      await s3Client.send(command);
      
      // Return the signed URL instead of public URL
      return await this.getSignedUrl(key);
      
    } catch (error) {
      console.error('Error uploading FormData image to S3:', error);
      throw new Error(`Failed to upload image to S3: ${error}`);
    }
  }

  /**
   * Upload multiple FormData files to S3 and return signed URLs
   * @param files - Array of Multer file objects
   * @param skuId - SKU ID for folder organization
   * @returns Promise<string[]> - Array of signed S3 URLs
   */
  static async uploadMultipleFormDataImagesWithSignedUrls(
    files: Express.Multer.File[],
    skuId: string
  ): Promise<string[]> {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const uploadPromises = files.map((file, index) => 
        this.uploadFormDataImageWithSignedUrl(file, skuId, `${skuId}_${index + 1}`)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple FormData images to S3:', error);
      throw new Error(`Failed to upload images to S3: ${error}`);
    }
  }

  /**
   * Validate base64 image data
   * @param base64Data - Base64 data to validate
   * @returns boolean - Whether the data is valid
   */
  static validateBase64Image(base64Data: string): boolean {
    try {
      // Check if it's a valid base64 string
      const base64Regex = /^data:image\/([a-z]+);base64,([A-Za-z0-9+/=]+)$/;
      return base64Regex.test(base64Data);
    } catch (error) {
      return false;
    }
  }
}

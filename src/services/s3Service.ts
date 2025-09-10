import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

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

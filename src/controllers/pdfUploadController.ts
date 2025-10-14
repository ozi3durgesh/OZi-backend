import { Request, Response } from 'express';
import { S3Service } from '../services/s3Service';
import { ResponseHandler } from '../middleware/responseHandler';

export class PdfUploadController {
  /**
   * Upload PDF file to S3 and return URL
   * POST /api/upload/pdf/vrf
   * Body: FormData with 'file' field
   */
  static async uploadPdf(req: Request, res: Response) {
    try {
      if (!req.file) {
        return ResponseHandler.error(res, 'No file uploaded', 400);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = req.file.originalname;
      const fileExtension = originalName.split('.').pop();
      const fileName = `vrf-documents/${timestamp}-${originalName}`;

      // Upload to S3
      const s3Url = await S3Service.uploadFile(
        req.file.buffer,
        fileName,
        'vrf-documents'
      );

      return ResponseHandler.success(res, {
        message: 'PDF uploaded successfully',
        data: {
          fileName: originalName,
          s3Url: s3Url,
          uploadedAt: new Date().toISOString(),
          fileSize: req.file.size
        }
      }, 200);

    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      return ResponseHandler.error(res, error.message || 'Failed to upload PDF', 500);
    }
  }
}

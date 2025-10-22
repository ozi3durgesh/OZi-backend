import { Request, Response } from 'express';
import FCGrnPhoto from '../models/FCGrnPhoto';
import FCGrnLine from '../models/FCGrnLine';
import FCGrn from '../models/FCGrn.model';
import { S3Service } from '../services/s3Service';
export interface CreateFCGrnPhotoRequest {
  grnLineId: number;
  grnBatchId?: number;
  photos: string[];
  reason?: string;
}

export class FCGrnPhotoController {
  /**
   * Upload FCGrn photos via FormData and return S3 URLs
   * POST /api/grn/photo/upload
   * Body: FormData with 'photos' field (single or multiple files)
   * Query: skuId (required)
   */
  static async uploadFCGrnPhotos(req: Request, res: Response) {
    try {
      const { skuId } = req.query;
      
      if (!skuId) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'skuId is required in query parameters',
        });
      }

      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'No files uploaded',
        });
      }

      // Upload files to S3 and get signed URLs
      const uploadedUrls = await S3Service.uploadMultipleFormDataImagesWithSignedUrls(
        Array.isArray(files) ? files : [files],
        skuId as string
      );

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          skuId: skuId,
          uploadedUrls: uploadedUrls,
          count: uploadedUrls.length,
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error uploading FCGrn photos:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async createFCGrnPhotos(req: Request, res: Response) {
    try {
      const { grnLineId, grnBatchId, photos, reason } = req.body;
      const created: any = [];

      // Get FCGrn Line and FCGrn information
      const grnLine = await FCGrnLine.findByPk(grnLineId);
      if (!grnLine) {
        return res.status(404).json({
          success: false,
          message: 'FCGrn Line not found',
        });
      }

      const grn = await FCGrn.findByPk(grnLine.grn_id);
      if (!grn) {
        return res.status(404).json({
          success: false,
          message: 'FCGrn not found',
        });
      }

      for (const url of photos) {
        const photo = await FCGrnPhoto.create({
          sku_id: grnLine.sku_id,
          grn_id: grnLine.grn_id,
          po_id: grn.po_id,
          url,
          reason: reason ?? 'general',
        });
        created.push(photo);
      }

      return res.status(201).json({
        statusCode: 201,
        success: true,
        data: created,
        error: null,
      });
    } catch (error: any) {
      console.error('Error creating FCGrn photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getFCGrnPhotos(req: Request, res: Response) {
    try {
      const photos = await FCGrnPhoto.findAll();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: photos,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn photos:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getFCGrnPhotoByLineId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Get the FCGrn Line to find the FCGrn ID
      const grnLine = await FCGrnLine.findByPk(id);
      if (!grnLine) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'FCGrn Line not found',
        });
      }
      
      const photos = await FCGrnPhoto.findAll({
        where: {
          grn_id: grnLine.grn_id,
        },
      });

      if (photos.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Photo not found',
        });
      }

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: photos,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
  static async getFCGrnPhotoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const photo = await FCGrnPhoto.findByPk(id);

      if (!photo) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Photo not found',
        });
      }

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: photo,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async deleteFCGrnPhoto(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await FCGrnPhoto.destroy({ where: { id } });

      if (!deleted) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Photo not found',
        });
      }

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: `Photo with ID ${id} deleted successfully`,
        error: null,
      });
    } catch (error: any) {
      console.error('Error deleting FCGrn photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  /**
   * Generate signed URLs for existing FCGrn photos
   * GET /api/grn/photo/signed-urls/:id
   */
  static async getSignedUrlsForPhoto(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const photo = await FCGrnPhoto.findByPk(id);

      if (!photo) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Photo not found',
        });
      }

      // Generate signed URL for the existing photo URL
      const signedUrl = await S3Service.getSignedUrlFromExistingUrl(photo.url);

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          id: photo.id,
          originalUrl: photo.url,
          signedUrl: signedUrl,
          expiresIn: 3600, // 1 hour
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error generating signed URL for photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  /**
   * Generate signed URLs for all photos in a FCGrn line
   * GET /api/grn/photo/signed-urls/line/:lineId
   */
  static async getSignedUrlsForGrnLine(req: Request, res: Response) {
    try {
      const { lineId } = req.params;
      
      // Get the FCGrn Line to find the FCGrn ID
      const grnLine = await FCGrnLine.findByPk(lineId);
      if (!grnLine) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'FCGrn Line not found',
        });
      }
      
      const photos = await FCGrnPhoto.findAll({
        where: {
          grn_id: grnLine.grn_id,
        },
      });

      if (photos.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'No photos found for this FCGrn line',
        });
      }

      // Generate signed URLs for all photos
      const photosWithSignedUrls = await Promise.all(
        photos.map(async (photo) => {
          try {
            const signedUrl = await S3Service.getSignedUrlFromExistingUrl(photo.url);
            return {
              ...photo.toJSON(),
              signedUrl: signedUrl,
              expiresIn: 3600, // 1 hour
            };
          } catch (error) {
            console.error(`Error generating signed URL for photo ${photo.id}:`, error);
            return {
              ...photo.toJSON(),
              signedUrl: null,
              error: 'Failed to generate signed URL',
            };
          }
        })
      );

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: photosWithSignedUrls,
        error: null,
      });
    } catch (error: any) {
      console.error('Error generating signed URLs for FCGrn line:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
}

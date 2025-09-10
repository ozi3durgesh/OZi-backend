import { Request, Response } from 'express';
import GRNPhoto from '../models/GrnPhoto';
import GRNLine from '../models/GrnLine';
import GRN from '../models/Grn.model';
export interface CreateGRNPhotoRequest {
  grnLineId: number;
  grnBatchId?: number;
  photos: string[];
  reason?: string;
}

export class GrnPhotoController {
  static async createGRNPhotos(req: Request, res: Response) {
    try {
      const { grnLineId, grnBatchId, photos, reason } = req.body;
      const created: any = [];

      // Get GRN Line and GRN information
      const grnLine = await GRNLine.findByPk(grnLineId);
      if (!grnLine) {
        return res.status(404).json({
          success: false,
          message: 'GRN Line not found',
        });
      }

      const grn = await GRN.findByPk(grnLine.grn_id);
      if (!grn) {
        return res.status(404).json({
          success: false,
          message: 'GRN not found',
        });
      }

      for (const url of photos) {
        const photo = await GRNPhoto.create({
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
      console.error('Error creating GRN photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getGrnPhotos(req: Request, res: Response) {
    try {
      const photos = await GRNPhoto.findAll();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: photos,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRN photos:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getGrnPhotoByLineId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Get the GRN Line to find the GRN ID
      const grnLine = await GRNLine.findByPk(id);
      if (!grnLine) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN Line not found',
        });
      }
      
      const photos = await GRNPhoto.findAll({
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
      console.error('Error fetching GRN photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
  static async getGrnPhotoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const photo = await GRNPhoto.findByPk(id);

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
      console.error('Error fetching GRN photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async deleteGrnPhoto(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await GRNPhoto.destroy({ where: { id } });

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
      console.error('Error deleting GRN photo:', error);
      return res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
}

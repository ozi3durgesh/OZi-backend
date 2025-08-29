import { Request, Response } from 'express';

import { User } from '../models';
import GRN from '../models/Grn.model';
import GRNPhoto from '../models/GrnPhoto';
import {
  AuthRequest,
  CreateGRNPhotoRequest,
  GRNFilters,
  GRNRequest,
} from '../types';

export class GrnController {
  static async createGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: GRNRequest = req.body;
      const userId = req.user?.id;
      console.log(data, userId);
      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }

      // Check if grn code already exists
      const existingGRN = await GRN.findOne({
        where: { po_id: data.po_id },
      });

      if (existingGRN) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'GRN code already exists',
        });
        return;
      }

      const grn = await GRN.create({
        ...data,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const createdGrn = await GRN.findByPk(grn.id, {
        include: [
          { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
        ],
      });
      console.log(createdGrn);
      res.status(201).json({
        statusCode: 201,
        success: true,
        data: createdGrn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error creating GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: error.message,
        error: 'Internal server error',
      });
    }
  }

  static async createGRNPhotos(req: Request, res: Response) {
    const data: CreateGRNPhotoRequest = req.body;
    const { grnLineId, grnBatchId, photos, reason } = data;
    const created: GRNPhoto[] = [];

    for (const url of photos) {
      const photo = await GRNPhoto.create({
        grn_line_id: grnLineId,
        grn_batch_id: grnBatchId,
        url,
        reason: reason ?? 'general',
      });
      created.push(photo);
    }
    return created;
  }

  static async getGrnDetails(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        po_id,
        page = 1,
        limit = 10,
        search,
      } = req.query as GRNFilters;

      const offset: number = (page - 1) * limit;
      const whereClause: any = {};

      // Apply filters
      if (status) whereClause.status = status;

      // Search functionality

      const { count, rows } = await GRN.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
        ],
        limit: parseInt(limit.toString()),
        offset,
        order: [['created_at', 'DESC']],
      });

      const totalPages = Math.ceil(count / limit);

      const response = {
        warehouses: rows,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: count,
          totalPages,
        },
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: response,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  static async getGrnById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const grn = await GRN.findByPk(id, {
        include: [
          { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
        ],
      });

      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async updateGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const grn = await GRN.findByPk(id);
      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      await grn.update({ ...updates, updated_at: new Date() });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error updating GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async updateGrnStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const grn = await GRN.findByPk(id);
      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      await grn.update({ status, updated_at: new Date() });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error updating GRN status:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async deleteGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const grn = await GRN.findByPk(id);
      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      await grn.destroy();

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: `GRN ${id} deleted successfully`,
        error: null,
      });
    } catch (error: any) {
      console.error('Error deleting GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
}

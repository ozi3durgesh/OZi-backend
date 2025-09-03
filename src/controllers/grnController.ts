import { Request, Response } from 'express';
import sequelize from '../config/database';
import GRNLine from '../models/GrnLine';
import GRNBatch from '../models/GrnBatch';
import { User } from '../models';
import GRN from '../models/Grn.model';
import GRNPhoto from '../models/GrnPhoto';
import {
  AuthRequest,
  CreateGRNPhotoRequest,
  GRNFilters,
  GRNRequest,
} from '../types';
interface CreateFullGRNInput {
  poId: number;
  lines: {
    skuId: string;

    orderedQty: number;
    receivedQty: number;
    ean?: string;
    qcPassQty?: number;
    heldQty?: number;
    rtvQty?: number;
    lineStatus?: string;
    batches?: {
      batchNo: string;
      expiry: Date;
      qty: number;
      photos?: { url: string; reason?: string }[];
    }[];
  }[];
}

export class GrnController {
  static async createGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: GRNRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }
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
  static async createFullGRN(req: AuthRequest, res: Response) {
    const input: CreateFullGRNInput = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        statusCode: 401,
        success: false,
        data: null,
        error: 'User not authenticated',
      });
      return;
    }
    const t = await sequelize.transaction();
    try {
      // 1. Create GRN
      const grn = await GRN.create(
        {
          po_id: input.poId,
          status: 'pending-qc',
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t }
      );

      // 2. Create GRN Lines
      for (const line of input.lines) {
        const grnLine = await GRNLine.create(
          {
            grn_id: grn.id,
            sku_id: line.skuId,
            ordered_qty: line.orderedQty,
            received_qty: line.receivedQty,
            qc_pass_qty: line.qcPassQty ?? line.receivedQty,
            qc_fail_qty: (line.heldQty ?? 0) + (line.rtvQty ?? 0),
            held_qty: line.heldQty ?? 0,
            rtv_qty: line.rtvQty ?? 0,
            line_status: line.lineStatus ?? 'pending',
          },
          { transaction: t }
        );

        if (line.batches && line.batches.length > 0) {
          for (const batch of line.batches) {
            const grnBatch = await GRNBatch.create(
              {
                grn_line_id: grnLine.id,
                batch_no: batch.batchNo,
                expiry_date: batch.expiry,
                qty: batch.qty,
              },
              { transaction: t }
            );

            if (batch.photos && batch.photos.length > 0) {
              for (const photo of batch.photos) {
                await GRNPhoto.create(
                  {
                    grn_line_id: grnLine.id,
                    grn_batch_id: grnBatch.id,
                    url: photo.url,
                    reason: photo.reason ?? 'general',
                  },
                  { transaction: t }
                );
              }
            }
          }
        }
      }

      await t.commit();
      const createdGrn = await GRN.findByPk(grn.id, {
        include: [
          { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
        ],
      });
      res.status(201).json({
        statusCode: 201,
        success: true,
        data: createdGrn,
        error: null,
      });
    } catch (err: any) {
      await t.rollback();
      console.error('Error creating GRN:', err);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: err.message,
        error: 'Internal server error',
      });
    }
  }

  // static async getGrnByPoId(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { poId } = req.params;

  //     const grn = await GRN.findOne({
  //       where: { po_id: poId },
  //       include: [
  //         { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
  //         { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
  //       ],
  //     });

  //     if (!grn) {
  //       res.status(404).json({
  //         statusCode: 404,
  //         success: false,
  //         data: null,
  //         error: `No GRN found for PO ID ${poId}`,
  //       });
  //       return;
  //     }
  //     const grlLines = await GRNLine.findAll({
  //       where: { grn_id: grn.id },
  //     });
  //     console.log({ grlLines });
  //     const batches = await GRNBatch.findAll({
  //       where: { grn_line_id: grlLines.map((line) => line.id) },
  //     });
  //     res.status(200).json({
  //       statusCode: 200,
  //       success: true,
  //       data: grn,
  //       error: null,
  //     });
  //   } catch (error: any) {
  //     console.error('Error fetching GRN by PO ID:', error);
  //     res.status(500).json({
  //       statusCode: 500,
  //       success: false,
  //       data: null,
  //       error: error.message,
  //     });
  //   }
  // }
  static async getGrnsByPoIdWithDetails(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { poId } = req.params;

      const grns = await GRN.findAll({
        where: { po_id: poId },
        include: [
          { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
          {
            model: GRNLine,
            as: 'Line',
            include: [
              {
                model: GRNBatch,
                as: 'Batches',
                include: [
                  {
                    model: GRNPhoto,
                    as: 'Photos',
                    attributes: ['id', 'url', 'reason'],
                  },
                ],
              },
            ],
          },
        ],
        order: [
          ['created_at', 'DESC'],
          [{ model: GRNLine, as: 'Line' }, 'id', 'ASC'],
          [
            { model: GRNLine, as: 'Line' },
            { model: GRNBatch, as: 'Batches' },
            'id',
            'ASC',
          ],
          [
            { model: GRNLine, as: 'Line' },
            { model: GRNBatch, as: 'Batches' },
            { model: GRNPhoto, as: 'Photos' },
            'id',
            'ASC',
          ],
        ],
      });

      if (!grns || grns.length === 0) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: `No GRNs found for PO ID ${poId}`,
        });
        return;
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grns,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRNs with details:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
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
        grn: rows,
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

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
import { Op } from 'sequelize';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
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
        status: data.status || 'partial',
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
      for (const line of input.lines) {
        const existingLine = await GRNLine.findOne({
          include: [
            {
              model: GRN,
              as: 'Grn',
              where: { po_id: input.poId },
            },
          ],
          where: { sku_id: line.skuId },
          transaction: t,
        });

        if (existingLine) {
          await t.rollback();
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `GRN already exists for PO ${input.poId} and SKU ${line.skuId}`,
          });
          return;
        }
      }

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
            line_status:
              line.receivedQty === 0
                ? 'pending'
                : line.orderedQty === line.receivedQty
                  ? 'completed'
                  : 'partial',
          },
          { transaction: t }
        );
        await POProduct.update(
          { grnStatus: 'created' },
          {
            where: {
              sku_id: line.skuId,
              id: input.poId,
            },
            transaction: t,
          }
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
  static async getGrnStats(req: Request, res: Response): Promise<void> {
    try {
      // 1. Total GRNs
      const totalGrns = await GRN.count();

      const grnsWithVariance = await GRN.count({
        where: {
          status: 'partial',
        },
      });
      console.log({ grnsWithVariance });
      // 3. Pending QC
      const pendingQc = await GRN.count({
        where: { status: 'pending-qc' },
      });

      // 4. RTV Initiated
      const rtvInitiated = await GRN.count({
        where: { status: 'rtv-initiated' },
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          totalGrns,
          grnsWithVariance,
          pendingQc,
          rtvInitiated,
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRN stats:', error);
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
        startDate,
        endDate,
      } = req.query as GRNFilters;

      const offset: number = (page - 1) * limit;
      const whereClause: any = {};

      if (status) whereClause.status = status;

      if (po_id) whereClause.po_id = po_id;
      if (startDate && endDate) {
        whereClause.created_at = {
          [Op.between]: [
            new Date(startDate as string),
            new Date(endDate as string),
          ],
        };
      }

      const { count, rows } = await GRN.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: PurchaseOrder,
            as: 'PO',
            attributes: ['id', 'po_id', 'vendor_name'],
            where: search ? { vendor_name: { [Op.like]: `%${search}%` } } : {},
          },
          {
            model: GRNLine,
            as: 'Line',
            attributes: [
              'id',
              'sku_id',
              'ordered_qty',
              'received_qty',
              'qc_pass_qty',
              'qc_fail_qty',
              'rtv_qty',
              'held_qty',
            ],
          },
          { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
        ],
        limit: Number(limit),
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

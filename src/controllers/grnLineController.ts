import { Request, Response } from 'express';
import GRNLine from '../models/GrnLine';
import { CreateGRNLineRequest } from '../types';
import GRNBatch from '../models/GrnBatch';
import GRNPhoto from '../models/GrnPhoto';
import GRN from '../models/Grn.model';
export interface CreateGRNLineInput {
  grnId: number;

  lines: {
    skuId: string;
    orderedQty: number;
    receivedQty: number;
    qcPassQty?: number;
    heldQty?: number;
    rtvQty?: number;
    lineStatus?: string;

    batches?: {
      batchNo: string;
      expiry: Date;
      qty: number;

      photos?: {
        url: string;
        reason?: string;
      }[];
    }[];
  }[];
}

export class GrnLineController {
  static async createGrnLineByGrnId(
    req: Request,
    res: Response
  ): Promise<void> {
    const t = await GRNLine.sequelize?.transaction(); // transaction for atomicity
    try {
      const data: CreateGRNLineInput = req.body;
      const { grnId, lines } = data;

      if (!grnId || !lines || lines.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Missing GRN ID or lines',
        });
        return;
      }

      const createdLines: any = [];

      for (const line of lines) {
        const qcFailQty = (line.heldQty ?? 0) + (line.rtvQty ?? 0);

        if ((line.qcPassQty ?? 0) + qcFailQty !== line.receivedQty) {
          throw new Error(
            `Validation failed for SKU ${line.skuId}: qcPassQty + qcFailQty must equal receivedQty`
          );
        }

        const grnLine = await GRNLine.create(
          {
            grn_id: grnId,
            sku_id: line.skuId,
            ordered_qty: line.orderedQty,
            received_qty: line.receivedQty,
            qc_pass_qty: line.qcPassQty ?? line.receivedQty,
            qc_fail_qty: qcFailQty,
            held_qty: line.heldQty ?? 0,
            rtv_qty: line.rtvQty ?? 0,
            line_status: line.lineStatus ?? 'PENDING',
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

        createdLines.push(grnLine);
      }

      await t?.commit();

      res.status(201).json({
        success: true,
        message: 'GRN lines created successfully',
        data: createdLines,
      });
    } catch (error: any) {
      await t?.rollback();
      console.error('Error creating GRN lines:', error);
      res.status(500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    }
  }
  static async getGrnLineByGrnId(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const grnLines = await GRNLine.findAll({
        where: { grn_id: id },
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
        order: [['id', 'ASC']],
      });

      if (!grnLines || grnLines.length === 0) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: `No GRN Lines found for GRN ID ${id}`,
        });
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grnLines,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRN Lines:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getGrnLineById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const line = await GRNLine.findByPk(id, {
        include: [
          {
            model: GRN,
            as: 'Grn',
            attributes: ['id', 'po_id', 'status'],
          },
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
            attributes: ['id', 'batch_no', 'expiry_date', 'qty'],
          },
        ],
      });

      if (!line) {
        return res.status(404).json({
          success: false,
          message: 'GRN Line not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'GRN Line fetched successfully',
        data: line,
      });
    } catch (error: any) {
      console.error('Error fetching GRN Line:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  }
  static async updateGrnLineById(req: Request, res: Response): Promise<void> {
    const t = await GRNLine.sequelize?.transaction();
    try {
      const { grnLineId } = req.params;
      const data = req.body;

      if (!grnLineId) {
        res.status(400).json({
          success: false,
          message: 'Missing GRN Line ID',
        });
        return;
      }

      const existingLine = await GRNLine.findByPk(grnLineId, {
        transaction: t,
      });
      if (!existingLine) {
        await t?.rollback();
        res.status(404).json({
          success: false,
          message: `GRN Line with ID ${grnLineId} not found`,
        });
        return;
      }

      const qcFailQty = (data.heldQty ?? 0) + (data.rtvQty ?? 0);

      if ((data.qcPassQty ?? 0) + qcFailQty !== data.receivedQty) {
        throw new Error(
          `Validation failed: qcPassQty + qcFailQty must equal receivedQty`
        );
      }

      await existingLine.update(
        {
          ordered_qty: data.orderedQty ?? existingLine.ordered_qty,
          received_qty: data.receivedQty ?? existingLine.received_qty,
          qc_pass_qty: data.qcPassQty ?? existingLine.qc_pass_qty,
          qc_fail_qty: qcFailQty,
          held_qty: data.heldQty ?? existingLine.held_qty,
          rtv_qty: data.rtvQty ?? existingLine.rtv_qty,
          line_status:
            data.receivedQty === 0
              ? 'pending'
              : data.orderedQty === data.receivedQty
                ? 'completed'
                : 'partial',
        },
        { transaction: t }
      );

      if (data.batches && Array.isArray(data.batches)) {
        await GRNBatch.destroy({
          where: { grn_line_id: grnLineId },
          transaction: t,
        });
        await GRNPhoto.destroy({
          where: { grn_line_id: grnLineId },
          transaction: t,
        });

        for (const batch of data.batches) {
          const grnBatch = await GRNBatch.create(
            {
              grn_line_id: existingLine.id,
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
                  grn_line_id: existingLine.id,
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

      await t?.commit();

      res.status(200).json({
        success: true,
        message: 'GRN Line updated successfully',
        data: existingLine,
      });
    } catch (error: any) {
      await t?.rollback();
      console.error('Error updating GRN line:', error);
      res.status(500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    }
  }

  static async deleteGrnLine(req: Request, res: Response): Promise<void> {
    const t = await GRNLine.sequelize?.transaction();
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Missing GRN Line ID',
        });
        return;
      }

      const existingLine = await GRNLine.findByPk(id, { transaction: t });
      if (!existingLine) {
        await t?.rollback();
        res.status(404).json({
          success: false,
          message: `GRN Line with ID ${id} not found`,
        });
        return;
      }

      // Delete related photos first
      await GRNPhoto.destroy({ where: { grn_line_id: id }, transaction: t });

      // Delete related batches
      await GRNBatch.destroy({ where: { grn_line_id: id }, transaction: t });

      // Delete the GRN line
      await existingLine.destroy({ transaction: t });

      await t?.commit();

      res.status(200).json({
        success: true,
        message: `GRN Line with ID ${id} deleted successfully`,
      });
    } catch (error: any) {
      await t?.rollback();
      console.error('Error deleting GRN Line:', error);
      res.status(500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    }
  }

  static async createGrnLine(req: Request, res: Response) {
    try {
      const data: CreateGRNLineRequest = req.body;
      const {
        grnId,
        skuId,
        receivedQty,
        orderedQty,
        qcPassQty,
        held_qty,
        rtv_qty,
        line_status,
      } = data;
      const qcFailQty = (held_qty ?? 0) + (rtv_qty ?? 0);

      if (!grnId || !skuId || !receivedQty) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      if ((qcPassQty ?? 0) + (qcFailQty ?? 0) !== receivedQty) {
        return res
          .status(400)
          .json({ message: 'qcPassQty + qcFailQty must equal received qty' });
      }

      // 2️⃣ Create GRN Line
      const line = await GRNLine.create({
        grn_id: grnId,
        sku_id: skuId,
        received_qty: receivedQty,
        ordered_qty: orderedQty,
        qc_pass_qty: qcPassQty ?? receivedQty,
        qc_fail_qty: qcFailQty ?? 0,
        held_qty,
        rtv_qty,
        line_status,
      });

      return res.status(201).json({
        message: 'Item scanned successfully',
        line,
      });
    } catch (error: any) {
      console.error('Error in scanItem:', error);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }
  static async getGrnLines(req: Request, res: Response) {
    try {
      const { grnId } = req.query;
      const where: any = {};
      if (grnId) where.grn_id = grnId;

      const lines = await GRNLine.findAll({
        where,
        // include: [{ model: SKU, attributes: ['id', 'name', 'code'] }],
      });

      return res.status(200).json({
        message: 'GRN Lines fetched successfully',
        data: lines,
      });
    } catch (error: any) {
      console.error('Error fetching GRN Lines:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  }

  static async updateGrnLine(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const line = await GRNLine.findByPk(id);
      if (!line) {
        return res.status(404).json({ message: 'GRN Line not found' });
      }

      await line.update(updates);

      return res.status(200).json({
        message: 'GRN Line updated successfully',
        data: line,
      });
    } catch (error: any) {
      console.error('Error updating GRN Line:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  }
}

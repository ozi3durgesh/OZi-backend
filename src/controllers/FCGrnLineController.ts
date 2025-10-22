import { Request, Response } from 'express';
import FCGrnLine from '../models/FCGrnLine';
import { CreateGRNLineRequest } from '../types';
import FCGrnBatch from '../models/FCGrnBatch';
import FCGrnPhoto from '../models/FCGrnPhoto';
import FCGrn from '../models/FCGrn.model';
export interface CreateFCGrnLineInput {
  grnId: number;

  lines: {
    skuId: string;
    orderedQty: number;
    receivedQty: number;
    rejectedQty?: number;
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

export class FCGrnLineController {
  static async createFCGrnLineByGrnId(
    req: Request,
    res: Response
  ): Promise<void> {
    const t = await FCGrnLine.sequelize?.transaction(); // transaction for atomicity
    try {
      const data: CreateFCGrnLineInput = req.body;
      const { grnId, lines } = data;

      if (!grnId || !lines || lines.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Missing FCGrn ID or lines',
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

        const grnLine = await FCGrnLine.create(
          {
            grn_id: grnId,
            sku_id: line.skuId,
            ordered_qty: line.orderedQty,
            received_qty: line.receivedQty,
            pending_qty: line.orderedQty - line.receivedQty,
            rejected_qty: line.rejectedQty ?? 0,
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
            const grnBatch = await FCGrnBatch.create(
              {
                grn_line_id: grnLine.id,
                batch_no: batch.batchNo,
                expiry_date: batch.expiry,
                qty: batch.qty,
              },
              { transaction: t }
            );

            if (batch.photos && batch.photos.length > 0) {
              // Get FCGrn and PO information
              const grn = await FCGrn.findByPk(data.grnId, { transaction: t });
              if (!grn) {
                throw new Error('FCGrn not found');
              }
              
              for (const photo of batch.photos) {
                await FCGrnPhoto.create(
                  {
                    sku_id: line.skuId,
                    grn_id: data.grnId,
                    po_id: grn.po_id,
                    url: photo.url,
                    reason: photo.reason ?? 'batch-photo',
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
        message: 'FCGrn lines created successfully',
        data: createdLines,
      });
    } catch (error: any) {
      await t?.rollback();
      console.error('Error creating FCGrn lines:', error);
      res.status(500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    }
  }
  static async getFCGrnLineByGrnId(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const grnLines = await FCGrnLine.findAll({
        where: { grn_id: id },
        include: [
          {
            model: FCGrnBatch,
            as: 'Batches',
            include: [
              {
                model: FCGrnPhoto,
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
          error: `No FCGrn Lines found for FCGrn ID ${id}`,
        });
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grnLines,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn Lines:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getFCGrnLineById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const line = await FCGrnLine.findByPk(id, {
        include: [
          {
            model: FCGrn,
            as: 'Grn',
            attributes: ['id', 'po_id', 'status'],
          },
          {
            model: FCGrnBatch,
            as: 'Batches',
            include: [
              {
                model: FCGrnPhoto,
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
          message: 'FCGrn Line not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'FCGrn Line fetched successfully',
        data: line,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn Line:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  }
  static async updateFCGrnLineById(req: Request, res: Response): Promise<void> {
    const t = await FCGrnLine.sequelize?.transaction();
    try {
      const { grnLineId } = req.params;
      const data = req.body;

      if (!grnLineId) {
        res.status(400).json({
          success: false,
          message: 'Missing FCGrn Line ID',
        });
        return;
      }

      const existingLine = await FCGrnLine.findByPk(grnLineId, {
        transaction: t,
      });
      if (!existingLine) {
        await t?.rollback();
        res.status(404).json({
          success: false,
          message: `FCGrn Line with ID ${grnLineId} not found`,
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
        await FCGrnBatch.destroy({
          where: { grn_line_id: grnLineId },
          transaction: t,
        });
        await FCGrnPhoto.destroy({
          where: { grn_id: existingLine.grn_id },
          transaction: t,
        });

        for (const batch of data.batches) {
          const grnBatch = await FCGrnBatch.create(
            {
              grn_line_id: existingLine.id,
              batch_no: batch.batchNo,
              expiry_date: batch.expiry,
              qty: batch.qty,
            },
            { transaction: t }
          );

          if (batch.photos && batch.photos.length > 0) {
            // Get FCGrn information to get PO ID
            const grn = await FCGrn.findByPk(existingLine.grn_id, { transaction: t });
            if (!grn) {
              throw new Error('FCGrn not found');
            }
            
            for (const photo of batch.photos) {
              await FCGrnPhoto.create(
                {
                  sku_id: existingLine.sku_id,
                  grn_id: existingLine.grn_id,
                  po_id: grn.po_id,
                  url: photo.url,
                  reason: photo.reason ?? 'batch-photo',
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
        message: 'FCGrn Line updated successfully',
        data: existingLine,
      });
    } catch (error: any) {
      await t?.rollback();
      console.error('Error updating FCGrn line:', error);
      res.status(500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    }
  }

  static async deleteFCGrnLine(req: Request, res: Response): Promise<void> {
    const t = await FCGrnLine.sequelize?.transaction();
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Missing FCGrn Line ID',
        });
        return;
      }

      const existingLine = await FCGrnLine.findByPk(id, { transaction: t });
      if (!existingLine) {
        await t?.rollback();
        res.status(404).json({
          success: false,
          message: `FCGrn Line with ID ${id} not found`,
        });
        return;
      }

      // Delete related photos first
      await FCGrnPhoto.destroy({ where: { grn_id: existingLine.grn_id }, transaction: t });

      // Delete related batches
      await FCGrnBatch.destroy({ where: { grn_line_id: id }, transaction: t });

      // Delete the FCGrn line
      await existingLine.destroy({ transaction: t });

      await t?.commit();

      res.status(200).json({
        success: true,
        message: `FCGrn Line with ID ${id} deleted successfully`,
      });
    } catch (error: any) {
      await t?.rollback();
      console.error('Error deleting FCGrn Line:', error);
      res.status(500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    }
  }

  static async createFCGrnLine(req: Request, res: Response) {
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
        rejectedQty,
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

      // 2️⃣ Create FCGrn Line
      const line = await FCGrnLine.create({
        grn_id: grnId,
        sku_id: skuId,
        received_qty: receivedQty,
        rejected_qty: rejectedQty ?? 0,
        ordered_qty: orderedQty,
        pending_qty: orderedQty - receivedQty,
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
  static async getFCGrnLines(req: Request, res: Response) {
    try {
      const { grnId } = req.query;
      const where: any = {};
      if (grnId) where.grn_id = grnId;

      const lines = await FCGrnLine.findAll({
        where,
        // include: [{ model: SKU, attributes: ['id', 'name', 'code'] }],
      });

      return res.status(200).json({
        message: 'FCGrn Lines fetched successfully',
        data: lines,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn Lines:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  }

  static async updateFCGrnLine(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const line = await FCGrnLine.findByPk(id);
      if (!line) {
        return res.status(404).json({ message: 'FCGrn Line not found' });
      }

      await line.update(updates);

      return res.status(200).json({
        message: 'FCGrn Line updated successfully',
        data: line,
      });
    } catch (error: any) {
      console.error('Error updating FCGrn Line:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  }
}

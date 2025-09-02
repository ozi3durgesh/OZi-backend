import { Request, Response } from 'express';
import GRNLine from '../models/GrnLine';
import { CreateGRNLineRequest } from '../types';
import GRNBatch from '../models/GrnBatch';
import GRNPhoto from '../models/GrnPhoto';

export class GrnLineController {
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
        ordereded_qty: orderedQty,
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
        // include: [{ model: SKU, attributes: ['id', 'name', 'code'] }],
      });

      if (!line) {
        return res.status(404).json({ message: 'GRN Line not found' });
      }

      return res.status(200).json({
        message: 'GRN Line fetched successfully',
        data: line,
      });
    } catch (error: any) {
      console.error('Error fetching GRN Line:', error);
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

  static async deleteGrnLine(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const line = await GRNLine.findByPk(id);
      if (!line) {
        return res.status(404).json({ message: 'GRN Line not found' });
      }

      await line.destroy();

      return res
        .status(200)
        .json({ message: `GRN Line ${id} deleted successfully` });
    } catch (error: any) {
      console.error('Error deleting GRN Line:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  }
}

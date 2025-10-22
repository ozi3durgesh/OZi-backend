import { Request, Response } from 'express';

import FCGrnBatch from '../models/FCGrnBatch';
import { CreateGRNBatchRequest, GRNFilters } from '../types';
import FCGrnLine from '../models/FCGrnLine';

export class FCGrnBatchController {
  static async createFCGrnBatch(req: Request, res: Response) {
    const data: CreateGRNBatchRequest = req.body;
    const existingFCGrnBatch = await FCGrnBatch.findOne({
      where: { grn_line_id: data.grnLineId, batch_no: data.batchNo },
    });

    if (existingFCGrnBatch) {
      res.status(400).json({
        statusCode: 400,
        success: false,
        data: null,
        error: 'This batch already  exists with grn Line',
      });
      return;
    }
    const createdGrnBatch = await FCGrnBatch.create({
      grn_line_id: data.grnLineId,
      batch_no: data.batchNo,
      expiry_date: data.expiry,
      qty: data.qty,
    });

    res.status(201).json({
      statusCode: 201,
      success: true,
      data: createdGrnBatch,
      error: null,
    });
  }
  static async getFCGrnBatchs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query as GRNFilters;

      const offset: number = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      const { count, rows } = await FCGrnBatch.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      const totalPages = Math.ceil(count / Number(limit));

      const response = {
        grnBatch: rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages,
        },
      };

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data: response,
        error: null,
      }); // ✅ return here
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }

  static async getFCGrnBatchById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const batch = await FCGrnBatch.findByPk(id);

      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      return res.status(200).json(batch);
    } catch (error: any) {
      console.error('Error fetching batch:', error);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }

  static async getFCGrnBatchByGrnLineId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const batches = await FCGrnBatch.findAll({
        where: {
          grn_line_id: id,
        },
      });

      if (batches.length <= 0) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      return res.status(200).json(batches);
    } catch (error: any) {
      console.error('Error fetching batch:', error);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }

  static async updateFCGrnBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates: Partial<CreateGRNBatchRequest> = req.body;

      const batch = await FCGrnBatch.findByPk(id);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      await batch.update({
        ...updates,
      });

      return res
        .status(200)
        .json({ message: 'Batch updated successfully', batch });
    } catch (error: any) {
      console.error('Error updating batch:', error);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }

  static async deleteFCGrnBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const batch = await FCGrnBatch.findByPk(id);

      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      await batch.destroy();
      return res.status(200).json({ message: 'Batch deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }
}

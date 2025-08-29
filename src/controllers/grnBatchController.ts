import { Request, Response } from 'express';

import GRNBatch from '../models/GrnBatch';
import { CreateGRNBatchRequest } from '../types';

export class GrnBatchController {
  static async createGrnBatch(req: Request, res: Response) {
    const data: CreateGRNBatchRequest = req.body;
    return await GRNBatch.create({
      grn_line_id: data.grnLineId,
      batch_no: data.batchNo,
      expiry_date: data.expiry,
      qty: data.qty,
    });
  }
  static async getGrnBatchs(req: Request, res: Response) {
    try {
      const batches = await GRNBatch.findAll();
      return res.status(200).json(batches);
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }

  static async getGrnBatchById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const batch = await GRNBatch.findByPk(id);

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

  static async updateGrnBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: Partial<CreateGRNBatchRequest> = req.body;

      const batch = await GRNBatch.findByPk(id);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      await batch.update({
        grn_line_id: data.grnLineId ?? batch.grn_line_id,
        batch_no: data.batchNo ?? batch.batch_no,
        expiry_date: data.expiry ?? batch.expiry_date,
        qty: data.qty ?? batch.qty,
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

  static async deleteGrnBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const batch = await GRNBatch.findByPk(id);

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

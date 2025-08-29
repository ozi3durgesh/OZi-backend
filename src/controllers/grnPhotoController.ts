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

export class GrnPhotoController {
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
}

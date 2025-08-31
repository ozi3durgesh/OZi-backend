import { Request, Response } from 'express';
import * as svc from '../services/purchaseOrder.service';
const handle = (res: Response, p: Promise<any>) =>
  p.then((data) => res.json(data))
   .catch((e: any) => res.status(e.status || 400).json({ error: e.message }));
export const createPO = (req: Request, res: Response) =>
  handle(res, svc.createPO(req.body, (req as any).user?.id));
export const getPO = (req: Request, res: Response) =>
  handle(res, svc.getPO(req.params.id));
export const listPO = (req: Request, res: Response) =>
  handle(res, svc.listPO(req.query, Number(req.query.limit || 50), Number(req.query.page || 1)));
export const updatePO = (req: Request, res: Response) =>
  handle(res, svc.updatePO(req.params.id, req.body, (req as any).user?.id));
export const submitPO = (req: Request, res: Response) =>
  handle(res, svc.submitPO(req.params.id, (req as any).user?.id));
export const lockPO = (req: Request, res: Response) =>
  handle(res, svc.lockPO(req.params.id, (req as any).user?.id));
export const applyGRN = (req: Request, res: Response) =>
  handle(res, svc.applyGRN(req.params.id, req.body?.lines || [], (req as any).user?.id));
export const closePO = (req: Request, res: Response) =>
  handle(res, svc.closePO(req.params.id, req.body?.reason, (req as any).user?.id));
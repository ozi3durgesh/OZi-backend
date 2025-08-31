import { Router } from 'express';
import * as ctrl from '../controllers/purchaseOrder.controller';
// Swap these for your real auth/RBAC middlewares
const auth = (req: any, _res: any, next: any) => { req.user = req.user || { id: 'system', role: 'ADMIN' }; next(); };
const allow = (..._roles: string[]) => (_req: any, _res: any, next: any) => next();
const r = Router();
r.post('/', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.createPO);
r.get('/', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD','FINANCE'), ctrl.listPO);
r.get('/:id', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD','FINANCE'), ctrl.getPO);
r.patch('/:id', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.updatePO);
r.post('/:id/submit', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.submitPO);
r.post('/:id/lock', auth, allow('ADMIN','WH_MANAGER'), ctrl.lockPO);
r.post('/:id/apply-grn', auth, allow('WH_MANAGER','WH_STAFF_1'), ctrl.applyGRN);
r.post('/:id/close', auth, allow('ADMIN','WH_MANAGER'), ctrl.closePO);
export default r;
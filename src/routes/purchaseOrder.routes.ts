import { Router } from 'express';
import * as ctrl from '../controllers/purchaseOrder.controller.js';

const auth = (req: any, _res: any, next: any) => {
  // DEV: allow overriding via headers for testing stages/users
  req.user = req.user || {
    id: req.header('x-user-id') || 'system',
    role: req.header('x-user-role') || 'ADMIN',
    name: req.header('x-user-name') || undefined,
  };
  next();
};
const allow = (..._roles: string[]) => (_req: any, _res: any, next: any) => next();

const r = Router();

r.post('/', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.createPO);
r.get('/', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD','FINANCE'), ctrl.listPO);
r.get('/:id', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD','FINANCE'), ctrl.getPO);
r.patch('/:id', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.updatePO);

// approvals
r.post('/:id/approve', auth, allow('CATEGORY_LEAD','ADMIN','VENDOR'), ctrl.approvePO);
r.post('/:id/reject',  auth, allow('CATEGORY_LEAD','ADMIN','VENDOR'), ctrl.rejectPO);

// existing lifecycle
r.post('/:id/submit', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.submitPO);
r.post('/:id/lock', auth, allow('ADMIN','WH_MANAGER'), ctrl.lockPO);
r.post('/:id/apply-grn', auth, allow('WH_MANAGER','WH_STAFF_1'), ctrl.applyGRN);
r.post('/:id/close', auth, allow('ADMIN','WH_MANAGER'), ctrl.closePO);

export default r;
// src/routes/purchaseOrder.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/purchaseOrder.controller.js';

// Swap these for your real auth/RBAC middlewares
const auth = (req: any, _res: any, next: any) => { req.user = req.user || { id: 'system', role: 'ADMIN', name: 'System' }; next(); };
const allow = (..._roles: string[]) => (_req: any, _res: any, next: any) => next();

const r = Router();

r.post('/', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.createPO);
r.get('/', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD','FINANCE'), ctrl.listPO);
r.get('/:id', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD','FINANCE'), ctrl.getPO);
r.patch('/:id', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.updatePO);

// approvals
r.post('/:id/approve', auth, allow('ADMIN','CATEGORY_LEAD'), ctrl.approvePO);
r.post('/:id/reject',  auth, allow('ADMIN','CATEGORY_LEAD'), ctrl.rejectPO);
r.get('/:id/approval-status', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD','FINANCE'), ctrl.getApprovalStatus);
r.post('/:id/resend-approval', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.resendApproval);

// lifecycle
r.post('/:id/submit', auth, allow('ADMIN','WH_MANAGER','CATEGORY_LEAD'), ctrl.submitPO);
r.post('/:id/lock', auth, allow('ADMIN','WH_MANAGER'), ctrl.lockPO);
r.post('/:id/apply-grn', auth, allow('WH_MANAGER','WH_STAFF_1'), ctrl.applyGRN);
r.post('/:id/close', auth, allow('ADMIN','WH_MANAGER'), ctrl.closePO);

export default r;
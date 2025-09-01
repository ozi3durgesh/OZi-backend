// src/models/purchaseIndex.model.ts   (or name it src/models/index.ts)

import sequelize from '../config/database'; // ← match your actual file (was database)
import { PurchaseOrder } from './purchaseOrder.model';       
import { PurchaseOrderLine } from './purchaseOrderLine.model'; 
import { POApproval } from './poApproval.model.js';

// ---- Associations (run-on-import) ----
PurchaseOrder.hasMany(PurchaseOrderLine, {
  as: 'lines',
  foreignKey: 'po_id',
  onDelete: 'CASCADE',
  hooks: true,
});
PurchaseOrderLine.belongsTo(PurchaseOrder, { foreignKey: 'po_id' });

PurchaseOrder.hasMany(POApproval, {
  as: 'approvals',
  foreignKey: 'po_id',
  onDelete: 'CASCADE',
  hooks: true,
});
POApproval.belongsTo(PurchaseOrder, { foreignKey: 'po_id' });

// ---- Re-exports for services ----
export { sequelize, PurchaseOrder, PurchaseOrderLine, POApproval };
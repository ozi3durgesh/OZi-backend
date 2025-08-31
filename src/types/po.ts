// add/extend these

export enum ApprovalStage {
  CATEGORY_HEAD = 'CATEGORY_HEAD',
  ADMIN = 'ADMIN',
  VENDOR = 'VENDOR',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// extend existing POStatus with gated states
export enum POStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  INBOUND_IN_PROGRESS = 'INBOUND_IN_PROGRESS',
  PARTIAL_GRN = 'PARTIAL_GRN',
  CLOSED = 'CLOSED',
  // new
  AWAITING_CATEGORY_APPROVAL = 'AWAITING_CATEGORY_APPROVAL',
  AWAITING_ADMIN_APPROVAL = 'AWAITING_ADMIN_APPROVAL',
  AWAITING_VENDOR_APPROVAL = 'AWAITING_VENDOR_APPROVAL',
  REJECTED = 'REJECTED',
}

export enum POLineStatus {
  OPEN = 'OPEN',
  PARTIAL = 'PARTIAL',
  CLOSED = 'CLOSED',
}
export type CreatePOLine = {
  sku: string;
  orderedQty: number;
  unitCost: number;
  taxPct?: number;
  mrp?: number | null;
};
export type CreatePOInput = {
  poNo: string;
  vendorId: string;
  vendorName?: string;
  poDate?: string | Date;
  expectedDate?: string | Date | null;
  currency?: string;
  paymentTerms?: string | null;
  siteId?: string | null;
  lines: CreatePOLine[];
};
export type ApplyGRNLine = {
  sku: string;
  receivedQty?: number;
  qcPassQty?: number;
  qcFailQty?: number;
  reasonCodes?: string[];
};
export type ApproveAction =
  | 'OVER_RECEIPT'
  | 'COST_VARIANCE'
  | 'FORCE_CLOSE'
  | 'EDIT_AFTER_LOCK';







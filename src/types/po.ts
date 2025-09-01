// src/types/po.ts

export enum POStatus {
  DRAFT = 'DRAFT',
  AWAITING_CATEGORY_APPROVAL = 'AWAITING_CATEGORY_APPROVAL',
  AWAITING_ADMIN_APPROVAL = 'AWAITING_ADMIN_APPROVAL',
  AWAITING_VENDOR_APPROVAL = 'AWAITING_VENDOR_APPROVAL',
  OPEN = 'OPEN',
  INBOUND_IN_PROGRESS = 'INBOUND_IN_PROGRESS',
  PARTIAL_GRN = 'PARTIAL_GRN',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum POLineStatus {
  OPEN = 'OPEN',
  PARTIAL = 'PARTIAL',
  CLOSED = 'CLOSED',
}

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

export type CreatePOInput = {
  poNo: string;
  vendorId: string;
  vendorName?: string;
  poDate?: string;
  expectedDate?: string;
  currency?: string;
  paymentTerms?: string;
  siteId?: string;
  lines: Array<{
    sku: string;
    orderedQty: number;
    unitCost: number;
    taxPct?: number;
    mrp?: number | null;
  }>;
};

export type ApplyGRNLine = {
  sku: string;
  receivedQty?: number;
  qcPassQty?: number;
  qcFailQty?: number;
  reasonCodes?: string[];
};
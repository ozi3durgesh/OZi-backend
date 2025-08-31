export enum POStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  INBOUND_IN_PROGRESS = 'INBOUND_IN_PROGRESS',
  PARTIAL_GRN = 'PARTIAL_GRN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
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







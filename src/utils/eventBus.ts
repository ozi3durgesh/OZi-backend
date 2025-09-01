// src/utils/eventBus.ts
import { EventEmitter } from 'events';

// survive hot reloads & avoid duplicate listeners
const g = globalThis as any;
export const eventBus: EventEmitter = g.__eventBus || new EventEmitter();
g.__eventBus = eventBus;

export const EVENTS = {
  PO_CREATED: 'PO_CREATED',
  PO_UPDATED: 'PO_UPDATED',
  PO_LOCKED: 'PO_LOCKED',
  PO_CLOSED: 'PO_CLOSED',
  PO_GRN_APPLIED: 'PO_GRN_APPLIED',
} as const;

// optional: safe wrapper so a bad import never crashes a request
export const safeEmit = (evt: string, payload?: any) => {
  try { (eventBus as any)?.emit?.(evt, payload); } catch {}
};
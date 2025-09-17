// Inventory operation constants
export const INVENTORY_OPERATIONS = {
  PO: 'po',
  GRN: 'grn', 
  PUTAWAY: 'putaway',
  PICKLIST: 'picklist',
  RETURN_TRY_AND_BUY: 'return_try_and_buy',
  RETURN_OTHER: 'return_other'
} as const;

export const INVENTORY_COLUMNS = {
  PO_QUANTITY: 'po_quantity',
  GRN_QUANTITY: 'grn_quantity',
  PUTAWAY_QUANTITY: 'putaway_quantity',
  PICKLIST_QUANTITY: 'picklist_quantity',
  RETURN_TRY_AND_BUY_QUANTITY: 'return_try_and_buy_quantity',
  RETURN_OTHER_QUANTITY: 'return_other_quantity'
} as const;

export const INVENTORY_ERRORS = {
  SKU_NOT_FOUND: 'SKU_NOT_FOUND',
  INSUFFICIENT_QUANTITY: 'INSUFFICIENT_QUANTITY',
  INVALID_OPERATION: 'INVALID_OPERATION',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONCURRENT_UPDATE: 'CONCURRENT_UPDATE'
} as const;

export const INVENTORY_MESSAGES = {
  SUCCESS: 'Inventory updated successfully',
  SKU_NOT_FOUND: 'SKU not found in inventory',
  INSUFFICIENT_QUANTITY: 'Insufficient quantity available',
  INVALID_OPERATION: 'Invalid inventory operation',
  DATABASE_ERROR: 'Database error occurred',
  CONCURRENT_UPDATE: 'Concurrent update detected, please retry'
} as const;

export type InventoryOperation = typeof INVENTORY_OPERATIONS[keyof typeof INVENTORY_OPERATIONS];
export type InventoryColumn = typeof INVENTORY_COLUMNS[keyof typeof INVENTORY_COLUMNS];
export type InventoryError = typeof INVENTORY_ERRORS[keyof typeof INVENTORY_ERRORS];

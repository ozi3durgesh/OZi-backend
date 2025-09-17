# Inventory Management System

## Overview

The Inventory Management System provides automatic tracking and updating of inventory quantities across different operational stages. It uses database triggers and a service layer to ensure data consistency and automatic updates without requiring API calls.

## Features

- **Automatic Updates**: Database triggers automatically update inventory when operations occur
- **Complete Audit Trail**: All inventory changes are logged with detailed information
- **Multi-Stage Tracking**: Tracks inventory through PO, GRN, Putaway, Picklist, and Return stages
- **Concurrency Safe**: Uses row-level locking to prevent data corruption
- **Error Handling**: Comprehensive error handling and validation
- **Performance Optimized**: Indexed tables and efficient queries

## Database Schema

### Inventory Table
```sql
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  po_quantity INT NOT NULL DEFAULT 0,
  grn_quantity INT NOT NULL DEFAULT 0,
  putaway_quantity INT NOT NULL DEFAULT 0,
  picklist_quantity INT NOT NULL DEFAULT 0,
  return_try_and_buy_quantity INT NOT NULL DEFAULT 0,
  return_other_quantity INT NOT NULL DEFAULT 0,
  total_available_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Inventory Logs Table
```sql
CREATE TABLE inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL,
  operation_type ENUM('po', 'grn', 'putaway', 'picklist', 'return_try_and_buy', 'return_other') NOT NULL,
  quantity_change INT NOT NULL,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  reference_id VARCHAR(100) DEFAULT NULL,
  operation_details JSON DEFAULT NULL,
  performed_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Operations

### 1. Purchase Order (PO)
- **Trigger**: When PO products are created/updated
- **Action**: Increases `po_quantity`
- **Use Case**: When purchase orders are placed

### 2. Goods Received Note (GRN)
- **Trigger**: When GRN lines are created/updated
- **Action**: Increases `grn_quantity`
- **Use Case**: When goods are received from suppliers

### 3. Putaway
- **Trigger**: When putaway tasks are completed
- **Action**: Increases `putaway_quantity` and `total_available_quantity`
- **Use Case**: When goods are moved to warehouse locations

### 4. Picklist
- **Trigger**: When picklist items are created
- **Action**: Increases `picklist_quantity`, decreases `total_available_quantity`
- **Use Case**: When items are picked for orders

### 5. Return (Try and Buy)
- **Trigger**: When try-and-buy returns are processed
- **Action**: Increases `return_try_and_buy_quantity`
- **Use Case**: When try-and-buy items are returned

### 6. Return (Other)
- **Trigger**: When other returns are processed
- **Action**: Increases `return_other_quantity`
- **Use Case**: When defective or unwanted items are returned

## Usage

### Service Layer Usage

```typescript
import InventoryService from '../services/InventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';

// Update inventory for PO operation
const result = await InventoryService.updateInventory({
  sku: 'SKU-001',
  operation: INVENTORY_OPERATIONS.PO,
  quantity: 100,
  referenceId: 'PO-2024-001',
  operationDetails: { supplier: 'Supplier A' },
  performedBy: 1,
});

// Check availability
const availability = await InventoryService.checkInventoryAvailability({
  sku: 'SKU-001',
  requiredQuantity: 50,
  operation: INVENTORY_OPERATIONS.PUTAWAY,
});

// Get inventory summary
const summary = await InventoryService.getInventorySummary('SKU-001');

// Get inventory logs
const logs = await InventoryService.getInventoryLogs('SKU-001', 10, 0);
```

### Automatic Updates (No API Required)

The system automatically updates inventory when these operations occur:

1. **GRN Operations**: When `grn_lines` table is modified
2. **Putaway Operations**: When `putaway_tasks` table is modified
3. **Picklist Operations**: When `picklist_items` table is modified
4. **Return Operations**: When `return_request_items` table is modified

## Database Triggers

### GRN Triggers
- `after_grn_line_insert`: Updates inventory when GRN lines are added
- `after_grn_line_update`: Updates inventory when GRN lines are modified
- `after_grn_line_delete`: Updates inventory when GRN lines are removed

### Putaway Triggers
- `after_putaway_task_insert`: Updates inventory when putaway tasks are completed

### Picklist Triggers
- `after_picklist_item_insert`: Updates inventory when items are picked

### Return Triggers
- `after_return_request_item_insert`: Updates inventory when returns are processed

## Stored Procedures

### ReconcileInventory
```sql
CALL ReconcileInventory('SKU-001');
```
Recalculates and fixes any discrepancies in inventory quantities.

## Views

### inventory_summary
Provides a comprehensive view of inventory status:
```sql
SELECT * FROM inventory_summary WHERE sku = 'SKU-001';
```

## Error Handling

The system handles various error scenarios:

- **SKU_NOT_FOUND**: When SKU doesn't exist in inventory
- **INSUFFICIENT_QUANTITY**: When trying to pick more than available
- **INVALID_OPERATION**: When operation type is invalid
- **DATABASE_ERROR**: When database operations fail
- **CONCURRENT_UPDATE**: When multiple operations conflict

## Performance Considerations

1. **Indexes**: All tables are properly indexed for fast lookups
2. **Row Locking**: Uses `SELECT ... FOR UPDATE` to prevent race conditions
3. **Batch Operations**: Supports bulk updates for efficiency
4. **Connection Pooling**: Uses connection pooling for better performance

## Monitoring and Maintenance

### Regular Tasks
1. **Reconcile Inventory**: Run reconciliation for SKUs with discrepancies
2. **Monitor Logs**: Check inventory logs for unusual patterns
3. **Performance Monitoring**: Monitor query performance and optimize as needed

### Health Checks
```typescript
// Check inventory consistency
const summary = await InventoryService.getInventorySummary('SKU-001');
if (summary.total_available_quantity !== (summary.putaway_quantity - summary.picklist_quantity)) {
  await InventoryService.reconcileInventory('SKU-001');
}
```

## Setup

The inventory system is automatically set up when the database connection is established. To manually set it up:

```bash
# Run the setup script
npx ts-node src/script/setupInventorySystem.ts

# Or run the example
npx ts-node src/examples/inventoryUsageExample.ts
```

## Configuration

All constants are defined in `src/config/inventoryConstants.ts`:

```typescript
export const INVENTORY_OPERATIONS = {
  PO: 'po',
  GRN: 'grn', 
  PUTAWAY: 'putaway',
  PICKLIST: 'picklist',
  RETURN_TRY_AND_BUY: 'return_try_and_buy',
  RETURN_OTHER: 'return_other'
} as const;
```

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Check availability** before picking operations
3. **Log all operations** with proper reference IDs
4. **Monitor inventory logs** regularly
5. **Reconcile inventory** periodically
6. **Use bulk operations** for efficiency
7. **Handle errors gracefully** with proper error messages

## Troubleshooting

### Common Issues

1. **Negative Quantities**: Usually indicates a trigger or logic error
2. **Missing Logs**: Check if triggers are properly installed
3. **Performance Issues**: Check indexes and query optimization
4. **Concurrency Issues**: Ensure proper locking mechanisms

### Debug Commands

```sql
-- Check trigger status
SHOW TRIGGERS LIKE 'grn_lines';

-- Check inventory for a SKU
SELECT * FROM inventory WHERE sku = 'SKU-001';

-- Check recent logs
SELECT * FROM inventory_logs WHERE sku = 'SKU-001' ORDER BY created_at DESC LIMIT 10;

-- Check inventory summary
SELECT * FROM inventory_summary WHERE sku = 'SKU-001';
```

## Future Enhancements

1. **Real-time Notifications**: WebSocket notifications for inventory changes
2. **Advanced Analytics**: Inventory trend analysis and forecasting
3. **Multi-warehouse Support**: Support for multiple warehouse locations
4. **Integration APIs**: REST APIs for external system integration
5. **Mobile Support**: Mobile app for inventory management
6. **Automated Reordering**: Automatic reorder point calculations

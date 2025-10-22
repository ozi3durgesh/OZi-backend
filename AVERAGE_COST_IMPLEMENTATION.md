# Average Cost to OZI - Automatic Calculation Implementation

## Overview
Implemented automatic calculation and update of `avg_cost_to_ozi` field in the Product Master system when GRN (Goods Receipt Note) is completed.

## What Was Implemented

### 1. **ProductMasterService.calculateAndUpdateAverageCost()**
- **Location**: `/src/services/productMasterService.ts`
- **Purpose**: Calculates weighted average cost based on GRN data
- **Method**: Uses QC passed quantities and unit prices from purchase orders

#### Key Features:
- **Weighted Average Calculation**: `Total Cost / Total Quantity`
- **Data Source**: GRN lines joined with DC PO products
- **QC Passed Quantity**: Only uses quantities that passed quality control
- **Transaction Safety**: Uses database transactions for data consistency
- **Audit Trail**: Logs all cost updates with detailed calculation information

#### SQL Query Used:
```sql
SELECT 
  gl.sku_id,
  gl.received_qty,
  gl.qc_pass_qty,
  po.unit_price,
  po.total_amount,
  po.quantity as ordered_qty,
  grn.status as grn_status,
  grn.created_at as grn_date
FROM grn_lines gl
JOIN grns grn ON gl.grn_id = grn.id
JOIN dc_po_products po ON grn.po_id = po.dc_po_id AND gl.sku_id = po.sku_id
WHERE gl.sku_id = :skuId 
AND gl.received_qty > 0 
AND gl.qc_pass_qty > 0
AND grn.status IN ('completed', 'partial')
ORDER BY grn.created_at ASC
```

### 2. **GRN Controller Integration**
- **Location**: `/src/controllers/grnController.ts`
- **Integration Points**:
  - `createFullGRN()`: Updates costs after inventory updates
  - `updateGrnStatus()`: Updates costs when GRN status changes to 'completed'

#### Features:
- **Automatic Trigger**: Runs automatically on GRN completion
- **Error Handling**: Continues processing even if some SKUs fail
- **Detailed Logging**: Provides comprehensive update status
- **Response Enhancement**: Includes cost update information in API responses

### 3. **API Response Enhancement**
The GRN creation and status update APIs now return additional information:

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 123,
    "status": "completed",
    // ... other GRN fields
    "inventoryUpdates": {
      "total_updates": 5,
      "successful_updates": 5,
      "failed_updates": 0,
      "error_updates": 0,
      "updates": [...]
    },
    "costUpdates": {
      "total_updates": 5,
      "successful_updates": 5,
      "failed_updates": 0,
      "updates": [
        {
          "sku": "400000101001",
          "status": "success",
          "message": "Average cost updated successfully",
          "previous_cost": 150.00,
          "new_cost": 175.50
        }
      ]
    }
  }
}
```

## How It Works

### 1. **GRN Creation Flow**
```
GRN Created → Inventory Updated → Average Cost Calculated → Response Sent
```

### 2. **GRN Status Update Flow**
```
GRN Status Changed to 'completed' → Average Cost Calculated → Response Sent
```

### 3. **Cost Calculation Logic**
```
For each GRN entry:
  - Get unit price from DC PO products
  - Use QC passed quantity (not just received quantity)
  - Calculate: Total Cost += (Unit Price × QC Passed Qty)
  - Calculate: Total Quantity += QC Passed Qty

Final Average Cost = Total Cost / Total Quantity
```

## Benefits

### 1. **Accuracy**
- **Real-time Updates**: Costs updated immediately when goods are received
- **QC Consideration**: Only uses quantities that passed quality control
- **Weighted Average**: Accounts for different purchase prices over time

### 2. **Automation**
- **No Manual Entry**: Eliminates human error in cost updates
- **Consistent Process**: Same calculation method for all SKUs
- **Audit Trail**: Complete history of cost changes

### 3. **Business Value**
- **Accurate Margins**: Correct cost basis for margin calculations
- **Pricing Decisions**: Reliable cost data for pricing strategies
- **Financial Reporting**: Accurate COGS (Cost of Goods Sold)

## Testing

### Test Script
Created `test-avg-cost-calculation.js` to verify the implementation:

```bash
cd /Users/akashdip/Desktop/oms1/OZi-backend
node test-avg-cost-calculation.js
```

### Manual Testing
1. Create a GRN with SKUs that have existing purchase history
2. Complete the GRN
3. Check that `avg_cost_to_ozi` is updated in Product Master
4. Verify the calculation matches expected weighted average

## Database Schema Requirements

The implementation requires these tables and relationships:
- `product_master` (with `avg_cost_to_ozi` field)
- `grns` (GRN header)
- `grn_lines` (GRN line items)
- `dc_po_products` (Purchase order products with unit prices)

## Error Handling

- **Graceful Degradation**: If cost calculation fails, GRN process continues
- **Detailed Logging**: All errors are logged with context
- **Transaction Safety**: Database transactions ensure data consistency
- **User Feedback**: API responses include success/failure status for each SKU

## Future Enhancements

1. **Cost History Tracking**: Store historical cost changes
2. **Cost Validation**: Add business rules for cost validation
3. **Bulk Operations**: Support for bulk cost updates
4. **Cost Reporting**: Generate cost analysis reports
5. **Integration**: Connect with accounting systems

## Files Modified

1. `/src/services/productMasterService.ts` - Added `calculateAndUpdateAverageCost()` method
2. `/src/controllers/grnController.ts` - Integrated cost calculation into GRN flows
3. `test-avg-cost-calculation.js` - Test script for verification

## Conclusion

The implementation provides a robust, automated system for calculating and updating average costs based on actual purchase data from GRNs. This ensures accurate cost tracking and eliminates manual errors in cost management.

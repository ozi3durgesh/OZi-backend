# Packing and Handover APIs

This document describes the two enhanced APIs for the packing and handover workflow with proper database validation:

## 1. Pack and Seal API

**Endpoint:** `POST /api/packing/pack-and-seal`

**Description:** This API allows frontend developers to pack and seal products with SKU, quantity, and picture data. The API includes comprehensive validation:
- Validates SKU and quantity against the picking wave
- Checks if the order belongs to the specified warehouse
- Prevents packing if the picking wave is already completed
- Handles partial packing scenarios
- Updates database records with proper transaction handling

**Request Body:**
```json
{
  "sku": "122",
  "quantity": 1,
  "picture": "base64_encoded_image_or_url",
  "orderId": 31,
  "warehouseId": 1,
  "specialInstructions": "Handle with care - Fragile item"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "message": "Product packed and sealed successfully",
    "jobNumber": "PKG-1756107599708-abc123",
    "sku": "122",
    "quantity": 1,
    "picture": "base64_encoded_image_or_url",
    "orderId": 31,
    "warehouseId": 1,
    "specialInstructions": "Handle with care - Fragile item",
    "status": "PACKED_AND_SEALED",
    "partialReason": null,
    "packedAt": "2024-12-21T10:30:45.123Z",
    "readyForHandover": true,
    "waveStatus": "PICKING",
    "waveId": 30
  }
}
```

**CURL Example:**
```bash
curl --location 'http://localhost:3000/api/packing/pack-and-seal' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AeW91cmNvbXBhbnkuY29tIiwicm9sZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlsidXNlcnNfcm9sZXM6bWFuYWdlIiwic2l0ZXM6Y3JlYXRlX2NvbmZpZyIsInNpdGVzOnZpZXciLCJzaXRlczp2aWV3X293biIsIm9yZGVyczp2aWV3X2FsbCIsIm9yZGVyczp2aWV3X3doIiwib3JkZXJzOnZpZXdfc3RvcmUiLCJvcmRlcnM6dmlld190YXNrIiwicGlja2luZzp2aWV3IiwicGlja2luZzphc3NpZ25fbWFuYWdlIiwicGlja2luZzpleGVjdXRlIiwicGlja2luZzptb25pdG9yIiwiaW5ib3VuZDp2aWV3IiwiaW5ib3VuZDphcHByb3ZlX3ZhcmlhbmNlcyIsImluYm91bmQ6ZXhlY3V0ZSIsInB1dGF3YXk6dmlldyIsInB1dGF3YXk6bWFuYWdlIiwicHV0YXdheTpleGVjdXRlIiwiaW52ZW50b3J5OmFwcHJvdmUiLCJpbnZlbnRvcnk6cmFpc2UiLCJjeWNsZV9jb3VudDp2aWV3IiwiY3ljbGVfY291bnQ6c2NoZWR1bGVfYXBwcm92ZSIsImN5Y2xlX2NvdW50OmV4ZWN1dGUiLCJyZXBsZW5pc2htZW50OmNvbmZpZyIsInJlcGxlbmlzaG1lbnQ6YXBwcm92ZSIsInJ0djpjb25maWdfYXBwcm92ZSIsInJ0djpjcmVhdGVfYXBwcm92ZSIsInJ0djpleGVjdXRlIiwicG9zOnZpZXciLCJwb3M6ZXhlY3V0ZSIsInN0b3JlX3doX3JlcXVlc3RzOnZpZXciLCJzdG9yZV93aF9yZXF1ZXN0czpjcmVhdGVfY2hlY2tpbiIsImV4Y2VwdGlvbnM6YWxsX2FjdGlvbnMiLCJleGNlcHRpb25zOnJlc29sdmUiLCJleGNlcHRpb25zOnJhaXNlIiwiZXhjZXB0aW9uczpyYWlzZV9zdG9yZSIsImRhc2hib2FyZHM6dmlld19hbGwiLCJkYXNoYm9yZHM6dmlld19kaCIsImRhc2hib2FyZHM6dmlld190YXNrIiwiZGFzaGJvYXJkczp2aWV3X3N0b3JlIiwic2xhOmNvbmZpZ3VyZSIsInNsYTp2aWV3Iiwic3RvcmVfb3BzOnBvc19jaGVja291dCIsInN0b3JlX29wczppbnZvaWNlX2NyZWF0ZSIsInN0b3JlX29wczpzdG9yZV9zdGF0dXMiLCJzdG9yZV9vcHM6c3VyZ2VfdG9nZ2xlIiwic3RvcmVfb3BzOnN0b2NrX2NoZWNrIl0sImlhdCI6MTc1NjEwNzU1OSwiZXhwIjoxNzU2MTA4NDU5fQ.BVXjfEIKgdoVYNO5IWj3VglqlgmtuGIwtvo96j3G1fw' \
--header 'Content-Type: application/json' \
--header 'X-App-Version: 1.0.0' \
--data '{
    "sku": "122",
    "quantity": 1,
    "picture": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "orderId": 31,
    "warehouseId": 1,
    "specialInstructions": "Handle with care - Fragile item"
}'
```

## 2. Handover to Dispatch API

**Endpoint:** `POST /api/handover/dispatch`

**Description:** This API handles the handover of packed products to dispatch and generates a unique AWB/Manifest ID. The API includes comprehensive validation:
- Validates packing job exists and is completed
- Checks SKU and quantity match with packing job
- Prevents duplicate handovers
- Generates AWB number in format `AWB-OZISTORE-0012345`
- Updates database records with proper transaction handling

**Request Body:**
```json
{
  "jobNumber": "PKG-1756107599708-abc123",
  "sku": "122",
  "quantity": 1,
  "destination": "123 Main Street, New York, NY 10001",
  "warehouseId": 1,
  "specialInstructions": "Express delivery - Customer requested"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "message": "Product handed over to dispatch successfully",
    "handoverId": 1234,
    "jobNumber": "PKG-1756107599708-abc123",
    "sku": "122",
    "quantity": 1,
    "destination": "123 Main Street, New York, NY 10001",
    "warehouseId": 1,
    "awbNumber": "AWB-OZISTORE-0012345",
    "trackingNumber": "TRK-1756107599708-ABC123",
    "specialInstructions": "Express delivery - Customer requested",
    "status": "DISPATCHED",
    "dispatchedAt": "2024-12-21T10:35:22.456Z",
    "estimatedDelivery": "2024-12-22T10:35:22.456Z",
    "readyForDelivery": true
  }
}
```

**CURL Example:**
```bash
curl --location 'http://localhost:3000/api/handover/dispatch' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AeW91cmNvbXBhbnkuY29tIiwicm9sZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlsidXNlcnNfcm9sZXM6bWFuYWdlIiwic2l0ZXM6Y3JlYXRlX2NvbmZpZyIsInNpdGVzOnZpZXciLCJzaXRlczp2aWV3X293biIsIm9yZGVyczp2aWV3X2FsbCIsIm9yZGVyczp2aWV3X3doIiwib3JkZXJzOnZpZXdfc3RvcmUiLCJvcmRlcnM6dmlld190YXNrIiwicGlja2luZzp2aWV3IiwicGlja2luZzphc3NpZ25fbWFuYWdlIiwicGlja2luZzpleGVjdXRlIiwicGlja2luZzptb25pdG9yIiwiaW5ib3VuZDp2aWV3IiwiaW5ib3VuZDphcHByb3ZlX3ZhcmlhbmNlcyIsImluYm91bmQ6ZXhlY3V0ZSIsInB1dGF3YXk6dmlldyIsInB1dGF3YXk6bWFuYWdlIiwicHV0YXdheTpleGVjdXRlIiwiaW52ZW50b3J5OmFwcHJvdmUiLCJpbnZlbnRvcnk6cmFpc2UiLCJjeWNsZV9jb3VudDp2aWV3IiwiY3ljbGVfY291bnQ6c2NoZWR1bGVfYXBwcm92ZSIsImN5Y2xlX2NvdW50OmV4ZWN1dGUiLCJyZXBsZW5pc2htZW50OmNvbmZpZyIsInJlcGxlbmlzaG1lbnQ6YXBwcm92ZSIsInJ0djpjb25maWdfYXBwcm92ZSIsInJ0djpjcmVhdGVfYXBwcm92ZSIsInJ0djpleGVjdXRlIiwicG9zOnZpZXciLCJwb3M6ZXhlY3V0ZSIsInN0b3JlX3doX3JlcXVlc3RzOnZpZXciLCJzdG9yZV93aF9yZXF1ZXN0czpjcmVhdGVfY2hlY2tpbiIsImV4Y2VwdGlvbnM6YWxsX2FjdGlvbnMiLCJleGNlcHRpb25zOnJlc29sdmUiLCJleGNlcHRpb25zOnJhaXNlIiwiZXhjZXB0aW9uczpyYWlzZV9zdG9yZSIsImRhc2hib2FyZHM6dmlld19hbGwiLCJkYXNoYm9yZHM6dmlld19kaCIsImRhc2hib2FyZHM6dmlld190YXNrIiwiZGFzaGJvYXJkczp2aWV3X3N0b3JlIiwic2xhOmNvbmZpZ3VyZSIsInNsYTp2aWV3Iiwic3RvcmVfb3BzOnBvc19jaGVja291dCIsInN0b3JlX29wczppbnZvaWNlX2NyZWF0ZSIsInN0b3JlX29wczpzdG9yZV9zdGF0dXMiLCJzdG9yZV9vcHM6c3VyZ2VfdG9nZ2xlIiwic3RvcmVfb3BzOnN0b2NrX2NoZWNrIl0sImlhdCI6MTc1NjEwNzU1OSwiZXhwIjoxNzU2MTA4NDU5fQ.BVXjfEIKgdoVYNO5IWj3VglqlgmtuGIwtvo96j3G1fw' \
--header 'Content-Type: application/json' \
--header 'X-App-Version: 1.0.0' \
--data '{
    "jobNumber": "PKG-1756107599708-abc123",
    "sku": "122",
    "quantity": 1,
    "destination": "123 Main Street, New York, NY 10001",
    "warehouseId": 1,
    "specialInstructions": "Express delivery - Customer requested"
}'
```

## 🔄 **Enhanced Workflow with Database Validation**

### **1. Pack and Seal Process:**
1. **Input Validation**: Validates SKU, quantity, picture, orderId, and warehouseId
2. **Order Validation**: Checks if order exists and belongs to specified warehouse
3. **Wave Status Check**: Prevents packing if picking wave is already completed
4. **SKU/Quantity Matching**: Validates against picklist items in the wave
5. **Partial Handling**: Supports partial packing with reason tracking
6. **Database Updates**: Updates picklist items and wave status with transactions
7. **Packing Job Creation**: Creates comprehensive packing job record

### **2. Handover to Dispatch Process:**
1. **Job Validation**: Verifies packing job exists and is completed
2. **Quantity Validation**: Ensures quantity matches packed items
3. **Duplicate Prevention**: Prevents multiple handovers for same job
4. **AWB Generation**: Creates unique AWB number in specified format
5. **Database Updates**: Creates handover record and updates packing job status
6. **Transaction Safety**: Uses database transactions for data integrity

## 📊 **Database Integration**

### **Tables Updated:**
- **`picklist_items`**: Status updates (PENDING → PICKED/PARTIAL)
- **`picking_waves`**: Status updates (PICKING → COMPLETED when all items picked)
- **`packing_jobs`**: New packing job records with status tracking
- **`handovers`**: New handover records with AWB/tracking numbers

### **Validation Rules:**
- **SKU Matching**: Must exist in picking wave for the order
- **Quantity Validation**: Cannot pack more than picked quantity
- **Wave Status**: Cannot pack completed waves
- **Warehouse Validation**: Order must belong to specified warehouse
- **Job Status**: Cannot handover incomplete packing jobs

## 🔐 **Authentication & Headers**

Both APIs require:
- **JWT Token**: `Authorization: Bearer YOUR_JWT_TOKEN`
- **App Version**: `X-App-Version: 1.0.0`
- **Content Type**: `Content-Type: application/json`

## 🚫 **Error Scenarios Handled**

### **Pack and Seal Errors:**
- Missing required fields (400)
- Order not found (404)
- Warehouse mismatch (403)
- Wave already completed (409)
- SKU not found in wave (404)
- Quantity exceeds picked amount (400)

### **Handover to Dispatch Errors:**
- Missing required fields (400)
- Packing job not found (404)
- Job not completed (400)
- Quantity mismatch (400)
- Already handed over (409)

## 📈 **Status Tracking**

### **Picking Wave Statuses:**
- `GENERATED` → `ASSIGNED` → `PICKING` → `COMPLETED`

### **Packing Job Statuses:**
- `PENDING` → `PACKING` → `COMPLETED` → `AWAITING_HANDOVER`

### **Handover Statuses:**
- `ASSIGNED` → `CONFIRMED` → `IN_TRANSIT` → `DELIVERED`

## 🔧 **Testing with Real Data**

The APIs now work with your existing database:
- **Order ID**: 31 (from your picking example)
- **SKU**: "122" (from your picking example)
- **Warehouse ID**: 1 (your warehouse)
- **Wave ID**: 30 (from your picking example)

## 📝 **Next Steps for Production**

1. **Add SKU field to PackingJob model** for complete validation
2. **Implement photo storage** (S3/Azure Blob)
3. **Add LMS integration** for real AWB generation
4. **Implement barcode scanning** for SKU validation
5. **Add audit logging** for compliance tracking

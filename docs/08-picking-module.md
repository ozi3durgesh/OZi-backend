# Picking Module

This document covers all picking module endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## 📦 Picking Wave Operations

### Generate Picking Waves

**Endpoint:** `POST /api/picking/waves/generate`

**Description:** Generates new picking waves from order IDs.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "orderIds": [1, 2, 3, 4, 5],
  "priority": "HIGH",
  "routeOptimization": true,
  "fefoRequired": false,
  "tagsAndBags": false,
  "maxOrdersPerWave": 20
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "orderIds": [1, 2, 3, 4, 5],
    "priority": "HIGH",
    "routeOptimization": true,
    "maxOrdersPerWave": 20
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "orderIds": [1, 2, 3, 4, 5],
    "priority": "HIGH",
    "routeOptimization": true,
    "maxOrdersPerWave": 20
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 1 picking waves",
  "data": {
    "waves": [
      {
        "id": 1,
        "waveNumber": "W1642233600000-1",
        "status": "GENERATED",
        "totalOrders": 5,
        "totalItems": 15,
        "estimatedDuration": 10,
        "slaDeadline": "2024-01-16T10:30:00.000Z"
      }
    ]
  }
}
```

### Assign Waves to Pickers

**Endpoint:** `GET /api/picking/waves/assign`

**Description:** Auto-assigns available waves to pickers.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `maxWavesPerPicker` (optional): Maximum waves per picker (default: 3)

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/waves/assign?maxWavesPerPicker=3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/waves/assign?maxWavesPerPicker=3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "message": "Assigned 2 waves to pickers",
  "data": {
    "assignments": [
      {
        "waveId": 1,
        "waveNumber": "W1642233600000-1",
        "pickerId": 2,
        "pickerEmail": "picker@ozi.com",
        "assignedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Get Available Waves

**Endpoint:** `GET /api/picking/waves/available`

**Description:** Lists available picking waves with filtering and pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `status` (optional): Filter by wave status
- `priority` (optional): Filter by priority
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/waves/available?status=ASSIGNED&priority=HIGH&page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/waves/available?status=ASSIGNED&priority=HIGH&page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "waves": [
      {
        "id": 1,
        "waveNumber": "W1642233600000-1",
        "status": "ASSIGNED",
        "priority": "HIGH",
        "totalOrders": 5,
        "totalItems": 15,
        "estimatedDuration": 10,
        "slaDeadline": "2024-01-16T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

## 🚀 Picker Operations

### Start Picking

**Endpoint:** `POST /api/picking/waves/:waveId/start`

**Description:** Starts picking operations for a specific wave.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "message": "Picking started successfully",
  "data": {
    "wave": {
      "id": 1,
      "waveNumber": "W1642233600000-1",
      "status": "PICKING",
      "totalItems": 15,
      "estimatedDuration": 10
    },
    "picklistItems": [
      {
        "id": 1,
        "sku": "SKU001",
        "productName": "Product 1",
        "binLocation": "A1-B2-C3",
        "quantity": 2,
        "scanSequence": 1,
        "fefoBatch": null,
        "expiryDate": null
      }
    ]
  }
}
```

### Scan Item

**Endpoint:** `POST /api/picking/waves/:waveId/scan`

**Description:** Scans an item during picking process.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "sku": "SKU001",
  "binLocation": "A1-B2-C3",
  "quantity": 2
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/scan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sku": "SKU001",
    "binLocation": "A1-B2-C3",
    "quantity": 2
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/scan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "sku": "SKU001",
    "binLocation": "A1-B2-C3",
    "quantity": 2
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Item scanned successfully",
  "data": {
    "item": {
      "id": 1,
      "sku": "SKU001",
      "productName": "Product 1",
      "status": "PICKED",
      "pickedQuantity": 2,
      "remainingQuantity": 0
    },
    "waveStatus": "PICKING",
    "remainingItems": 14
  }
}
```

### Report Partial Pick

**Endpoint:** `POST /api/picking/waves/:waveId/partial`

**Description:** Reports a partial pick with reason and notes.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "sku": "SKU002",
  "binLocation": "A1-B2-C4",
  "reason": "OOS",
  "photo": "photo_url_here",
  "notes": "Item out of stock",
  "pickedQuantity": 0
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/partial" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sku": "SKU002",
    "binLocation": "A1-B2-C4",
    "reason": "OOS",
    "notes": "Item out of stock",
    "pickedQuantity": 0
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/partial" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "sku": "SKU002",
    "binLocation": "A1-B2-C4",
    "reason": "OOS",
    "notes": "Item out of stock",
    "pickedQuantity": 0
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Partial pick reported successfully",
  "data": {
    "item": {
      "id": 2,
      "sku": "SKU002",
      "status": "PARTIAL",
      "partialReason": "OOS",
      "pickedQuantity": 0
    }
  }
}
```

### Complete Picking

**Endpoint:** `POST /api/picking/waves/:waveId/complete`

**Description:** Completes picking for a specific wave.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/1/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "message": "Picking completed successfully",
  "data": {
    "wave": {
      "id": 1,
      "waveNumber": "W1642233600000-1",
      "status": "COMPLETED",
      "completedAt": "2024-01-15T10:30:00.000Z"
    },
    "metrics": {
      "totalItems": 15,
      "pickedItems": 13,
      "partialItems": 2,
      "accuracy": 86.67
    }
  }
}
```

## 📊 Monitoring

### Get SLA Status

**Endpoint:** `GET /api/picking/sla-status`

**Description:** Checks SLA compliance for picking waves.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `waveId` (optional): Filter by specific wave ID

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/sla-status?waveId=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/sla-status?waveId=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slaMetrics": {
      "total": 1,
      "onTime": 1,
      "atRisk": 0,
      "breached": 0,
      "waves": [
        {
          "id": 1,
          "waveNumber": "W1642233600000-1",
          "status": "COMPLETED",
          "priority": "HIGH",
          "slaDeadline": "2024-01-16T10:30:00.000Z",
          "slaStatus": "onTime",
          "hoursToDeadline": 24
        }
      ]
    },
    "summary": {
      "onTimePercentage": 100,
      "atRiskPercentage": 0,
      "breachedPercentage": 0
    }
  }
}
```

### Get Expiry Alerts

**Endpoint:** `GET /api/picking/expiry-alerts`

**Description:** Gets alerts for items approaching expiry.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `daysThreshold` (optional): Days threshold for alerts (default: 7)

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/expiry-alerts?daysThreshold=7" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/picking/expiry-alerts?daysThreshold=7" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAlerts": 2,
    "alerts": [
      {
        "id": 1,
        "sku": "SKU003",
        "productName": "Product 3",
        "expiryDate": "2024-01-20T00:00:00.000Z",
        "daysUntilExpiry": 5,
        "urgency": "HIGH",
        "orderId": 3
      }
    ]
  }
}
```

## 📱 Mobile App Considerations

### Version Check Headers
For mobile clients, the following headers are required:
- `source: mobile` - Identifies the request as coming from a mobile app
- `app-version: 1.2.0` - Current app version for compatibility checking

### Version Compatibility
- Minimum supported version: 1.0.0
- If app version is below minimum, API returns 426 status code
- Web clients don't require version checking

### Device Management
- Mobile apps should provide unique device identifiers
- Platform detection (ios/android) for analytics
- Secure token storage using platform-specific methods

## ⚠️ Error Responses

### Common Error Responses

**Unauthorized Access:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid token",
  "statusCode": 401
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource",
  "statusCode": 403
}
```

**User Not Available:**
```json
{
  "success": false,
  "error": "User not available",
  "message": "User is currently off-shift or unavailable",
  "statusCode": 403
}
```

**Wave Not Found:**
```json
{
  "success": false,
  "error": "Wave not found",
  "message": "Wave not found",
  "statusCode": 404
}
```

**Wave Not Assigned:**
```json
{
  "success": false,
  "error": "Wave not assigned",
  "message": "Wave is not assigned to you",
  "statusCode": 400
}
```

**Item Not Found:**
```json
{
  "success": false,
  "error": "Item not found",
  "message": "Item not found in picklist",
  "statusCode": 404
}
```

**Cannot Complete:**
```json
{
  "success": false,
  "error": "Cannot complete",
  "message": "Cannot complete: 2 items still pending",
  "statusCode": 400
}
```

**App Version Too Old (Mobile Only):**
```json
{
  "success": false,
  "error": "Upgrade Required",
  "message": "Please update your app to version 1.0.0 or higher",
  "statusCode": 426
}
```

**Missing App Version (Mobile Only):**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "App version is required for mobile users",
  "statusCode": 400
}
```

## 🔐 Security Features

1. **JWT Authentication**: All endpoints require valid JWT tokens
2. **Permission Validation**: Specific picking permissions required
3. **Availability Check**: Users must be available (not off-shift)
4. **Wave Assignment**: Users can only access assigned waves
5. **Input Validation**: Comprehensive request validation
6. **Version Control**: Mobile app compatibility checking
7. **Audit Logging**: Track all picking operations

## 📋 Operation Flow

### Wave Generation Flow
1. Admin provides order IDs and wave parameters
2. System validates orders exist and are eligible
3. System groups orders into waves
4. System creates picklist items for each order
5. Success response with generated waves

### Wave Assignment Flow
1. System finds available pickers with permissions
2. System finds unassigned waves
3. System assigns waves to pickers based on capacity
4. Success response with assignments

### Picking Execution Flow
1. Picker starts picking for assigned wave
2. Picker scans items during picking
3. Picker reports partial picks if needed
4. Picker completes picking when all items processed
5. System calculates completion metrics

---

This document covers all picking module endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.

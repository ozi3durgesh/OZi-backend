# Picking Module

This document covers all picking module endpoints for the OZi Backend system.

**Base URL:** `http://13.232.150.239`

## 📦 Picking Wave Operations

### Generate Picking Waves

**Endpoint:** `POST /api/picking/waves/generate`

**Description:** Generates picking waves based on order volume and priority.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "zoneId": "Zone-A",
  "maxOrdersPerWave": 10,
  "priority": "high",
  "estimatedStartTime": "2024-01-15T08:00:00.000Z"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "zoneId": "Zone-A",
    "maxOrdersPerWave": 10,
    "priority": "high",
    "estimatedStartTime": "2024-01-15T08:00:00.000Z"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "zoneId": "Zone-A",
    "maxOrdersPerWave": 10,
    "priority": "high",
    "estimatedStartTime": "2024-01-15T08:00:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Picking waves generated successfully",
  "data": {
    "wavesCreated": 3,
    "totalOrders": 25,
    "estimatedDuration": "4 hours"
  }
}
```

### Assign Picking Waves

**Endpoint:** `GET /api/picking/waves/assign`

**Description:** Retrieves available waves for assignment to pickers.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `zoneId` (optional): Filter by warehouse zone
- `priority` (optional): Filter by priority level
- `status` (optional): Filter by wave status

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/waves/assign?zoneId=Zone-A&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/waves/assign?zoneId=Zone-A&priority=high" \
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
        "id": "WAVE-001",
        "name": "Morning Wave 1",
        "zoneId": "Zone-A",
        "priority": "high",
        "orderCount": 8,
        "estimatedDuration": "2 hours",
        "status": "available"
      }
    ]
  }
}
```

### Get Available Waves

**Endpoint:** `GET /api/picking/waves/available`

**Description:** Retrieves all available picking waves for pickers.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/waves/available" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/waves/available" \
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
        "id": "WAVE-001",
        "name": "Morning Wave 1",
        "zoneId": "Zone-A",
        "priority": "high",
        "orderCount": 8,
        "estimatedDuration": "2 hours",
        "status": "available"
      }
    ]
  }
}
```

## 🚀 Picker Operations

### Start Picking

**Endpoint:** `POST /api/picking/waves/:waveId/start`

**Description:** Starts a picking wave for a picker.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "pickerId": "PICKER001",
  "startTime": "2024-01-15T08:00:00.000Z"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "pickerId": "PICKER001",
    "startTime": "2024-01-15T08:00:00.000Z"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "pickerId": "PICKER001",
    "startTime": "2024-01-15T08:00:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Picking started successfully",
  "data": {
    "waveId": "WAVE-001",
    "pickerId": "PICKER001",
    "startTime": "2024-01-15T08:00:00.000Z",
    "status": "in_progress"
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
  "sku": "WH-001",
  "quantity": 2,
  "location": "A1-B2-C3",
  "timestamp": "2024-01-15T08:15:00.000Z"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/scan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sku": "WH-001",
    "quantity": 2,
    "location": "A1-B2-C3",
    "timestamp": "2024-01-15T08:15:00.000Z"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/scan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "sku": "WH-001",
    "quantity": 2,
    "location": "A1-B2-C3",
    "timestamp": "2024-01-15T08:15:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Item scanned successfully",
  "data": {
    "waveId": "WAVE-001",
    "sku": "WH-001",
    "quantity": 2,
    "location": "A1-B2-C3",
    "scannedAt": "2024-01-15T08:15:00.000Z",
    "remainingItems": 6
  }
}
```

### Report Partial Pick

**Endpoint:** `POST /api/picking/waves/:waveId/partial`

**Description:** Reports a partial pick when full quantity is not available.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "sku": "WH-001",
  "requestedQuantity": 2,
  "availableQuantity": 1,
  "reason": "Insufficient stock",
  "notes": "Only 1 item available in location"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/partial" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sku": "WH-001",
    "requestedQuantity": 2,
    "availableQuantity": 1,
    "reason": "Insufficient stock",
    "notes": "Only 1 item available in location"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/partial" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "sku": "WH-001",
    "requestedQuantity": 2,
    "availableQuantity": 1,
    "reason": "Insufficient stock",
    "notes": "Only 1 item available in location"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Partial pick reported successfully",
  "data": {
    "waveId": "WAVE-001",
    "sku": "WH-001",
    "requestedQuantity": 2,
    "availableQuantity": 1,
    "shortage": 1,
    "exceptionCreated": true
  }
}
```

### Complete Picking

**Endpoint:** `POST /api/picking/waves/:waveId/complete`

**Description:** Completes a picking wave.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "completionTime": "2024-01-15T10:30:00.000Z",
  "notes": "All items picked successfully",
  "exceptions": []
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "completionTime": "2024-01-15T10:30:00.000Z",
    "notes": "All items picked successfully",
    "exceptions": []
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/picking/waves/WAVE-001/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "completionTime": "2024-01-15T10:30:00.000Z",
    "notes": "All items picked successfully",
    "exceptions": []
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Picking completed successfully",
  "data": {
    "waveId": "WAVE-001",
    "completionTime": "2024-01-15T10:30:00.000Z",
    "totalItems": 8,
    "pickedItems": 8,
    "exceptions": 0,
    "duration": "2h 30m"
  }
}
```

## 📊 Monitoring & Analytics

### Get SLA Status

**Endpoint:** `GET /api/picking/sla-status`

**Description:** Retrieves SLA status for all picking waves.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/sla-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/sla-status" \
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
    "totalWaves": 5,
    "onTrack": 3,
    "atRisk": 1,
    "breached": 1,
    "averageCompletionTime": "2h 15m"
  }
}
```

### Get Expiry Alerts

**Endpoint:** `GET /api/picking/expiry-alerts`

**Description:** Retrieves alerts for items approaching expiry.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/expiry-alerts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/picking/expiry-alerts" \
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
    "alerts": [
      {
        "sku": "PERISH-001",
        "productName": "Fresh Produce",
        "expiryDate": "2024-01-16",
        "daysUntilExpiry": 1,
        "priority": "high"
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

## ⚠️ Error Responses

### Common Error Responses

**Unauthorized Access:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid access token",
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

**Wave Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Picking wave not found",
  "statusCode": 404
}
```

**User Off-Shift:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "User is currently off-shift",
  "statusCode": 403
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

## 🔐 Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Permission-Based Access**: Role-based access control (RBAC)
3. **Version Control**: Mobile app compatibility checking
4. **Availability Check**: User shift status validation
5. **Input Validation**: Comprehensive request validation

## 📋 Picking Operations Flow

### Web Client Flow
1. User authenticates with valid JWT token
2. User performs picking operations
3. System validates permissions and availability
4. Response is returned with operation result

### Mobile Client Flow
1. App sends request with version headers
2. System validates app version compatibility
3. User authenticates with valid JWT token
4. User performs picking operations
5. System validates permissions and availability
6. Response is returned with operation result
7. Version checking on every request

---

This document covers all picking module endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints require authentication, appropriate permissions, and user availability validation.

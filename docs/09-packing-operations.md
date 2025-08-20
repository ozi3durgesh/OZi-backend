# Packing Operations

This document covers all packing operation endpoints for the OZi Backend system.

**Base URL:** `http://13.232.150.239`

## 📦 Packing Job Operations

### Start Packing Job

**Endpoint:** `POST /api/packing/start`

**Description:** Starts a new packing job from completed picking wave.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "waveId": "WAVE-001",
  "packerId": "PACKER001",
  "priority": "high",
  "workflowType": "standard",
  "specialInstructions": "Handle fragile items with care"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/packing/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "waveId": "WAVE-001",
    "packerId": "PACKER001",
    "priority": "high",
    "workflowType": "standard",
    "specialInstructions": "Handle fragile items with care"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/packing/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "waveId": "WAVE-001",
    "packerId": "PACKER001",
    "priority": "high",
    "workflowType": "standard",
    "specialInstructions": "Handle fragile items with care"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": 1,
    "jobNumber": "PKG-1705310400000-abc123",
    "message": "Packing job started successfully (TEST MODE)",
    "waveId": "WAVE-001",
    "packerId": "PACKER001",
    "priority": "high",
    "workflowType": "standard",
    "specialInstructions": "Handle fragile items with care"
  }
}
```

### Verify Item

**Endpoint:** `POST /api/packing/verify`

**Description:** Verifies an item during packing process.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "jobId": 1,
  "orderId": "ORD-2024-001",
  "sku": "WH-001",
  "packedQuantity": 2,
  "verificationNotes": "Items verified and packed"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/packing/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobId": 1,
    "orderId": "ORD-2024-001",
    "sku": "WH-001",
    "packedQuantity": 2,
    "verificationNotes": "Items verified and packed"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/packing/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "jobId": 1,
    "orderId": "ORD-2024-001",
    "sku": "WH-001",
    "packedQuantity": 2,
    "verificationNotes": "Items verified and packed"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Item verified successfully (TEST MODE)",
    "jobId": 1,
    "orderId": "ORD-2024-001",
    "sku": "WH-001",
    "packedQuantity": 2,
    "verificationNotes": "Items verified and packed",
    "itemStatus": "VERIFIED"
  }
}
```

### Complete Packing Job

**Endpoint:** `POST /api/packing/complete`

**Description:** Completes packing job with photos and seals.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "jobId": 1,
  "photos": ["photo1.jpg", "photo2.jpg"],
  "seals": ["SEAL-001", "SEAL-002"],
  "completionNotes": "All items packed and sealed"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/packing/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobId": 1,
    "photos": ["photo1.jpg", "photo2.jpg"],
    "seals": ["SEAL-001", "SEAL-002"],
    "completionNotes": "All items packed and sealed"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/packing/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "jobId": 1,
    "photos": ["photo1.jpg", "photo2.jpg"],
    "seals": ["SEAL-001", "SEAL-002"],
    "completionNotes": "All items packed and sealed"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Packing job completed successfully (TEST MODE)",
    "jobId": 1,
    "photos": ["photo1.jpg", "photo2.jpg"],
    "seals": ["SEAL-001", "SEAL-002"],
    "completedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Job Status

**Endpoint:** `GET /api/packing/status/:jobId`

**Description:** Gets packing job status and progress.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/packing/status/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/packing/status/1" \
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
    "id": 1,
    "jobNumber": "PKG-1-TEST",
    "status": "PENDING",
    "progress": {
      "totalItems": 15,
      "packedItems": 0,
      "verifiedItems": 0,
      "percentage": 0
    },
    "sla": {
      "deadline": "2024-01-15T12:30:00.000Z",
      "remaining": 120,
      "status": "ON_TRACK"
    },
    "assignedPacker": {
      "id": 2,
      "name": "test@example.com"
    }
  }
}
```

### Get Jobs Awaiting Handover

**Endpoint:** `GET /api/packing/awaiting-handover`

**Description:** Gets jobs awaiting handover to couriers.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/packing/awaiting-handover" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/packing/awaiting-handover" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "jobNumber": "PKG-1-TEST",
      "status": "AWAITING_HANDOVER",
      "priority": "HIGH",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get SLA Status

**Endpoint:** `GET /api/packing/sla-status`

**Description:** Gets SLA status for all packing jobs.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/packing/sla-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/packing/sla-status" \
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
    "totalJobs": 1,
    "onTrack": 1,
    "atRisk": 0,
    "breached": 0,
    "averageRemainingTime": 120,
    "criticalJobs": 0
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

**Missing Required Fields:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "jobId is required",
  "statusCode": 400
}
```

**Job Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Packing job not found",
  "statusCode": 404
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
4. **Input Validation**: Comprehensive request validation
5. **Audit Logging**: Track all packing operations

## 📋 Packing Operations Flow

### Web Client Flow
1. User authenticates with valid JWT token
2. User performs packing operations
3. System validates permissions and processes request
4. Response is returned with operation result

### Mobile Client Flow
1. App sends request with version headers
2. System validates app version compatibility
3. User authenticates with valid JWT token
4. User performs packing operations
5. System validates permissions and processes request
6. Response is returned with operation result
7. Version checking on every request

---

This document covers all packing operation endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints require authentication and appropriate permissions.

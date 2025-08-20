# Packing Operations

This document covers all packing operation endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## 📦 Packing Job Management

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
  "waveId": 1,
  "packerId": 2,
  "priority": "HIGH",
  "workflowType": "DEDICATED_PACKER",
  "specialInstructions": "Handle with care - fragile items"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/packing/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "waveId": 1,
    "packerId": 2,
    "priority": "HIGH",
    "workflowType": "DEDICATED_PACKER",
    "specialInstructions": "Handle with care - fragile items"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/packing/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "waveId": 1,
    "packerId": 2,
    "priority": "HIGH",
    "workflowType": "DEDICATED_PACKER",
    "specialInstructions": "Handle with care - fragile items"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "jobId": 1,
    "jobNumber": "PKG-1642233600000-abc123",
    "message": "Packing job started successfully (TEST MODE)",
    "waveId": 1,
    "packerId": 2,
    "priority": "HIGH",
    "workflowType": "DEDICATED_PACKER",
    "specialInstructions": "Handle with care - fragile items"
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
  "orderId": 1,
  "sku": "SKU001",
  "packedQuantity": 2,
  "verificationNotes": "Item verified and packed"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/packing/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobId": 1,
    "orderId": 1,
    "sku": "SKU001",
    "packedQuantity": 2,
    "verificationNotes": "Item verified and packed"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/packing/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "jobId": 1,
    "orderId": 1,
    "sku": "SKU001",
    "packedQuantity": 2,
    "verificationNotes": "Item verified and packed"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Item verified successfully (TEST MODE)",
    "jobId": 1,
    "orderId": 1,
    "sku": "SKU001",
    "packedQuantity": 2,
    "verificationNotes": "Item verified and packed",
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
  "photos": [
    {
      "photoType": "POST_PACK",
      "photoUrl": "https://example.com/photo1.jpg",
      "orderId": 1
    }
  ],
  "seals": [
    {
      "sealNumber": "SEAL001",
      "sealType": "PLASTIC",
      "orderId": 1
    }
  ]
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/packing/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobId": 1,
    "photos": [
      {
        "photoType": "POST_PACK",
        "photoUrl": "https://example.com/photo1.jpg",
        "orderId": 1
      }
    ],
    "seals": [
      {
        "sealNumber": "SEAL001",
        "sealType": "PLASTIC",
        "orderId": 1
      }
    ]
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/packing/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "jobId": 1,
    "photos": [
      {
        "photoType": "POST_PACK",
        "photoUrl": "https://example.com/photo1.jpg",
        "orderId": 1
      }
    ],
    "seals": [
      {
        "sealNumber": "SEAL001",
        "sealType": "PLASTIC",
        "orderId": 1
      }
    ]
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Packing job completed successfully (TEST MODE)",
    "jobId": 1,
    "photos": [
      {
        "photoType": "POST_PACK",
        "photoUrl": "https://example.com/photo1.jpg",
        "orderId": 1
      }
    ],
    "seals": [
      {
        "sealNumber": "SEAL001",
        "sealType": "PLASTIC",
        "orderId": 1
      }
    ],
    "completedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 📊 Job Status & Monitoring

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
curl -X GET "http://localhost:3000/api/packing/status/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/packing/status/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "statusCode": 200,
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

**Description:** Gets jobs that are completed and awaiting handover.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/packing/awaiting-handover" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/packing/awaiting-handover" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "statusCode": 200,
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
curl -X GET "http://localhost:3000/api/packing/sla-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/packing/sla-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "statusCode": 200,
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

### Device Management
- Mobile apps should provide unique device identifiers
- Platform detection (ios/android) for analytics
- Secure token storage using platform-specific methods

## ⚠️ Error Responses

### Common Error Responses

**Unauthorized Access:**
```json
{
  "statusCode": 401,
  "success": false,
  "error": "Unauthorized"
}
```

**Missing Required Fields:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "waveId is required"
}
```

**Invalid Job ID:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "jobId, orderId, sku, and packedQuantity are required"
}
```

**Job Not Found:**
```json
{
  "statusCode": 404,
  "success": false,
  "error": "Job not found"
}
```

**Internal Server Error:**
```json
{
  "statusCode": 500,
  "success": false,
  "error": "Failed to start packing job"
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
2. **Input Validation**: Comprehensive request validation
3. **Error Handling**: Proper error responses with status codes
4. **Version Control**: Mobile app compatibility checking
5. **Audit Logging**: Track all packing operations

## 📋 Operation Flow

### Packing Job Creation Flow
1. User provides wave ID and packing parameters
2. System validates required fields
3. System creates packing job
4. Success response with job details

### Item Verification Flow
1. User provides item verification details
2. System validates required fields
3. System processes verification
4. Success response with verification status

### Job Completion Flow
1. User provides completion details (photos, seals)
2. System validates required fields
3. System completes packing job
4. Success response with completion confirmation

---

This document covers all packing operation endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.

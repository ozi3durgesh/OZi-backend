# Packing Operations

This document covers all packing operations endpoints for the OZi Backend system.

## 📦 Packing Job Management

### Create Packing Job

**Endpoint:** `POST /api/v1/packing/jobs`

**Description:** Creates a new packing job for an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "orderId": "ORD-2024-001",
  "assignedPacker": "PACKER001",
  "priority": "high",
  "packingStation": "Station-A",
  "estimatedDuration": 30,
  "specialInstructions": "Handle with care - fragile items",
  "requiredMaterials": ["bubble_wrap", "packing_tape", "box_large"],
  "startTime": "2024-01-15T10:00:00.000Z",
  "deadline": "2024-01-15T14:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "orderId": "ORD-2024-001",
    "assignedPacker": "PACKER001",
    "priority": "high",
    "packingStation": "Station-A",
    "estimatedDuration": 30,
    "specialInstructions": "Handle with care - fragile items",
    "requiredMaterials": ["bubble_wrap", "packing_tape", "box_large"],
    "startTime": "2024-01-15T10:00:00.000Z",
    "deadline": "2024-01-15T14:00:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Packing job created successfully",
  "data": {
    "job": {
      "id": "PKG-001",
      "orderId": "ORD-2024-001",
      "status": "created",
      "assignedPacker": "PACKER001",
      "priority": "high",
      "packingStation": "Station-A",
      "estimatedDuration": 30,
      "createdAt": "2024-01-15T09:30:00.000Z"
    }
  }
}
```

### Get All Packing Jobs

**Endpoint:** `GET /api/v1/packing/jobs`

**Description:** Retrieves all packing jobs with filtering and pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `status` (optional): Filter by status (created, in_progress, completed, cancelled)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `packerId` (optional): Filter by assigned packer
- `packingStation` (optional): Filter by packing station
- `dateFrom` (optional): Filter by creation date
- `dateTo` (optional): Filter by creation date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/jobs?page=1&limit=10&status=in_progress&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "PKG-001",
        "orderId": "ORD-2024-001",
        "status": "in_progress",
        "assignedPacker": "PACKER001",
        "priority": "high",
        "packingStation": "Station-A",
        "estimatedDuration": 30,
        "elapsedTime": 15,
        "createdAt": "2024-01-15T09:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### Get Packing Job by ID

**Endpoint:** `GET /api/v1/packing/jobs/:id`

**Description:** Retrieves a specific packing job by its ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "PKG-001",
      "orderId": "ORD-2024-001",
      "status": "in_progress",
      "assignedPacker": {
        "id": "PACKER001",
        "name": "John Packer",
        "status": "active"
      },
      "priority": "high",
      "packingStation": "Station-A",
      "estimatedDuration": 30,
      "elapsedTime": 15,
      "specialInstructions": "Handle with care - fragile items",
      "requiredMaterials": ["bubble_wrap", "packing_tape", "box_large"],
      "startTime": "2024-01-15T10:00:00.000Z",
      "deadline": "2024-01-15T14:00:00.000Z",
      "orderDetails": {
        "customerName": "John Doe",
        "items": [
          {
            "productName": "Wireless Headphones",
            "quantity": 2,
            "fragile": true
          }
        ]
      },
      "createdAt": "2024-01-15T09:30:00.000Z",
      "updatedAt": "2024-01-15T10:15:00.000Z"
    }
  }
}
```

### Start Packing Job

**Endpoint:** `POST /api/v1/packing/jobs/:id/start`

**Description:** Starts a packing job.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "startedAt": "2024-01-15T10:00:00.000Z",
  "packerNotes": "Starting packing job. All materials available."
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "startedAt": "2024-01-15T10:00:00.000Z",
    "packerNotes": "Starting packing job. All materials available."
  }'
```

### Complete Packing Job

**Endpoint:** `POST /api/v1/packing/jobs/:id/complete`

**Description:** Marks a packing job as completed.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "completedAt": "2024-01-15T10:45:00.000Z",
  "actualDuration": 45,
  "completionNotes": "All items packed securely with bubble wrap",
  "qualityCheck": "passed",
  "sealNumber": "SEAL-2024-001"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "completedAt": "2024-01-15T10:45:00.000Z",
    "actualDuration": 45,
    "completionNotes": "All items packed securely with bubble wrap",
    "qualityCheck": "passed",
    "sealNumber": "SEAL-2024-001"
  }'
```

## 📸 Photo Evidence Management

### Upload Packing Photo

**Endpoint:** `POST /api/v1/packing/jobs/:id/photos`

**Description:** Uploads a photo as evidence for packing completion.

**Headers:**
```bash
Content-Type: multipart/form-data
Authorization: Bearer your_jwt_token
```

**Form Data:**
- `photo` (required): Photo file
- `type` (required): Photo type (packed_items, sealed_package, quality_check)
- `description` (optional): Photo description
- `notes` (optional): Additional notes

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001/photos" \
  -H "Authorization: Bearer your_jwt_token" \
  -F "photo=@packing_photo.jpg" \
  -F "type=packed_items" \
  -F "description=Items packed with bubble wrap" \
  -F "notes=All fragile items properly protected"
```

**Response:**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "photo": {
      "id": "PHOTO-001",
      "jobId": "PKG-001",
      "type": "packed_items",
      "url": "https://s3.amazonaws.com/bucket/packing_photo.jpg",
      "description": "Items packed with bubble wrap",
      "notes": "All fragile items properly protected",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Packing Photos

**Endpoint:** `GET /api/v1/packing/jobs/:id/photos`

**Description:** Retrieves all photos for a specific packing job.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001/photos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "PKG-001",
    "photos": [
      {
        "id": "PHOTO-001",
        "type": "packed_items",
        "url": "https://s3.amazonaws.com/bucket/packing_photo.jpg",
        "description": "Items packed with bubble wrap",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "PHOTO-002",
        "type": "sealed_package",
        "url": "https://s3.amazonaws.com/bucket/sealed_package.jpg",
        "description": "Package sealed with security seal",
        "uploadedAt": "2024-01-15T10:45:00.000Z"
      }
    ]
  }
}
```

### Delete Packing Photo

**Endpoint:** `DELETE /api/v1/packing/photos/:photoId`

**Description:** Deletes a specific packing photo.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "https://your-app.onrender.com/api/v1/packing/photos/PHOTO-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔒 Seal Generation and Management

### Generate Security Seal

**Endpoint:** `POST /api/v1/packing/jobs/:id/seal`

**Description:** Generates a security seal for a packed package.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "sealType": "tamper_evident",
  "generatedBy": "PACKER001",
  "notes": "Standard security seal applied"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001/seal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sealType": "tamper_evident",
    "generatedBy": "PACKER001",
    "notes": "Standard security seal applied"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Security seal generated successfully",
  "data": {
    "seal": {
      "id": "SEAL-001",
      "sealNumber": "SEAL-2024-001",
      "jobId": "PKG-001",
      "sealType": "tamper_evident",
      "generatedBy": "PACKER001",
      "generatedAt": "2024-01-15T10:45:00.000Z",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "status": "active"
    }
  }
}
```

### Verify Security Seal

**Endpoint:** `POST /api/v1/packing/seals/verify`

**Description:** Verifies the authenticity of a security seal.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "sealNumber": "SEAL-2024-001",
  "verificationMethod": "qr_scan",
  "verifiedBy": "DELIVERY001",
  "location": "Delivery Center"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/seals/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sealNumber": "SEAL-2024-001",
    "verificationMethod": "qr_scan",
    "verifiedBy": "DELIVERY001",
    "location": "Delivery Center"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "seal": {
      "id": "SEAL-001",
      "sealNumber": "SEAL-2024-001",
      "jobId": "PKG-001",
      "status": "verified",
      "generatedAt": "2024-01-15T10:45:00.000Z",
      "verifiedAt": "2024-01-15T14:00:00.000Z"
    },
    "message": "Seal verified successfully"
  }
}
```

## 📋 Packing Checklist Management

### Get Packing Checklist

**Endpoint:** `GET /api/v1/packing/jobs/:id/checklist`

**Description:** Retrieves the packing checklist for a specific job.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001/checklist" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "PKG-001",
    "checklist": [
      {
        "id": 1,
        "item": "Verify all items are present",
        "completed": true,
        "completedBy": "PACKER001",
        "completedAt": "2024-01-15T10:15:00.000Z"
      },
      {
        "id": 2,
        "item": "Apply appropriate packaging materials",
        "completed": true,
        "completedBy": "PACKER001",
        "completedAt": "2024-01-15T10:25:00.000Z"
      },
      {
        "id": 3,
        "item": "Seal package securely",
        "completed": false,
        "completedBy": null,
        "completedAt": null
      }
    ],
    "totalItems": 3,
    "completedItems": 2,
    "remainingItems": 1
  }
}
```

### Update Checklist Item

**Endpoint:** `PATCH /api/v1/packing/jobs/:id/checklist/:itemId`

**Description:** Updates the status of a checklist item.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "completed": true,
  "completedBy": "PACKER001",
  "completedAt": "2024-01-15T10:45:00.000Z",
  "notes": "Package sealed with security seal"
}
```

**cURL Example:**
```bash
curl -X PATCH "https://your-app.onrender.com/api/v1/packing/jobs/PKG-001/checklist/3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "completed": true,
    "completedBy": "PACKER001",
    "completedAt": "2024-01-15T10:45:00.000Z",
    "notes": "Package sealed with security seal"
  }'
```

## 📱 Mobile Packing Operations

### Get Packer's Active Jobs

**Endpoint:** `GET /api/v1/packing/packer/:packerId/jobs`

**Description:** Retrieves active packing jobs for a specific packer.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/packer/PACKER001/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Start Packing Session

**Endpoint:** `POST /api/v1/packing/packer/:packerId/session/start`

**Description:** Starts a packing session for a packer.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "jobId": "PKG-001",
  "deviceId": "MOBILE-001",
  "packingStation": "Station-A",
  "startTime": "2024-01-15T10:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/packer/PACKER001/session/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobId": "PKG-001",
    "deviceId": "MOBILE-001",
    "packingStation": "Station-A",
    "startTime": "2024-01-15T10:00:00.000Z"
  }'
```

### End Packing Session

**Endpoint:** `POST /api/v1/packing/packer/:packerId/session/end`

**Description:** Ends a packing session for a packer.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "jobId": "PKG-001",
  "endTime": "2024-01-15T10:45:00.000Z",
  "itemsPacked": 5,
  "totalItems": 5,
  "sessionNotes": "All items packed successfully with proper protection."
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/packer/PACKER001/session/end" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobId": "PKG-001",
    "endTime": "2024-01-15T10:45:00.000Z",
    "itemsPacked": 5,
    "totalItems": 5,
    "sessionNotes": "All items packed successfully with proper protection."
  }'
```

## 📊 Packing Analytics

### Get Packing Statistics

**Endpoint:** `GET /api/v1/packing/statistics`

**Description:** Retrieves statistics about packing operations.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `dateFrom` (optional): Start date for statistics
- `dateTo` (optional): End date for statistics
- `packingStation` (optional): Filter by packing station

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/statistics?dateFrom=2024-01-01&dateTo=2024-01-31&packingStation=Station-A" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 120,
    "completedJobs": 115,
    "inProgressJobs": 3,
    "cancelledJobs": 2,
    "totalOrders": 120,
    "completedOrders": 115,
    "averageJobDuration": 35,
    "averageItemsPerHour": 15,
    "packerPerformance": [
      {
        "packerId": "PACKER001",
        "packerName": "John Packer",
        "jobsCompleted": 25,
        "itemsPacked": 125,
        "averageTime": 32
      }
    ],
    "stationPerformance": [
      {
        "station": "Station-A",
        "jobsCompleted": 45,
        "averageDuration": 30
      }
    ],
    "qualityMetrics": {
      "passedChecks": 110,
      "failedChecks": 5,
      "passRate": 95.65
    }
  }
}
```

### Get Packing Performance Report

**Endpoint:** `GET /api/v1/packing/performance-report`

**Description:** Generates a detailed packing performance report.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `format` (optional): Report format (json, csv, pdf)
- `dateFrom` (required): Start date for the report
- `dateTo` (required): End date for the report
- `packerId` (optional): Specific packer ID for detailed report
- `packingStation` (optional): Filter by packing station

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/performance-report?format=json&dateFrom=2024-01-01&dateTo=2024-01-31&packingStation=Station-A" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔍 Packing Search and Filtering

### Search Packing Jobs

**Endpoint:** `GET /api/v1/packing/jobs/search`

**Description:** Advanced search for packing jobs with multiple criteria.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (required): Search query
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `packingStation` (optional): Filter by packing station
- `packerId` (optional): Filter by assigned packer
- `dateFrom` (optional): Filter by creation date
- `dateTo` (optional): Filter by creation date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/jobs/search?q=ORD-2024&status=in_progress&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Get Packing Jobs by Station

**Endpoint:** `GET /api/v1/packing/stations/:stationName/jobs`

**Description:** Retrieves all packing jobs for a specific station.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/packing/stations/Station-A/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔄 Bulk Packing Operations

### Bulk Create Packing Jobs

**Endpoint:** `POST /api/v1/packing/jobs/bulk`

**Description:** Creates multiple packing jobs at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "jobs": [
    {
      "orderId": "ORD-2024-002",
      "assignedPacker": "PACKER002",
      "priority": "medium",
      "packingStation": "Station-B"
    },
    {
      "orderId": "ORD-2024-003",
      "assignedPacker": "PACKER001",
      "priority": "high",
      "packingStation": "Station-A"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/packing/jobs/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobs": [
      {
        "orderId": "ORD-2024-002",
        "assignedPacker": "PACKER002",
        "priority": "medium",
        "packingStation": "Station-B"
      },
      {
        "orderId": "ORD-2024-003",
        "assignedPacker": "PACKER001",
        "priority": "high",
        "packingStation": "Station-A"
      }
    ]
  }'
```

### Bulk Update Job Status

**Endpoint:** `PUT /api/v1/packing/jobs/bulk/status`

**Description:** Updates the status of multiple packing jobs at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "jobs": [
    {
      "id": "PKG-001",
      "status": "completed"
    },
    {
      "id": "PKG-002",
      "status": "in_progress"
    }
  ],
  "notes": "Bulk status update"
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/packing/jobs/bulk/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "jobs": [
      {
        "id": "PKG-001",
        "status": "completed"
      },
      {
        "id": "PKG-002",
        "status": "in_progress"
      }
    ],
    "notes": "Bulk status update"
  }'
```

## ⚠️ Error Responses

### Common Error Responses

**Job Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Packing job not found",
  "statusCode": 404
}
```

**Invalid Job Status:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid job status transition",
  "statusCode": 400
}
```

**Job Already Started:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Job is already in progress",
  "statusCode": 409
}
```

**Photo Upload Failed:**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to upload photo",
  "statusCode": 500
}
```

**Seal Generation Failed:**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to generate security seal",
  "statusCode": 500
}
```

## 🔐 Security Considerations

1. **Permission-Based Access**: Packing operations require appropriate permissions
2. **Status Validation**: Job status changes follow business rules
3. **Audit Logging**: All packing activities are logged for tracking
4. **Photo Security**: Uploaded photos are validated and stored securely
5. **Seal Integrity**: Security seals are cryptographically secure
6. **Data Integrity**: Packing data is validated and sanitized

## 📋 Best Practices

1. **Job Planning**: Plan packing jobs based on order priority and packer availability
2. **Station Management**: Organize packing by stations for efficiency
3. **Quality Control**: Implement comprehensive quality checks
4. **Photo Documentation**: Require photos for all critical packing steps
5. **Seal Management**: Generate and track security seals for all packages
6. **Performance Monitoring**: Track packer performance and job completion times
7. **Mobile Optimization**: Ensure mobile app is optimized for packing operations
8. **Real-time Updates**: Provide real-time updates on job and order status

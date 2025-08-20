# Packing Operations

This module handles packing job creation, item verification, and job completion. Users need `packing:execute` permission to access these endpoints.

## Start Packing Job

### Begin New Packing Job
Start a new packing job from a completed picking wave.

**Endpoint:** `POST /api/packing/start`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "waveId": "WAVE-2024-001",
  "packerId": 7,
  "priority": "high",
  "workflowType": "standard",
  "specialInstructions": "Handle fragile items with care"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/packing/start" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "waveId": "WAVE-2024-001",
    "packerId": 7,
    "priority": "high",
    "workflowType": "standard",
    "specialInstructions": "Handle fragile items with care"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "jobId": 1,
    "jobNumber": "PKG-2024-001",
    "waveId": "WAVE-2024-001",
    "packerId": 7,
    "packerName": "David Packer",
    "priority": "high",
    "workflowType": "standard",
    "specialInstructions": "Handle fragile items with care",
    "status": "started",
    "startedAt": "2024-01-01T22:00:00.000Z",
    "items": [
      {
        "orderId": "ORD-2024-001",
        "sku": "PROD-001",
        "description": "Product Description",
        "quantity": 2,
        "pickingStatus": "completed",
        "packingStatus": "pending"
      },
      {
        "orderId": "ORD-2024-002",
        "sku": "PROD-002",
        "description": "Another Product",
        "quantity": 1,
        "pickingStatus": "completed",
        "packingStatus": "pending"
      }
    ],
    "estimatedDuration": 45,
    "message": "Packing job started successfully"
  },
  "error": null
}
```

## Verify Item

### Verify Item During Packing
Verify an item during the packing process.

**Endpoint:** `POST /api/packing/verify`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "jobId": 1,
  "orderId": "ORD-2024-001",
  "sku": "PROD-001",
  "packedQuantity": 2,
  "verificationNotes": "Items in good condition, properly packaged"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/packing/verify" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "orderId": "ORD-2024-001",
    "sku": "PROD-001",
    "packedQuantity": 2,
    "verificationNotes": "Items in good condition, properly packaged"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "jobId": 1,
    "orderId": "ORD-2024-001",
    "sku": "PROD-001",
    "packedQuantity": 2,
    "verificationNotes": "Items in good condition, properly packaged",
    "itemStatus": "VERIFIED",
    "verifiedAt": "2024-01-01T22:05:00.000Z",
    "verifiedBy": 7,
    "progress": {
      "totalItems": 3,
      "verifiedItems": 1,
      "percentage": 33.33
    },
    "nextItem": {
      "orderId": "ORD-2024-002",
      "sku": "PROD-002",
      "description": "Another Product",
      "quantity": 1
    },
    "message": "Item verified successfully"
  },
  "error": null
}
```

## Complete Packing Job

### Finish Packing Job
Complete a packing job with photos and seals.

**Endpoint:** `POST /api/packing/complete`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "jobId": 1,
  "photos": [
    {
      "type": "package_front",
      "url": "https://example.com/photos/package_front_001.jpg",
      "timestamp": "2024-01-01T22:15:00.000Z"
    },
    {
      "type": "package_back",
      "url": "https://example.com/photos/package_back_001.jpg",
      "timestamp": "2024-01-01T22:15:00.000Z"
    }
  ],
  "seals": [
    {
      "sealNumber": "SEAL-001",
      "type": "tamper_evident",
      "appliedAt": "2024-01-01T22:15:00.000Z"
    }
  ],
  "packagingDetails": {
    "boxSize": "medium",
    "weight": 2.5,
    "dimensions": "12x8x6 inches"
  },
  "completionNotes": "All items packed securely with proper padding"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/packing/complete" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "photos": [
      {
        "type": "package_front",
        "url": "https://example.com/photos/package_front_001.jpg",
        "timestamp": "2024-01-01T22:15:00.000Z"
      },
      {
        "type": "package_back",
        "url": "https://example.com/photos/package_back_001.jpg",
        "timestamp": "2024-01-01T22:15:00.000Z"
      }
    ],
    "seals": [
      {
        "sealNumber": "SEAL-001",
        "type": "tamper_evident",
        "appliedAt": "2024-01-01T22:15:00.000Z"
      }
    ],
    "packagingDetails": {
      "boxSize": "medium",
      "weight": 2.5,
      "dimensions": "12x8x6 inches"
    },
    "completionNotes": "All items packed securely with proper padding"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "jobId": 1,
    "jobNumber": "PKG-2024-001",
    "status": "completed",
    "completedAt": "2024-01-01T22:15:00.000Z",
    "completedBy": 7,
    "duration": 900,
    "summary": {
      "totalItems": 3,
      "packedItems": 3,
      "verifiedItems": 3,
      "photosTaken": 2,
      "sealsApplied": 1
    },
    "packagingDetails": {
      "boxSize": "medium",
      "weight": 2.5,
      "dimensions": "12x8x6 inches"
    },
    "photos": [
      {
        "type": "package_front",
        "url": "https://example.com/photos/package_front_001.jpg",
        "timestamp": "2024-01-01T22:15:00.000Z"
      },
      {
        "type": "package_back",
        "url": "https://example.com/photos/package_back_001.jpg",
        "timestamp": "2024-01-01T22:15:00.000Z"
      }
    ],
    "seals": [
      {
        "sealNumber": "SEAL-001",
        "type": "tamper_evident",
        "appliedAt": "2024-01-01T22:15:00.000Z"
      }
    ],
    "nextSteps": [
      "Move package to handover area",
      "Update job status in system",
      "Notify handover team"
    ],
    "message": "Packing job completed successfully"
  },
  "error": null
}
```

## Get Job Status

### Check Packing Job Status
Get the current status of a packing job.

**Endpoint:** `GET /api/packing/status/:jobId`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/packing/status/1" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 1,
    "jobNumber": "PKG-2024-001",
    "status": "in_progress",
    "progress": {
      "totalItems": 3,
      "packedItems": 1,
      "verifiedItems": 1,
      "percentage": 33.33
    },
    "sla": {
      "deadline": "2024-01-01T23:00:00.000Z",
      "remaining": 2700,
      "status": "ON_TRACK"
    },
    "assignedPacker": {
      "id": 7,
      "name": "David Packer"
    },
    "waveInfo": {
      "waveId": "WAVE-2024-001",
      "priority": "high",
      "startedAt": "2024-01-01T22:00:00.000Z"
    },
    "items": [
      {
        "orderId": "ORD-2024-001",
        "sku": "PROD-001",
        "description": "Product Description",
        "quantity": 2,
        "packingStatus": "completed",
        "verificationStatus": "verified"
      },
      {
        "orderId": "ORD-2024-002",
        "sku": "PROD-002",
        "description": "Another Product",
        "quantity": 1,
        "packingStatus": "pending",
        "verificationStatus": "pending"
      }
    ],
    "estimatedCompletion": "2024-01-01T22:45:00.000Z"
  },
  "error": null
}
```

## Get Jobs Awaiting Handover

### List Completed Jobs Ready for Handover
Get a list of completed packing jobs ready for handover to delivery.

**Endpoint:** `GET /api/packing/awaiting-handover`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `warehouseId` (optional): Filter by warehouse
- `priority` (optional): Filter by priority level

**cURL Example:**
```bash
# Get all jobs awaiting handover
curl -X GET "http://localhost:3000/api/packing/awaiting-handover" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by priority
curl -X GET "http://localhost:3000/api/packing/awaiting-handover?priority=high" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": 1,
      "jobNumber": "PKG-2024-001",
      "status": "AWAITING_HANDOVER",
      "priority": "high",
      "completedAt": "2024-01-01T22:15:00.000Z",
      "packerName": "David Packer",
      "packageDetails": {
        "weight": 2.5,
        "dimensions": "12x8x6 inches",
        "sealCount": 1
      },
      "orders": [
        {
          "orderId": "ORD-2024-001",
          "customerName": "John Doe",
          "priority": "high"
        }
      ],
      "estimatedHandoverTime": "2024-01-01T22:30:00.000Z"
    },
    {
      "id": 2,
      "jobNumber": "PKG-2024-002",
      "status": "AWAITING_HANDOVER",
      "priority": "normal",
      "completedAt": "2024-01-01T22:20:00.000Z",
      "packerName": "Sarah Packer",
      "packageDetails": {
        "weight": 1.8,
        "dimensions": "10x6x4 inches",
        "sealCount": 1
      },
      "orders": [
        {
          "orderId": "ORD-2024-002",
          "customerName": "Jane Smith",
          "priority": "normal"
        }
      ],
      "estimatedHandoverTime": "2024-01-01T22:45:00.000Z"
    }
  ],
  "error": null
}
```

## Get SLA Status

### Check Packing SLA Status
Get the SLA status for all packing jobs.

**Endpoint:** `GET /api/packing/sla-status`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/packing/sla-status" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "overview": {
      "totalJobs": 8,
      "onTrack": 6,
      "atRisk": 1,
      "breached": 1,
      "averageCompletionTime": 35
    },
    "slaDetails": [
      {
        "jobId": 1,
        "jobNumber": "PKG-2024-001",
        "status": "on_track",
        "priority": "high",
        "startedAt": "2024-01-01T22:00:00.000Z",
        "deadline": "2024-01-01T23:00:00.000Z",
        "remaining": 2700,
        "progress": 33.33
      },
      {
        "jobId": 2,
        "jobNumber": "PKG-2024-002",
        "status": "at_risk",
        "priority": "normal",
        "startedAt": "2024-01-01T21:30:00.000Z",
        "deadline": "2024-01-01T23:30:00.000Z",
        "remaining": 1800,
        "progress": 50
      }
    ],
    "recommendations": [
      "Prioritize high-priority jobs",
      "Reassign at-risk jobs to experienced packers",
      "Monitor job progress more frequently"
    ]
  },
  "error": null
}
```

## Packing Workflow Examples

### 1. Complete Packing Job
```bash
# Start packing job
curl -X POST "http://localhost:3000/api/packing/start" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "waveId": "WAVE-2024-001",
    "packerId": 7,
    "priority": "high",
    "workflowType": "standard",
    "specialInstructions": "Handle fragile items with care"
  }'

# Verify first item
curl -X POST "http://localhost:3000/api/packing/verify" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "orderId": "ORD-2024-001",
    "sku": "PROD-001",
    "packedQuantity": 2,
    "verificationNotes": "Items in good condition"
  }'

# Complete job
curl -X POST "http://localhost:3000/api/packing/complete" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "photos": [
      {
        "type": "package_front",
        "url": "https://example.com/photos/package_front_001.jpg",
        "timestamp": "2024-01-01T22:15:00.000Z"
      }
    ],
    "seals": [
      {
        "sealNumber": "SEAL-001",
        "type": "tamper_evident",
        "appliedAt": "2024-01-01T22:15:00.000Z"
      }
    ],
    "packagingDetails": {
      "boxSize": "medium",
      "weight": 2.5,
      "dimensions": "12x8x6 inches"
    },
    "completionNotes": "All items packed securely"
  }'
```

### 2. Check Job Progress
```bash
# Get job status
curl -X GET "http://localhost:3000/api/packing/status/1" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get SLA status
curl -X GET "http://localhost:3000/api/packing/sla-status" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Packing Job Types

### Available Workflow Types
The system supports various packing workflow types:

#### 1. Standard Packing
- **Type**: `standard`
- **Description**: Regular packing process
- **Steps**: Verify items, pack in box, apply seals, take photos

#### 2. Fragile Items
- **Type**: `fragile`
- **Description**: Special handling for delicate items
- **Steps**: Extra padding, fragile stickers, careful packaging

#### 3. Bulk Orders
- **Type**: `bulk`
- **Description**: Large quantity orders
- **Steps**: Multiple boxes, palletization, shipping labels

#### 4. Express Packing
- **Type**: `express`
- **Description**: Fast-track packing for urgent orders
- **Steps**: Prioritized processing, expedited verification

## Photo Requirements

### Required Photo Types
Each packing job requires specific photos:

#### 1. Package Front
- **Purpose**: Show package contents and condition
- **Requirements**: Clear view of items, no obstructions

#### 2. Package Back
- **Purpose**: Show package sealing and labels
- **Requirements**: Visible seals, shipping labels

#### 3. Package Side
- **Purpose**: Show package dimensions and condition
- **Requirements**: Clear view of all sides

#### 4. Special Instructions
- **Purpose**: Document any special handling
- **Requirements**: Clear documentation of requirements

## Seal Types

### Available Seal Types
The system supports various seal types:

#### 1. Tamper Evident
- **Type**: `tamper_evident`
- **Description**: Shows if package has been opened
- **Use**: High-value or sensitive items

#### 2. Security Tape
- **Type**: `security_tape`
- **Description**: Strong adhesive tape
- **Use**: General packaging

#### 3. Cable Ties
- **Type**: `cable_ties`
- **Description**: Plastic zip ties
- **Use**: Box closure and security

#### 4. Custom Seals
- **Type**: `custom`
- **Description**: Company-specific seals
- **Use**: Branded packaging

## Error Responses

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions. Required: packing:execute"
}
```

### Job Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Packing job not found"
}
```

### Job Already Started
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Job is already in progress"
}
```

### Invalid Item Verification
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid item verification: SKU not found in job"
}
```

### Missing Required Photos
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Missing required photos: package_front, package_back"
}
```

## Best Practices

### Packing Operations
- Verify items before packing
- Use appropriate packaging materials
- Apply seals securely
- Take clear, high-quality photos

### Quality Control
- Check item condition
- Verify quantities
- Ensure proper packaging
- Document any issues

### SLA Management
- Monitor job progress
- Prioritize high-priority jobs
- Handle exceptions promptly
- Maintain quality standards

## Mobile App Integration

### Packing Interface
- Show job details clearly
- Display item information prominently
- Provide verification tools
- Show real-time progress

### Photo Capture
- High-quality camera integration
- Photo type selection
- Automatic timestamping
- Upload to cloud storage

### Offline Handling
- Cache job information
- Queue verifications
- Sync when connection restored
- Handle conflicts gracefully

### User Experience
- Intuitive workflow
- Clear status indicators
- Quick verification process
- Progress tracking

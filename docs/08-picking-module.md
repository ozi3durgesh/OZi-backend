# Picking Module

This module handles picking wave generation, assignment, and execution. Users need appropriate picking permissions to access these endpoints.

## Generate Picking Waves

### Create New Picking Waves
Generate picking waves based on pending orders and warehouse capacity.

**Endpoint:** `POST /api/picking/waves/generate`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "warehouseId": 1,
  "priority": "high",
  "maxItemsPerWave": 50,
  "includeExpiringItems": true,
  "waveType": "standard"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/generate" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": 1,
    "priority": "high",
    "maxItemsPerWave": 50,
    "includeExpiringItems": true,
    "waveType": "standard"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "wavesGenerated": 3,
    "totalItems": 125,
    "waves": [
      {
        "waveId": "WAVE-2024-001",
        "status": "pending",
        "priority": "high",
        "itemCount": 45,
        "estimatedDuration": 120,
        "assignedPicker": null,
        "createdAt": "2024-01-01T21:00:00.000Z"
      },
      {
        "waveId": "WAVE-2024-002",
        "status": "pending",
        "priority": "high",
        "itemCount": 38,
        "estimatedDuration": 95,
        "assignedPicker": null,
        "createdAt": "2024-01-01T21:00:00.000Z"
      },
      {
        "waveId": "WAVE-2024-003",
        "status": "pending",
        "priority": "high",
        "itemCount": 42,
        "estimatedDuration": 105,
        "assignedPicker": null,
        "createdAt": "2024-01-01T21:00:00.000Z"
      }
    ],
    "message": "Picking waves generated successfully"
  },
  "error": null
}
```

## Assign Picking Waves

### Assign Waves to Pickers
Assign picking waves to available pickers.

**Endpoint:** `GET /api/picking/waves/assign`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `warehouseId` (optional): Filter by warehouse
- `priority` (optional): Filter by priority level
- `pickerId` (optional): Assign to specific picker

**cURL Example:**
```bash
# Get available waves for assignment
curl -X GET "http://localhost:3000/api/picking/waves/assign" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Assign to specific picker
curl -X GET "http://localhost:3000/api/picking/waves/assign?pickerId=5" \
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
    "availableWaves": [
      {
        "waveId": "WAVE-2024-001",
        "status": "pending",
        "priority": "high",
        "itemCount": 45,
        "estimatedDuration": 120,
        "orders": [
          {
            "orderId": "ORD-2024-001",
            "priority": "high",
            "itemCount": 2
          },
          {
            "orderId": "ORD-2024-002",
            "priority": "normal",
            "itemCount": 1
          }
        ],
        "zones": ["A1", "B2", "C3"],
        "assignedPicker": null
      }
    ],
    "availablePickers": [
      {
        "pickerId": 5,
        "name": "John Picker",
        "currentStatus": "available",
        "lastWaveCompleted": "2024-01-01T20:30:00.000Z",
        "averagePickRate": 25
      },
      {
        "pickerId": 8,
        "name": "Sarah Picker",
        "currentStatus": "available",
        "lastWaveCompleted": "2024-01-01T20:45:00.000Z",
        "averagePickRate": 30
      }
    ],
    "assignmentSuggestions": [
      {
        "waveId": "WAVE-2024-001",
        "suggestedPicker": 5,
        "reason": "Best match for zones and experience",
        "estimatedEfficiency": 0.95
      }
    ]
  },
  "error": null
}
```

## Get Available Waves

### List Available Picking Waves
Get a list of available picking waves for the authenticated user.

**Endpoint:** `GET /api/picking/waves/available`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `warehouseId` (optional): Filter by warehouse
- `priority` (optional): Filter by priority level
- `zone` (optional): Filter by warehouse zone

**cURL Example:**
```bash
# Get all available waves
curl -X GET "http://localhost:3000/api/picking/waves/available" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by priority
curl -X GET "http://localhost:3000/api/picking/waves/available?priority=high" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by zone
curl -X GET "http://localhost:3000/api/picking/waves/available?zone=A1" \
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
      "waveId": "WAVE-2024-001",
      "status": "available",
      "priority": "high",
      "itemCount": 45,
      "estimatedDuration": 120,
      "orders": [
        {
          "orderId": "ORD-2024-001",
          "customerName": "John Doe",
          "priority": "high",
          "itemCount": 2,
          "specialInstructions": "Handle with care"
        }
      ],
      "zones": ["A1", "B2", "C3"],
      "items": [
        {
          "sku": "PROD-001",
          "description": "Product Description",
          "quantity": 2,
          "location": "A1-01-01",
          "binNumber": "BIN001"
        },
        {
          "sku": "PROD-002",
          "description": "Another Product",
          "quantity": 1,
          "location": "B2-03-02",
          "binNumber": "BIN045"
        }
      ],
      "assignedPicker": null,
      "createdAt": "2024-01-01T21:00:00.000Z"
    }
  ],
  "error": null
}
```

## Start Picking

### Begin Picking Wave
Start a picking wave and assign it to the current user.

**Endpoint:** `POST /api/picking/waves/:waveId/start`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pickerId": 5,
  "startTime": "2024-01-01T21:15:00.000Z",
  "deviceId": "PICKER-001"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/start" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "pickerId": 5,
    "startTime": "2024-01-01T21:15:00.000Z",
    "deviceId": "PICKER-001"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "waveId": "WAVE-2024-001",
    "status": "in_progress",
    "pickerId": 5,
    "pickerName": "John Picker",
    "startTime": "2024-01-01T21:15:00.000Z",
    "estimatedCompletion": "2024-01-01T21:35:00.000Z",
    "items": [
      {
        "sku": "PROD-001",
        "description": "Product Description",
        "quantity": 2,
        "location": "A1-01-01",
        "binNumber": "BIN001",
        "status": "pending"
      },
      {
        "sku": "PROD-002",
        "description": "Another Product",
        "quantity": 1,
        "location": "B2-03-02",
        "binNumber": "BIN045",
        "status": "pending"
      }
    ],
    "progress": {
      "totalItems": 45,
      "pickedItems": 0,
      "percentage": 0
    },
    "message": "Picking wave started successfully"
  },
  "error": null
}
```

## Scan Item

### Record Item Pick
Record when an item is picked during the picking process.

**Endpoint:** `POST /api/picking/waves/:waveId/scan`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sku": "PROD-001",
  "quantity": 2,
  "location": "A1-01-01",
  "binNumber": "BIN001",
  "scanTime": "2024-01-01T21:16:00.000Z",
  "notes": "Items in good condition"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/scan" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "quantity": 2,
    "location": "A1-01-01",
    "binNumber": "BIN001",
    "scanTime": "2024-01-01T21:16:00.000Z",
    "notes": "Items in good condition"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "waveId": "WAVE-2024-001",
    "itemScanned": {
      "sku": "PROD-001",
      "description": "Product Description",
      "quantity": 2,
      "location": "A1-01-01",
      "binNumber": "BIN001",
      "status": "picked",
      "pickedAt": "2024-01-01T21:16:00.000Z"
    },
    "progress": {
      "totalItems": 45,
      "pickedItems": 2,
      "percentage": 4.44
    },
    "nextItem": {
      "sku": "PROD-002",
      "description": "Another Product",
      "quantity": 1,
      "location": "B2-03-02",
      "binNumber": "BIN045"
    },
    "message": "Item picked successfully"
  },
  "error": null
}
```

## Report Partial Pick

### Report Incomplete Pick
Report when an item cannot be fully picked due to insufficient stock.

**Endpoint:** `POST /api/picking/waves/:waveId/partial`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sku": "PROD-003",
  "requestedQuantity": 5,
  "availableQuantity": 2,
  "location": "C3-02-01",
  "binNumber": "BIN078",
  "reason": "insufficient_stock",
  "notes": "Only 2 items available in bin"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/partial" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-003",
    "requestedQuantity": 5,
    "availableQuantity": 2,
    "location": "C3-02-01",
    "binNumber": "BIN078",
    "reason": "insufficient_stock",
    "notes": "Only 2 items available in bin"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "waveId": "WAVE-2024-001",
    "partialPick": {
      "sku": "PROD-003",
      "requestedQuantity": 5,
      "availableQuantity": 2,
      "pickedQuantity": 2,
      "shortage": 3,
      "location": "C3-02-01",
      "binNumber": "BIN078",
      "reason": "insufficient_stock",
      "notes": "Only 2 items available in bin",
      "reportedAt": "2024-01-01T21:20:00.000Z"
    },
    "exceptions": [
      {
        "type": "partial_pick",
        "sku": "PROD-003",
        "shortage": 3,
        "action": "notify_inventory",
        "priority": "medium"
      }
    ],
    "message": "Partial pick reported successfully"
  },
  "error": null
}
```

## Complete Picking

### Finish Picking Wave
Complete a picking wave and mark it as finished.

**Endpoint:** `POST /api/picking/waves/:waveId/complete`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "completionTime": "2024-01-01T21:35:00.000Z",
  "totalPicked": 42,
  "totalExceptions": 1,
  "notes": "Wave completed successfully with one partial pick",
  "qualityCheck": "passed"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/complete" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "completionTime": "2024-01-01T21:35:00.000Z",
    "totalPicked": 42,
    "totalExceptions": 1,
    "notes": "Wave completed successfully with one partial pick",
    "qualityCheck": "passed"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "waveId": "WAVE-2024-001",
    "status": "completed",
    "pickerId": 5,
    "pickerName": "John Picker",
    "startTime": "2024-01-01T21:15:00.000Z",
    "completionTime": "2024-01-01T21:35:00.000Z",
    "duration": 1200,
    "summary": {
      "totalItems": 45,
      "pickedItems": 42,
      "partialPicks": 1,
      "exceptions": 1,
      "efficiency": 93.33
    },
    "exceptions": [
      {
        "sku": "PROD-003",
        "type": "partial_pick",
        "shortage": 3,
        "action": "notify_inventory"
      }
    ],
    "nextSteps": [
      "Move picked items to packing area",
      "Process exceptions for inventory update",
      "Update wave status in system"
    ],
    "message": "Picking wave completed successfully"
  },
  "error": null
}
```

## Get SLA Status

### Check Picking SLA Status
Get the SLA status for all picking waves.

**Endpoint:** `GET /api/picking/sla-status`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/picking/sla-status" \
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
      "totalWaves": 15,
      "onTrack": 12,
      "atRisk": 2,
      "breached": 1,
      "averageCompletionTime": 95
    },
    "slaDetails": [
      {
        "waveId": "WAVE-2024-001",
        "status": "on_track",
        "priority": "high",
        "startTime": "2024-01-01T21:15:00.000Z",
        "estimatedCompletion": "2024-01-01T21:35:00.000Z",
        "remainingTime": 1200,
        "progress": 80
      },
      {
        "waveId": "WAVE-2024-002",
        "status": "at_risk",
        "priority": "normal",
        "startTime": "2024-01-01T21:00:00.000Z",
        "estimatedCompletion": "2024-01-01T21:45:00.000Z",
        "remainingTime": 300,
        "progress": 60
      }
    ],
    "recommendations": [
      "Reassign WAVE-2024-002 to experienced picker",
      "Prioritize high-priority waves",
      "Monitor picker performance"
    ]
  },
  "error": null
}
```

## Get Expiry Alerts

### Check Expiring Items
Get alerts for items that are approaching expiration.

**Endpoint:** `GET /api/picking/expiry-alerts`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `daysThreshold` (optional): Days before expiry to alert (default: 30)
- `warehouseId` (optional): Filter by warehouse

**cURL Example:**
```bash
# Get default expiry alerts (30 days)
curl -X GET "http://localhost:3000/api/picking/expiry-alerts" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Get alerts for items expiring in 7 days
curl -X GET "http://localhost:3000/api/picking/expiry-alerts?daysThreshold=7" \
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
    "alerts": [
      {
        "sku": "PROD-EXP-001",
        "description": "Expiring Product",
        "location": "A1-05-03",
        "binNumber": "BIN123",
        "currentStock": 25,
        "expiryDate": "2024-01-15T00:00:00.000Z",
        "daysUntilExpiry": 14,
        "priority": "high",
        "recommendedAction": "Prioritize picking for immediate orders"
      },
      {
        "sku": "PROD-EXP-002",
        "description": "Another Expiring Product",
        "location": "B2-01-07",
        "binNumber": "BIN456",
        "currentStock": 10,
        "expiryDate": "2024-01-25T00:00:00.000Z",
        "daysUntilExpiry": 24,
        "priority": "medium",
        "recommendedAction": "Include in next picking wave"
      }
    ],
    "summary": {
      "totalAlerts": 2,
      "highPriority": 1,
      "mediumPriority": 1,
      "lowPriority": 0,
      "totalStockAtRisk": 35
    }
  },
  "error": null
}
```

## Picking Workflow Examples

### 1. Complete Picking Wave
```bash
# Start picking wave
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/start" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickerId": 5,
    "startTime": "2024-01-01T21:15:00.000Z",
    "deviceId": "PICKER-001"
  }'

# Scan first item
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/scan" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "quantity": 2,
    "location": "A1-01-01",
    "binNumber": "BIN001",
    "scanTime": "2024-01-01T21:16:00.000Z"
  }'

# Complete wave
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/complete" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completionTime": "2024-01-01T21:35:00.000Z",
    "totalPicked": 42,
    "totalExceptions": 1,
    "notes": "Wave completed successfully"
  }'
```

### 2. Handle Partial Pick
```bash
# Report partial pick
curl -X POST "http://localhost:3000/api/picking/waves/WAVE-2024-001/partial" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-003",
    "requestedQuantity": 5,
    "availableQuantity": 2,
    "location": "C3-02-01",
    "binNumber": "BIN078",
    "reason": "insufficient_stock",
    "notes": "Only 2 items available"
  }'
```

## Error Responses

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions. Required: picking:execute"
}
```

### Wave Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Picking wave not found"
}
```

### Wave Already Started
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Wave is already in progress"
}
```

### Invalid Item Scan
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid item scan: SKU not found in wave"
}
```

### Wave Not Started
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Cannot scan items for wave that hasn't started"
}
```

## Best Practices

### Wave Management
- Generate waves based on order priority
- Consider picker availability and skills
- Optimize wave size for efficiency
- Monitor wave progress in real-time

### Picking Operations
- Follow optimal picking routes
- Scan items immediately after picking
- Report exceptions promptly
- Maintain quality standards

### Performance Monitoring
- Track picker efficiency
- Monitor SLA compliance
- Analyze exception patterns
- Optimize warehouse layout

## Mobile App Integration

### Picking Interface
- Show wave details clearly
- Display item locations prominently
- Provide scanning functionality
- Show real-time progress

### Offline Handling
- Cache wave information
- Queue item scans
- Sync when connection restored
- Handle conflicts gracefully

### User Experience
- Intuitive navigation
- Clear status indicators
- Quick exception reporting
- Progress tracking

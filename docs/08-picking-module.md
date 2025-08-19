# Picking Module

This document covers all picking module endpoints for the OZi Backend system.

## 🌊 Picking Wave Management

### Create Picking Wave

**Endpoint:** `POST /api/v1/picking/waves`

**Description:** Creates a new picking wave to group orders for efficient picking.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "Wave-2024-001",
  "description": "Morning picking wave for express orders",
  "priority": "high",
  "assignedPickers": ["PICKER001", "PICKER002"],
  "orders": ["ORD-2024-001", "ORD-2024-002", "ORD-2024-003"],
  "estimatedDuration": 120,
  "startTime": "2024-01-15T08:00:00.000Z",
  "deadline": "2024-01-15T12:00:00.000Z",
  "zone": "Zone-A",
  "notes": "Handle fragile items with care"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/picking/waves" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "Wave-2024-001",
    "description": "Morning picking wave for express orders",
    "priority": "high",
    "assignedPickers": ["PICKER001", "PICKER002"],
    "orders": ["ORD-2024-001", "ORD-2024-002", "ORD-2024-003"],
    "estimatedDuration": 120,
    "startTime": "2024-01-15T08:00:00.000Z",
    "deadline": "2024-01-15T12:00:00.000Z",
    "zone": "Zone-A",
    "notes": "Handle fragile items with care"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Picking wave created successfully",
  "data": {
    "wave": {
      "id": "WAVE-001",
      "name": "Wave-2024-001",
      "status": "created",
      "priority": "high",
      "assignedPickers": ["PICKER001", "PICKER002"],
      "orderCount": 3,
      "estimatedDuration": 120,
      "startTime": "2024-01-15T08:00:00.000Z",
      "deadline": "2024-01-15T12:00:00.000Z",
      "zone": "Zone-A",
      "createdAt": "2024-01-15T07:30:00.000Z"
    }
  }
}
```

### Get All Picking Waves

**Endpoint:** `GET /api/v1/picking/waves`

**Description:** Retrieves all picking waves with filtering and pagination.

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
- `zone` (optional): Filter by zone
- `pickerId` (optional): Filter by assigned picker
- `dateFrom` (optional): Filter by creation date
- `dateTo` (optional): Filter by creation date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/waves?page=1&limit=10&status=in_progress&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "waves": [
      {
        "id": "WAVE-001",
        "name": "Wave-2024-001",
        "status": "in_progress",
        "priority": "high",
        "assignedPickers": ["PICKER001", "PICKER002"],
        "orderCount": 3,
        "completedOrders": 1,
        "estimatedDuration": 120,
        "elapsedTime": 45,
        "zone": "Zone-A",
        "startTime": "2024-01-15T08:00:00.000Z",
        "deadline": "2024-01-15T12:00:00.000Z",
        "createdAt": "2024-01-15T07:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

### Get Picking Wave by ID

**Endpoint:** `GET /api/v1/picking/waves/:id`

**Description:** Retrieves a specific picking wave by its ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/waves/WAVE-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wave": {
      "id": "WAVE-001",
      "name": "Wave-2024-001",
      "description": "Morning picking wave for express orders",
      "status": "in_progress",
      "priority": "high",
      "assignedPickers": [
        {
          "id": "PICKER001",
          "name": "John Picker",
          "status": "active"
        },
        {
          "id": "PICKER002",
          "name": "Jane Picker",
          "status": "active"
        }
      ],
      "orders": [
        {
          "id": "ORD-2024-001",
          "status": "picked",
          "customerName": "John Doe",
          "priority": "high"
        },
        {
          "id": "ORD-2024-002",
          "status": "in_progress",
          "customerName": "Jane Smith",
          "priority": "medium"
        }
      ],
      "estimatedDuration": 120,
      "elapsedTime": 45,
      "startTime": "2024-01-15T08:00:00.000Z",
      "deadline": "2024-01-15T12:00:00.000Z",
      "zone": "Zone-A",
      "notes": "Handle fragile items with care",
      "createdAt": "2024-01-15T07:30:00.000Z",
      "updatedAt": "2024-01-15T08:45:00.000Z"
    }
  }
}
```

### Update Picking Wave

**Endpoint:** `PUT /api/v1/picking/waves/:id`

**Description:** Updates an existing picking wave.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "description": "Updated morning picking wave for express orders",
  "assignedPickers": ["PICKER001", "PICKER002", "PICKER003"],
  "estimatedDuration": 150,
  "notes": "Handle fragile items with care. Added extra picker for efficiency."
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/picking/waves/WAVE-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "description": "Updated morning picking wave for express orders",
    "assignedPickers": ["PICKER001", "PICKER002", "PICKER003"],
    "estimatedDuration": 150,
    "notes": "Handle fragile items with care. Added extra picker for efficiency."
  }'
```

### Start Picking Wave

**Endpoint:** `POST /api/v1/picking/waves/:id/start`

**Description:** Starts a picking wave and assigns pickers.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "startedAt": "2024-01-15T08:00:00.000Z",
  "pickerNotes": "Starting morning wave. All pickers are ready."
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/picking/waves/WAVE-001/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "startedAt": "2024-01-15T08:00:00.000Z",
    "pickerNotes": "Starting morning wave. All pickers are ready."
  }'
```

### Complete Picking Wave

**Endpoint:** `POST /api/v1/picking/waves/:id/complete`

**Description:** Marks a picking wave as completed.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "completedAt": "2024-01-15T10:30:00.000Z",
  "completionNotes": "All orders picked successfully. No issues encountered.",
  "actualDuration": 150
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/picking/waves/WAVE-001/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "completedAt": "2024-01-15T10:30:00.000Z",
    "completionNotes": "All orders picked successfully. No issues encountered.",
    "actualDuration": 150
  }'
```

## 📋 Picklist Management

### Get Picklist for Wave

**Endpoint:** `GET /api/v1/picking/waves/:id/picklist`

**Description:** Retrieves the picklist for a specific picking wave.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/waves/WAVE-001/picklist" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "waveId": "WAVE-001",
    "picklist": [
      {
        "orderId": "ORD-2024-001",
        "customerName": "John Doe",
        "priority": "high",
        "items": [
          {
            "productId": "PROD001",
            "productName": "Wireless Headphones",
            "sku": "WH-001",
            "quantity": 2,
            "location": "A1-B2-C3",
            "binNumber": "BIN-001",
            "picked": false,
            "pickedQuantity": 0
          }
        ]
      }
    ],
    "totalItems": 5,
    "pickedItems": 2,
    "remainingItems": 3
  }
}
```

### Update Picklist Item Status

**Endpoint:** `PATCH /api/v1/picking/waves/:id/picklist/:orderId/items/:itemId`

**Description:** Updates the status of a picklist item.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "picked": true,
  "pickedQuantity": 2,
  "pickerId": "PICKER001",
  "pickedAt": "2024-01-15T08:15:00.000Z",
  "notes": "Items found in correct location"
}
```

**cURL Example:**
```bash
curl -X PATCH "https://your-app.onrender.com/api/v1/picking/waves/WAVE-001/picklist/ORD-2024-001/items/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "picked": true,
    "pickedQuantity": 2,
    "pickerId": "PICKER001",
    "pickedAt": "2024-01-15T08:15:00.000Z",
    "notes": "Items found in correct location"
  }'
```

## 🚨 Picking Exceptions

### Report Picking Exception

**Endpoint:** `POST /api/v1/picking/exceptions`

**Description:** Reports a picking exception or issue.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "waveId": "WAVE-001",
  "orderId": "ORD-2024-001",
  "itemId": "ITEM001",
  "exceptionType": "out_of_stock",
  "description": "Product WH-001 is out of stock in location A1-B2-C3",
  "severity": "high",
  "reportedBy": "PICKER001",
  "location": "A1-B2-C3",
  "suggestedAction": "Check alternative location or contact supervisor"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/picking/exceptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "waveId": "WAVE-001",
    "orderId": "ORD-2024-001",
    "itemId": "ITEM001",
    "exceptionType": "out_of_stock",
    "description": "Product WH-001 is out of stock in location A1-B2-C3",
    "severity": "high",
    "reportedBy": "PICKER001",
    "location": "A1-B2-C3",
    "suggestedAction": "Check alternative location or contact supervisor"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Picking exception reported successfully",
  "data": {
    "exception": {
      "id": "EXC001",
      "waveId": "WAVE-001",
      "orderId": "ORD-2024-001",
      "exceptionType": "out_of_stock",
      "severity": "high",
      "status": "open",
      "reportedBy": "PICKER001",
      "reportedAt": "2024-01-15T08:20:00.000Z"
    }
  }
}
```

### Get Picking Exceptions

**Endpoint:** `GET /api/v1/picking/exceptions`

**Description:** Retrieves all picking exceptions with filtering.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `status` (optional): Filter by status (open, in_progress, resolved, closed)
- `severity` (optional): Filter by severity (low, medium, high, critical)
- `exceptionType` (optional): Filter by exception type
- `waveId` (optional): Filter by wave ID
- `reportedBy` (optional): Filter by reporter

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/exceptions?status=open&severity=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Resolve Picking Exception

**Endpoint:** `PATCH /api/v1/picking/exceptions/:id/resolve`

**Description:** Marks a picking exception as resolved.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "status": "resolved",
  "resolution": "Product found in alternative location B2-C3-D4",
  "resolvedBy": "SUPERVISOR001",
  "resolvedAt": "2024-01-15T08:45:00.000Z",
  "actionTaken": "Updated picklist with new location"
}
```

**cURL Example:**
```bash
curl -X PATCH "https://your-app.onrender.com/api/v1/picking/exceptions/EXC001/resolve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "status": "resolved",
    "resolution": "Product found in alternative location B2-C3-D4",
    "resolvedBy": "SUPERVISOR001",
    "resolvedAt": "2024-01-15T08:45:00.000Z",
    "actionTaken": "Updated picklist with new location"
  }'
```

## 📱 Mobile Picking Operations

### Get Picker's Active Waves

**Endpoint:** `GET /api/v1/picking/picker/:pickerId/waves`

**Description:** Retrieves active picking waves for a specific picker.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/picker/PICKER001/waves" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Start Picking Session

**Endpoint:** `POST /api/v1/picking/picker/:pickerId/session/start`

**Description:** Starts a picking session for a picker.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "waveId": "WAVE-001",
  "deviceId": "MOBILE-001",
  "location": "Zone-A",
  "startTime": "2024-01-15T08:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/picking/picker/PICKER001/session/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "waveId": "WAVE-001",
    "deviceId": "MOBILE-001",
    "location": "Zone-A",
    "startTime": "2024-01-15T08:00:00.000Z"
  }'
```

### End Picking Session

**Endpoint:** `POST /api/v1/picking/picker/:pickerId/session/end`

**Description:** Ends a picking session for a picker.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "waveId": "WAVE-001",
  "endTime": "2024-01-15T10:30:00.000Z",
  "itemsPicked": 15,
  "totalItems": 15,
  "sessionNotes": "All items picked successfully. No issues encountered."
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/picking/picker/PICKER001/session/end" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "waveId": "WAVE-001",
    "endTime": "2024-01-15T10:30:00.000Z",
    "itemsPicked": 15,
    "totalItems": 15,
    "sessionNotes": "All items picked successfully. No issues encountered."
  }'
```

## 📊 Picking Analytics

### Get Picking Statistics

**Endpoint:** `GET /api/v1/picking/statistics`

**Description:** Retrieves statistics about picking operations.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `dateFrom` (optional): Start date for statistics
- `dateTo` (optional): End date for statistics
- `zone` (optional): Filter by zone

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/statistics?dateFrom=2024-01-01&dateTo=2024-01-31&zone=Zone-A" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWaves": 45,
    "completedWaves": 42,
    "inProgressWaves": 2,
    "cancelledWaves": 1,
    "totalOrders": 180,
    "completedOrders": 175,
    "totalItems": 450,
    "pickedItems": 440,
    "averageWaveDuration": 135,
    "averageItemsPerHour": 25,
    "pickerPerformance": [
      {
        "pickerId": "PICKER001",
        "pickerName": "John Picker",
        "wavesCompleted": 15,
        "itemsPicked": 150,
        "averageTime": 120
      }
    ],
    "zonePerformance": [
      {
        "zone": "Zone-A",
        "wavesCompleted": 20,
        "averageDuration": 125
      }
    ]
  }
}
```

### Get Picking Performance Report

**Endpoint:** `GET /api/v1/picking/performance-report`

**Description:** Generates a detailed picking performance report.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `format` (optional): Report format (json, csv, pdf)
- `dateFrom` (required): Start date for the report
- `dateTo` (required): End date for the report
- `pickerId` (optional): Specific picker ID for detailed report
- `zone` (optional): Filter by zone

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/performance-report?format=json&dateFrom=2024-01-01&dateTo=2024-01-31&zone=Zone-A" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔍 Picking Search and Filtering

### Search Picking Waves

**Endpoint:** `GET /api/v1/picking/waves/search`

**Description:** Advanced search for picking waves with multiple criteria.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (required): Search query
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `zone` (optional): Filter by zone
- `pickerId` (optional): Filter by assigned picker
- `dateFrom` (optional): Filter by creation date
- `dateTo` (optional): Filter by creation date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/waves/search?q=Morning&status=in_progress&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Get Picking Waves by Zone

**Endpoint:** `GET /api/v1/picking/zones/:zoneName/waves`

**Description:** Retrieves all picking waves for a specific zone.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/picking/zones/Zone-A/waves" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔄 Bulk Picking Operations

### Bulk Create Picking Waves

**Endpoint:** `POST /api/v1/picking/waves/bulk`

**Description:** Creates multiple picking waves at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "waves": [
    {
      "name": "Wave-2024-002",
      "description": "Afternoon wave for standard orders",
      "priority": "medium",
      "orders": ["ORD-2024-004", "ORD-2024-005"],
      "zone": "Zone-B"
    },
    {
      "name": "Wave-2024-003",
      "description": "Evening wave for priority orders",
      "priority": "high",
      "orders": ["ORD-2024-006", "ORD-2024-007"],
      "zone": "Zone-A"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/picking/waves/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "waves": [
      {
        "name": "Wave-2024-002",
        "description": "Afternoon wave for standard orders",
        "priority": "medium",
        "orders": ["ORD-2024-004", "ORD-2024-005"],
        "zone": "Zone-B"
      },
      {
        "name": "Wave-2024-003",
        "description": "Evening wave for priority orders",
        "priority": "high",
        "orders": ["ORD-2024-006", "ORD-2024-007"],
        "zone": "Zone-A"
      }
    ]
  }'
```

### Bulk Update Wave Status

**Endpoint:** `PUT /api/v1/picking/waves/bulk/status`

**Description:** Updates the status of multiple picking waves at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "waves": [
    {
      "id": "WAVE-001",
      "status": "completed"
    },
    {
      "id": "WAVE-002",
      "status": "in_progress"
    }
  ],
  "notes": "Bulk status update"
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/picking/waves/bulk/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "waves": [
      {
        "id": "WAVE-001",
        "status": "completed"
      },
      {
        "id": "WAVE-002",
        "status": "in_progress"
      }
    ],
    "notes": "Bulk status update"
  }'
```

## ⚠️ Error Responses

### Common Error Responses

**Wave Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Picking wave not found",
  "statusCode": 404
}
```

**Invalid Wave Status:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid wave status transition",
  "statusCode": 400
}
```

**Wave Already Started:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Wave is already in progress",
  "statusCode": 409
}
```

**No Orders Assigned:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "No orders assigned to wave",
  "statusCode": 400
}
```

**Picker Not Available:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "One or more assigned pickers are not available",
  "statusCode": 409
}
```

## 🔐 Security Considerations

1. **Permission-Based Access**: Picking operations require appropriate permissions
2. **Status Validation**: Wave status changes follow business rules
3. **Audit Logging**: All picking activities are logged for tracking
4. **Picker Authentication**: Picker actions are authenticated and authorized
5. **Data Integrity**: Picking data is validated and sanitized

## 📋 Best Practices

1. **Wave Planning**: Plan waves based on order priority and picker availability
2. **Zone Management**: Organize picking by zones for efficiency
3. **Exception Handling**: Promptly report and resolve picking exceptions
4. **Performance Monitoring**: Track picker performance and wave completion times
5. **Mobile Optimization**: Ensure mobile app is optimized for picking operations
6. **Real-time Updates**: Provide real-time updates on wave and order status
7. **Quality Control**: Implement quality checks for picked items
8. **Documentation**: Maintain clear documentation of picking procedures

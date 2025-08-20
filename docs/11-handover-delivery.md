# Handover & Delivery

This module handles the handover of completed packing jobs to delivery partners and tracks delivery status. Users need appropriate permissions to access these endpoints.

## Assign Rider

### Assign Rider for Delivery
Assign a rider to handle the delivery of a completed packing job.

**Endpoint:** `POST /api/handover/assign-rider`

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
  "riderId": 3,
  "specialInstructions": "Handle with care - fragile items",
  "priority": "high",
  "estimatedPickupTime": "2024-01-02T01:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/handover/assign-rider" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "riderId": 3,
    "specialInstructions": "Handle with care - fragile items",
    "priority": "high",
    "estimatedPickupTime": "2024-01-02T01:00:00.000Z"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "handoverId": 1,
    "jobId": 1,
    "jobNumber": "PKG-2024-001",
    "riderId": 3,
    "rider": {
      "id": 3,
      "name": "Mike Rider",
      "phone": "+1234567890",
      "vehicleType": "BIKE",
      "rating": 4.8,
      "totalDeliveries": 150
    },
    "specialInstructions": "Handle with care - fragile items",
    "priority": "high",
    "estimatedPickupTime": "2024-01-02T01:00:00.000Z",
    "status": "assigned",
    "assignedAt": "2024-01-02T00:45:00.000Z",
    "assignedBy": 1,
    "message": "Rider assigned successfully"
  },
  "error": null
}
```

## Confirm Handover

### Confirm Handover to Rider
Confirm that the rider has received the package for delivery.

**Endpoint:** `POST /api/handover/confirm`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "handoverId": 1,
  "riderId": 3,
  "confirmationTime": "2024-01-02T01:05:00.000Z",
  "packageCondition": "good",
  "notes": "Package received in good condition"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/handover/confirm" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "handoverId": 1,
    "riderId": 3,
    "confirmationTime": "2024-01-02T01:05:00.000Z",
    "packageCondition": "good",
    "notes": "Package received in good condition"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "handoverId": 1,
    "jobId": 1,
    "jobNumber": "PKG-2024-001",
    "riderId": 3,
    "riderName": "Mike Rider",
    "status": "confirmed",
    "confirmationTime": "2024-01-02T01:05:00.000Z",
    "packageCondition": "good",
    "notes": "Package received in good condition",
    "confirmedBy": 3,
    "message": "Handover confirmed successfully"
  },
  "error": null
}
```

## Update Handover Status

### Update Delivery Status
Update the status of a handover during the delivery process.

**Endpoint:** `PUT /api/handover/:handoverId/status`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "in_transit",
  "location": {
    "latitude": 34.0522,
    "longitude": -118.2437,
    "address": "Downtown Los Angeles"
  },
  "estimatedDelivery": "2024-01-02T02:00:00.000Z",
  "additionalData": {
    "trafficCondition": "moderate",
    "weatherCondition": "clear"
  }
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/handover/1/status" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_transit",
    "location": {
      "latitude": 34.0522,
      "longitude": -118.2437,
      "address": "Downtown Los Angeles"
    },
    "estimatedDelivery": "2024-01-02T02:00:00.000Z",
    "additionalData": {
      "trafficCondition": "moderate",
      "weatherCondition": "clear"
    }
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "handoverId": 1,
    "jobId": 1,
    "jobNumber": "PKG-2024-001",
    "riderId": 3,
    "riderName": "Mike Rider",
    "previousStatus": "confirmed",
    "newStatus": "in_transit",
    "location": {
      "latitude": 34.0522,
      "longitude": -118.2437,
      "address": "Downtown Los Angeles"
    },
    "estimatedDelivery": "2024-01-02T02:00:00.000Z",
    "additionalData": {
      "trafficCondition": "moderate",
      "weatherCondition": "clear"
    },
    "statusUpdatedAt": "2024-01-02T01:15:00.000Z",
    "updatedBy": 3,
    "message": "Handover status updated successfully"
  },
  "error": null
}
```

## Get Available Riders

### List Available Riders
Get a list of available riders for assignment.

**Endpoint:** `GET /api/handover/riders/available`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `vehicleType` (optional): Filter by vehicle type
- `rating` (optional): Filter by minimum rating
- `location` (optional): Filter by proximity to warehouse

**cURL Example:**
```bash
# Get all available riders
curl -X GET "http://localhost:3000/api/handover/riders/available" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by vehicle type
curl -X GET "http://localhost:3000/api/handover/riders/available?vehicleType=BIKE" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by minimum rating
curl -X GET "http://localhost:3000/api/handover/riders/available?rating=4.5" \
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
      "riderCode": "R001",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john.doe@example.com",
      "vehicleType": "BIKE",
      "availabilityStatus": "AVAILABLE",
      "rating": 4.8,
      "totalDeliveries": 150,
      "currentLocation": {
        "latitude": 34.0522,
        "longitude": -118.2437,
        "address": "Downtown Los Angeles"
      },
      "distanceFromWarehouse": 2.5,
      "estimatedArrival": "15 minutes",
      "isActive": true,
      "lastActivity": "2024-01-02T00:30:00.000Z"
    },
    {
      "id": 2,
      "riderCode": "R002",
      "name": "Jane Smith",
      "phone": "+1234567891",
      "email": "jane.smith@example.com",
      "vehicleType": "SCOOTER",
      "availabilityStatus": "AVAILABLE",
      "rating": 4.9,
      "totalDeliveries": 200,
      "currentLocation": {
        "latitude": 34.0622,
        "longitude": -118.2537,
        "address": "Hollywood"
      },
      "distanceFromWarehouse": 3.2,
      "estimatedArrival": "20 minutes",
      "isActive": true,
      "lastActivity": "2024-01-02T00:25:00.000Z"
    },
    {
      "id": 3,
      "riderCode": "R003",
      "name": "Mike Rider",
      "phone": "+1234567892",
      "email": "mike.rider@example.com",
      "vehicleType": "BIKE",
      "availabilityStatus": "AVAILABLE",
      "rating": 4.7,
      "totalDeliveries": 120,
      "currentLocation": {
        "latitude": 34.0422,
        "longitude": -118.2337,
        "address": "Echo Park"
      },
      "distanceFromWarehouse": 1.8,
      "estimatedArrival": "10 minutes",
      "isActive": true,
      "lastActivity": "2024-01-02T00:40:00.000Z"
    }
  ],
  "error": null
}
```

## Get LMS Sync Status

### Check LMS Integration Status
Get the status of LMS (Logistics Management System) synchronization.

**Endpoint:** `GET /api/handover/lms/sync-status`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/handover/lms/sync-status" \
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
    "syncStatus": "healthy",
    "lastSync": "2024-01-02T00:45:00.000Z",
    "nextSync": "2024-01-02T01:00:00.000Z",
    "totalHandovers": 25,
    "syncedHandovers": 25,
    "failedHandovers": 0,
    "retryQueue": 0,
    "failedHandovers": [],
    "systemHealth": {
      "lmsConnection": "connected",
      "apiResponseTime": 150,
      "errorRate": 0.0
    },
    "message": "LMS synchronization is healthy"
  },
  "error": null
}
```

## Handover Workflow Examples

### 1. Complete Handover Process
```bash
# Assign rider
curl -X POST "http://localhost:3000/api/handover/assign-rider" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "riderId": 3,
    "specialInstructions": "Handle with care - fragile items",
    "priority": "high",
    "estimatedPickupTime": "2024-01-02T01:00:00.000Z"
  }'

# Confirm handover
curl -X POST "http://localhost:3000/api/handover/confirm" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "handoverId": 1,
    "riderId": 3,
    "confirmationTime": "2024-01-02T01:05:00.000Z",
    "packageCondition": "good",
    "notes": "Package received in good condition"
  }'

# Update status to in transit
curl -X PUT "http://localhost:3000/api/handover/1/status" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_transit",
    "location": {
      "latitude": 34.0522,
      "longitude": -118.2437,
      "address": "Downtown Los Angeles"
    },
    "estimatedDelivery": "2024-01-02T02:00:00.000Z"
  }'
```

### 2. Check Available Riders
```bash
# Get available riders
curl -X GET "http://localhost:3000/api/handover/riders/available" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by vehicle type
curl -X GET "http://localhost:3000/api/handover/riders/available?vehicleType=BIKE" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Handover Status Workflow

### Available Statuses
The handover process follows this workflow:

1. **assigned** - Rider assigned to job
2. **confirmed** - Rider confirmed receipt of package
3. **in_transit** - Package in delivery
4. **out_for_delivery** - Rider at delivery location
5. **delivered** - Package delivered successfully
6. **failed** - Delivery failed
7. **returned** - Package returned to warehouse

### Status Transitions
- **assigned** → **confirmed** (when rider confirms receipt)
- **confirmed** → **in_transit** (when rider starts delivery)
- **in_transit** → **out_for_delivery** (when rider reaches destination)
- **out_for_delivery** → **delivered** (when delivery completed)
- **out_for_delivery** → **failed** (if delivery fails)
- **failed** → **returned** (if package returned)

## Vehicle Types

### Supported Vehicle Types
The system supports various delivery vehicle types:

#### 1. Bike
- **Type**: `BIKE`
- **Capacity**: Small packages
- **Range**: Local deliveries
- **Speed**: Moderate

#### 2. Scooter
- **Type**: `SCOOTER`
- **Capacity**: Medium packages
- **Range**: Local to regional
- **Speed**: Fast

#### 3. Motorcycle
- **Type**: `MOTORCYCLE`
- **Capacity**: Medium packages
- **Range**: Regional
- **Speed**: Very fast

#### 4. Car
- **Type**: `CAR`
- **Capacity**: Large packages
- **Range**: Regional to national
- **Speed**: Fast

#### 5. Van
- **Type**: `VAN`
- **Capacity**: Multiple packages
- **Range**: Regional
- **Speed**: Moderate

## Delivery Priority Levels

### Priority Classification
Deliveries are classified by priority:

#### 1. Low Priority
- **Description**: Standard delivery
- **SLA**: 24-48 hours
- **Cost**: Standard rate

#### 2. Normal Priority
- **Description**: Regular delivery
- **SLA**: 12-24 hours
- **Cost**: Standard rate

#### 3. High Priority
- **Description**: Expedited delivery
- **SLA**: 4-8 hours
- **Cost**: Premium rate

#### 4. Urgent Priority
- **Description**: Same-day delivery
- **SLA**: 2-4 hours
- **Cost**: Premium rate

#### 5. Critical Priority
- **Description**: Immediate delivery
- **SLA**: 1-2 hours
- **Cost**: Premium rate

## Error Responses

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions. Required: handover:manage"
}
```

### Handover Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Handover not found"
}
```

### Rider Not Available
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Rider is not available for assignment"
}
```

### Invalid Status Transition
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid status transition from 'assigned' to 'delivered'"
}
```

### Package Not Ready
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Package is not ready for handover"
}
```

## Best Practices

### Rider Assignment
- Match rider skills to package requirements
- Consider proximity and availability
- Monitor rider performance
- Provide clear instructions

### Handover Process
- Verify package condition
- Confirm rider identity
- Document handover details
- Track delivery progress

### Status Updates
- Update status promptly
- Provide accurate location data
- Include relevant additional information
- Handle exceptions gracefully

## Mobile App Integration

### Rider Interface
- Show assigned jobs clearly
- Easy status updates
- Location tracking
- Delivery confirmation

### Manager Interface
- Monitor handover status
- Track delivery progress
- Manage rider assignments
- Handle exceptions

### Offline Handling
- Cache handover information
- Queue status updates
- Sync when connection restored
- Handle conflicts gracefully

### Real-time Updates
- Live status tracking
- Location sharing
- Push notifications
- ETA updates

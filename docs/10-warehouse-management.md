# Warehouse Management

This module handles warehouse creation, zone management, and staff assignments. Users need appropriate warehouse permissions to access these endpoints.

## Create Warehouse

### Create New Warehouse
Create a new warehouse in the system.

**Endpoint:** `POST /api/warehouses`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Main Distribution Center",
  "code": "MDC-001",
  "address": {
    "street": "123 Warehouse Blvd",
    "city": "Industrial City",
    "state": "CA",
    "zipCode": "90210",
    "country": "USA"
  },
  "contactInfo": {
    "phone": "+1234567890",
    "email": "warehouse@company.com",
    "manager": "John Warehouse"
  },
  "capacity": {
    "totalArea": 50000,
    "unit": "sqft",
    "maxInventory": 100000
  },
  "operatingHours": {
    "monday": "06:00-22:00",
    "tuesday": "06:00-22:00",
    "wednesday": "06:00-22:00",
    "thursday": "06:00-22:00",
    "friday": "06:00-22:00",
    "saturday": "08:00-18:00",
    "sunday": "closed"
  }
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/warehouses" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Distribution Center",
    "code": "MDC-001",
    "address": {
      "street": "123 Warehouse Blvd",
      "city": "Industrial City",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    },
    "contactInfo": {
      "phone": "+1234567890",
      "email": "warehouse@company.com",
      "manager": "John Warehouse"
    },
    "capacity": {
      "totalArea": 50000,
      "unit": "sqft",
      "maxInventory": 100000
    },
    "operatingHours": {
      "monday": "06:00-22:00",
      "tuesday": "06:00-22:00",
      "wednesday": "06:00-22:00",
      "thursday": "06:00-22:00",
      "friday": "06:00-22:00",
      "saturday": "08:00-18:00",
      "sunday": "closed"
    }
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 1,
    "name": "Main Distribution Center",
    "code": "MDC-001",
    "address": {
      "street": "123 Warehouse Blvd",
      "city": "Industrial City",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    },
    "contactInfo": {
      "phone": "+1234567890",
      "email": "warehouse@company.com",
      "manager": "John Warehouse"
    },
    "capacity": {
      "totalArea": 50000,
      "unit": "sqft",
      "maxInventory": 100000
    },
    "operatingHours": {
      "monday": "06:00-22:00",
      "tuesday": "06:00-22:00",
      "wednesday": "06:00-22:00",
      "thursday": "06:00-22:00",
      "friday": "06:00-22:00",
      "saturday": "08:00-18:00",
      "sunday": "closed"
    },
    "status": "active",
    "createdAt": "2024-01-01T23:00:00.000Z",
    "createdBy": 1
  },
  "error": null
}
```

## List Warehouses

### Get All Warehouses
Retrieve a list of all warehouses in the system.

**Endpoint:** `GET /api/warehouses`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `status` (optional): Filter by warehouse status
- `search` (optional): Search in warehouse names and codes

**cURL Example:**
```bash
# Get all warehouses
curl -X GET "http://localhost:3000/api/warehouses" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by status
curl -X GET "http://localhost:3000/api/warehouses?status=active" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Search warehouses
curl -X GET "http://localhost:3000/api/warehouses?search=main" \
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
      "name": "Main Distribution Center",
      "code": "MDC-001",
      "address": {
        "city": "Industrial City",
        "state": "CA"
      },
      "contactInfo": {
        "phone": "+1234567890",
        "email": "warehouse@company.com",
        "manager": "John Warehouse"
      },
      "capacity": {
        "totalArea": 50000,
        "unit": "sqft",
        "maxInventory": 100000
      },
      "status": "active",
      "currentInventory": 75000,
      "utilization": 75.0,
      "createdAt": "2024-01-01T23:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Secondary Warehouse",
      "code": "SW-002",
      "address": {
        "city": "Secondary City",
        "state": "NY"
      },
      "contactInfo": {
        "phone": "+1234567891",
        "email": "secondary@company.com",
        "manager": "Jane Secondary"
      },
      "capacity": {
        "totalArea": 25000,
        "unit": "sqft",
        "maxInventory": 50000
      },
      "status": "active",
      "currentInventory": 30000,
      "utilization": 60.0,
      "createdAt": "2024-01-01T23:30:00.000Z"
    }
  ],
  "error": null
}
```

## Get Warehouse by ID

### Retrieve Warehouse Details
Get detailed information about a specific warehouse.

**Endpoint:** `GET /api/warehouses/:id`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1" \
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
    "name": "Main Distribution Center",
    "code": "MDC-001",
    "address": {
      "street": "123 Warehouse Blvd",
      "city": "Industrial City",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    },
    "contactInfo": {
      "phone": "+1234567890",
      "email": "warehouse@company.com",
      "manager": "John Warehouse"
    },
    "capacity": {
      "totalArea": 50000,
      "unit": "sqft",
      "maxInventory": 100000
    },
    "operatingHours": {
      "monday": "06:00-22:00",
      "tuesday": "06:00-22:00",
      "wednesday": "06:00-22:00",
      "thursday": "06:00-22:00",
      "friday": "06:00-22:00",
      "saturday": "08:00-18:00",
      "sunday": "closed"
    },
    "status": "active",
    "currentInventory": 75000,
    "utilization": 75.0,
    "zones": [
      {
        "id": 1,
        "name": "Zone A",
        "code": "A",
        "area": 10000,
        "capacity": 20000,
        "currentInventory": 15000
      }
    ],
    "staff": [
      {
        "id": 5,
        "name": "John Picker",
        "role": "picker",
        "assignedAt": "2024-01-01T23:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T23:00:00.000Z",
    "updatedAt": "2024-01-01T23:00:00.000Z"
  },
  "error": null
}
```

## Update Warehouse

### Modify Warehouse Information
Update warehouse details and configuration.

**Endpoint:** `PUT /api/warehouses/:id`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Main Distribution Center - Updated",
  "contactInfo": {
    "phone": "+1234567899",
    "manager": "John Warehouse Manager"
  },
  "capacity": {
    "maxInventory": 120000
  },
  "operatingHours": {
    "saturday": "06:00-20:00"
  }
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/warehouses/1" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Distribution Center - Updated",
    "contactInfo": {
      "phone": "+1234567899",
      "manager": "John Warehouse Manager"
    },
    "capacity": {
      "maxInventory": 120000
    },
    "operatingHours": {
      "saturday": "06:00-20:00"
    }
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 1,
    "name": "Main Distribution Center - Updated",
    "code": "MDC-001",
    "updatedFields": [
      "name",
      "contactInfo.phone",
      "contactInfo.manager",
      "capacity.maxInventory",
      "operatingHours.saturday"
    ],
    "updatedAt": "2024-01-01T23:45:00.000Z",
    "updatedBy": 1,
    "message": "Warehouse updated successfully"
  },
  "error": null
}
```

## Update Warehouse Status

### Change Warehouse Status
Activate, deactivate, or suspend a warehouse.

**Endpoint:** `PATCH /api/warehouses/:id/status`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "maintenance",
  "reason": "Scheduled maintenance and upgrades",
  "estimatedDuration": "48h"
}
```

**cURL Example:**
```bash
curl -X PATCH "http://localhost:3000/api/warehouses/1/status" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "maintenance",
    "reason": "Scheduled maintenance and upgrades",
    "estimatedDuration": "48h"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 1,
    "name": "Main Distribution Center - Updated",
    "code": "MDC-001",
    "previousStatus": "active",
    "newStatus": "maintenance",
    "statusReason": "Scheduled maintenance and upgrades",
    "estimatedDuration": "48h",
    "statusChangedAt": "2024-01-01T23:50:00.000Z",
    "statusChangedBy": 1,
    "message": "Warehouse status updated successfully"
  },
  "error": null
}
```

## Delete Warehouse

### Remove Warehouse
Delete a warehouse from the system.

**Endpoint:** `DELETE /api/warehouses/:id`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/2" \
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
    "id": 2,
    "name": "Secondary Warehouse",
    "code": "SW-002",
    "deletedAt": "2024-01-01T23:55:00.000Z",
    "deletedBy": 1,
    "message": "Warehouse deleted successfully"
  },
  "error": null
}
```

## Create Zone

### Add New Zone to Warehouse
Create a new zone within a warehouse.

**Endpoint:** `POST /api/warehouses/:warehouseId/zones`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Zone B - Electronics",
  "code": "B",
  "description": "Electronics and fragile items storage",
  "area": 8000,
  "capacity": 15000,
  "temperature": "controlled",
  "specialRequirements": ["climate_control", "security_access"]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/zones" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zone B - Electronics",
    "code": "B",
    "description": "Electronics and fragile items storage",
    "area": 8000,
    "capacity": 15000,
    "temperature": "controlled",
    "specialRequirements": ["climate_control", "security_access"]
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 2,
    "warehouseId": 1,
    "name": "Zone B - Electronics",
    "code": "B",
    "description": "Electronics and fragile items storage",
    "area": 8000,
    "capacity": 15000,
    "temperature": "controlled",
    "specialRequirements": ["climate_control", "security_access"],
    "status": "active",
    "currentInventory": 0,
    "utilization": 0.0,
    "createdAt": "2024-01-02T00:00:00.000Z",
    "createdBy": 1
  },
  "error": null
}
```

## List Warehouse Zones

### Get All Zones in Warehouse
Retrieve a list of all zones within a specific warehouse.

**Endpoint:** `GET /api/warehouses/:warehouseId/zones`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1/zones" \
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
      "name": "Zone A",
      "code": "A",
      "description": "General storage area",
      "area": 10000,
      "capacity": 20000,
      "temperature": "ambient",
      "specialRequirements": [],
      "status": "active",
      "currentInventory": 15000,
      "utilization": 75.0,
      "createdAt": "2024-01-01T23:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Zone B - Electronics",
      "code": "B",
      "description": "Electronics and fragile items storage",
      "area": 8000,
      "capacity": 15000,
      "temperature": "controlled",
      "specialRequirements": ["climate_control", "security_access"],
      "status": "active",
      "currentInventory": 0,
      "utilization": 0.0,
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "error": null
}
```

## Update Zone

### Modify Zone Information
Update zone details and configuration.

**Endpoint:** `PUT /api/warehouses/zones/:zoneId`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Zone B - Electronics & Fragile",
  "description": "Electronics, fragile items, and high-value storage",
  "capacity": 18000,
  "specialRequirements": ["climate_control", "security_access", "fire_suppression"]
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/warehouses/zones/2" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zone B - Electronics & Fragile",
    "description": "Electronics, fragile items, and high-value storage",
    "capacity": 18000,
    "specialRequirements": ["climate_control", "security_access", "fire_suppression"]
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 2,
    "name": "Zone B - Electronics & Fragile",
    "code": "B",
    "updatedFields": [
      "name",
      "description",
      "capacity",
      "specialRequirements"
    ],
    "updatedAt": "2024-01-02T00:15:00.000Z",
    "updatedBy": 1,
    "message": "Zone updated successfully"
  },
  "error": null
}
```

## Delete Zone

### Remove Zone from Warehouse
Delete a zone from a warehouse.

**Endpoint:** `DELETE /api/warehouses/zones/:zoneId`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/zones/2" \
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
    "id": 2,
    "name": "Zone B - Electronics & Fragile",
    "code": "B",
    "deletedAt": "2024-01-02T00:20:00.000Z",
    "deletedBy": 1,
    "message": "Zone deleted successfully"
  },
  "error": null
}
```

## Assign Staff

### Assign Staff to Warehouse
Assign staff members to work in a specific warehouse.

**Endpoint:** `POST /api/warehouses/:warehouseId/staff`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "staffId": 8,
  "role": "picker",
  "zones": ["A", "B"],
  "startDate": "2024-01-02T00:00:00.000Z",
  "shift": "day",
  "specializations": ["electronics", "fragile_items"]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/staff" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": 8,
    "role": "picker",
    "zones": ["A", "B"],
    "startDate": "2024-01-02T00:00:00.000Z",
    "shift": "day",
    "specializations": ["electronics", "fragile_items"]
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "assignmentId": 1,
    "warehouseId": 1,
    "warehouseName": "Main Distribution Center",
    "staffId": 8,
    "staffName": "Sarah Picker",
    "role": "picker",
    "zones": ["A", "B"],
    "startDate": "2024-01-02T00:00:00.000Z",
    "shift": "day",
    "specializations": ["electronics", "fragile_items"],
    "status": "active",
    "assignedAt": "2024-01-02T00:25:00.000Z",
    "assignedBy": 1
  },
  "error": null
}
```

## List Warehouse Staff

### Get All Staff in Warehouse
Retrieve a list of all staff assigned to a specific warehouse.

**Endpoint:** `GET /api/warehouses/:warehouseId/staff`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `role` (optional): Filter by staff role
- `zone` (optional): Filter by zone assignment

**cURL Example:**
```bash
# Get all staff
curl -X GET "http://localhost:3000/api/warehouses/1/staff" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by role
curl -X GET "http://localhost:3000/api/warehouses/1/staff?role=picker" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by zone
curl -X GET "http://localhost:3000/api/warehouses/1/staff?zone=A" \
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
      "assignmentId": 1,
      "staffId": 5,
      "staffName": "John Picker",
      "role": "picker",
      "zones": ["A"],
      "shift": "day",
      "specializations": ["general"],
      "status": "active",
      "assignedAt": "2024-01-01T23:00:00.000Z",
      "performance": {
        "pickRate": 25,
        "accuracy": 98.5,
        "lastActivity": "2024-01-01T22:30:00.000Z"
      }
    },
    {
      "assignmentId": 2,
      "staffId": 8,
      "staffName": "Sarah Picker",
      "role": "picker",
      "zones": ["A", "B"],
      "shift": "day",
      "specializations": ["electronics", "fragile_items"],
      "status": "active",
      "assignedAt": "2024-01-02T00:25:00.000Z",
      "performance": {
        "pickRate": 30,
        "accuracy": 99.2,
        "lastActivity": "2024-01-02T00:20:00.000Z"
      }
    }
  ],
  "error": null
}
```

## Remove Staff Assignment

### Remove Staff from Warehouse
Remove a staff member's assignment from a warehouse.

**Endpoint:** `DELETE /api/warehouses/staff-assignments/:assignmentId`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/staff-assignments/1" \
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
    "assignmentId": 1,
    "staffId": 5,
    "staffName": "John Picker",
    "warehouseId": 1,
    "warehouseName": "Main Distribution Center",
    "removedAt": "2024-01-02T00:30:00.000Z",
    "removedBy": 1,
    "message": "Staff assignment removed successfully"
  },
  "error": null
}
```

## Warehouse Creation Examples

### 1. Create Regional Warehouse
```bash
curl -X POST "http://localhost:3000/api/warehouses" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regional Distribution Center",
    "code": "RDC-001",
    "address": {
      "street": "456 Regional Ave",
      "city": "Regional City",
      "state": "TX",
      "zipCode": "75001",
      "country": "USA"
    },
    "contactInfo": {
      "phone": "+1234567892",
      "email": "regional@company.com",
      "manager": "Mike Regional"
    },
    "capacity": {
      "totalArea": 30000,
      "unit": "sqft",
      "maxInventory": 60000
    },
    "operatingHours": {
      "monday": "07:00-21:00",
      "tuesday": "07:00-21:00",
      "wednesday": "07:00-21:00",
      "thursday": "07:00-21:00",
      "friday": "07:00-21:00",
      "saturday": "09:00-17:00",
      "sunday": "closed"
    }
  }'
```

### 2. Create Cold Storage Warehouse
```bash
curl -X POST "http://localhost:3000/api/warehouses" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cold Storage Facility",
    "code": "CSF-001",
    "address": {
      "street": "789 Cold St",
      "city": "Cold City",
      "state": "FL",
      "zipCode": "33101",
      "country": "USA"
    },
    "contactInfo": {
      "phone": "+1234567893",
      "email": "cold@company.com",
      "manager": "Lisa Cold"
    },
    "capacity": {
      "totalArea": 15000,
      "unit": "sqft",
      "maxInventory": 25000
    },
    "operatingHours": {
      "monday": "24/7",
      "tuesday": "24/7",
      "wednesday": "24/7",
      "thursday": "24/7",
      "friday": "24/7",
      "saturday": "24/7",
      "sunday": "24/7"
    },
    "specialFeatures": ["refrigeration", "freezer_sections", "temperature_monitoring"]
  }'
```

## Zone Management Examples

### 1. Create High-Security Zone
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/zones" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High-Security Zone",
    "code": "HS",
    "description": "High-value and sensitive items storage",
    "area": 2000,
    "capacity": 5000,
    "temperature": "controlled",
    "specialRequirements": ["security_access", "cctv_monitoring", "alarm_system", "fire_suppression"]
  }'
```

### 2. Create Bulk Storage Zone
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/zones" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bulk Storage Zone",
    "code": "BS",
    "description": "Large quantity and pallet storage",
    "area": 12000,
    "capacity": 30000,
    "temperature": "ambient",
    "specialRequirements": ["forklift_access", "pallet_racking", "loading_docks"]
  }'
```

## Error Responses

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions. Required: warehouse:manage"
}
```

### Warehouse Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Warehouse not found"
}
```

### Zone Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Zone not found"
}
```

### Invalid Warehouse Data
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid warehouse data: missing required fields"
}
```

### Cannot Delete Active Warehouse
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Cannot delete warehouse with active inventory or staff"
}
```

## Best Practices

### Warehouse Design
- Plan zones based on product types
- Consider workflow efficiency
- Implement proper security measures
- Optimize space utilization

### Zone Management
- Group similar products together
- Consider temperature and security requirements
- Plan for future expansion
- Maintain clear zone boundaries

### Staff Assignment
- Match skills to zone requirements
- Consider shift patterns and availability
- Provide proper training
- Monitor performance regularly

## Mobile App Integration

### Warehouse Display
- Show warehouse information clearly
- Display zone layouts
- Provide staff assignment details
- Show real-time utilization

### Zone Management
- Easy zone creation and editing
- Visual zone representation
- Quick staff assignment
- Inventory tracking

### Offline Handling
- Cache warehouse information
- Queue zone updates
- Sync when connection restored
- Handle conflicts gracefully

# Warehouse Management Module

This document covers all warehouse management endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## Overview

The warehouse management module provides comprehensive functionality for managing warehouses, zones, and staff assignments. It includes operations for creating, updating, and monitoring warehouse infrastructure and personnel.

## 🏗️ Warehouse Management

### Create Warehouse

**Endpoint:** `POST /api/warehouses`

**Description:** Creates a new warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "warehouse_code": "WH001",
  "name": "Main Distribution Center",
  "type": "MAIN",
  "address": "123 Warehouse St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "pincode": "10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "contact_person": "John Doe",
  "contact_email": "warehouse@ozi.com",
  "contact_phone": "+1234567890",
  "emergency_contact": "+1234567891",
  "operational_hours": {
    "monday": "08:00-18:00",
    "tuesday": "08:00-18:00",
    "wednesday": "08:00-18:00",
    "thursday": "08:00-18:00",
    "friday": "08:00-18:00"
  },
  "capacity_sqft": 50000,
  "storage_capacity_units": 100000,
  "services_offered": ["picking", "packing", "shipping"],
  "supported_fulfillment_types": ["ecommerce", "retail", "wholesale"],
  "is_auto_assignment_enabled": true,
  "max_orders_per_day": 1000,
  "sla_hours": 24,
  "lms_warehouse_id": "LMS_WH_001"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/warehouses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "warehouse_code": "WH001",
    "name": "Main Distribution Center",
    "type": "MAIN",
    "address": "123 Warehouse St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001",
    "contact_person": "John Doe",
    "contact_email": "warehouse@ozi.com",
    "contact_phone": "+1234567890"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/warehouses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "warehouse_code": "WH001",
    "name": "Main Distribution Center",
    "type": "MAIN",
    "address": "123 Warehouse St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001",
    "contact_person": "John Doe",
    "contact_email": "warehouse@ozi.com",
    "contact_phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 1,
    "warehouse_code": "WH001",
    "name": "Main Distribution Center",
    "type": "MAIN",
    "status": "ACTIVE",
    "address": "123 Warehouse St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "contact_person": "John Doe",
    "contact_email": "warehouse@ozi.com",
    "contact_phone": "+1234567890",
    "emergency_contact": "+1234567891",
    "operational_hours": {
      "monday": "08:00-18:00",
      "tuesday": "08:00-18:00",
      "wednesday": "08:00-18:00",
      "thursday": "08:00-18:00",
      "friday": "08:00-18:00"
    },
    "capacity_sqft": 50000,
    "storage_capacity_units": 100000,
    "current_utilization_percentage": 0,
    "services_offered": ["picking", "packing", "shipping"],
    "supported_fulfillment_types": ["ecommerce", "retail", "wholesale"],
    "is_auto_assignment_enabled": true,
    "max_orders_per_day": 1000,
    "sla_hours": 24,
    "lms_warehouse_id": "LMS_WH_001",
    "integration_status": "PENDING",
    "created_by": 1,
    "updated_by": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "error": null
}
```

### Get All Warehouses

**Endpoint:** `GET /api/warehouses`

**Description:** Retrieves all warehouses with filtering and pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `status` (optional): Filter by status (ACTIVE, INACTIVE, UNDER_MAINTENANCE)
- `type` (optional): Filter by type (MAIN, SATELLITE, STOREFRONT, DISTRIBUTION)
- `city` (optional): Filter by city
- `state` (optional): Filter by state
- `country` (optional): Filter by country
- `has_capacity` (optional): Filter by capacity availability (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name, code, city, or state

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses?status=ACTIVE&type=MAIN&page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses?status=ACTIVE&type=MAIN&page=1&limit=10" \
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
    "warehouses": [
      {
        "id": 1,
        "warehouse_code": "WH001",
        "name": "Main Distribution Center",
        "type": "MAIN",
        "status": "ACTIVE",
        "address": "123 Warehouse St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "pincode": "10001",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "contact_person": "John Doe",
        "contact_email": "warehouse@ozi.com",
        "contact_phone": "+1234567890",
        "emergency_contact": "+1234567891",
        "operational_hours": {
          "monday": "08:00-18:00",
          "tuesday": "08:00-18:00",
          "wednesday": "08:00-18:00",
          "thursday": "08:00-18:00",
          "friday": "08:00-18:00"
        },
        "capacity_sqft": 50000,
        "storage_capacity_units": 100000,
        "current_utilization_percentage": 0,
        "services_offered": ["picking", "packing", "shipping"],
        "supported_fulfillment_types": ["ecommerce", "retail", "wholesale"],
        "is_auto_assignment_enabled": true,
        "max_orders_per_day": 1000,
        "sla_hours": 24,
        "lms_warehouse_id": "LMS_WH_001",
        "integration_status": "PENDING",
        "created_by": 1,
        "updated_by": 1,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "error": null
}
```

### Get Warehouse by ID

**Endpoint:** `GET /api/warehouses/:id`

**Description:** Retrieves a specific warehouse by ID with zones and staff.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1" \
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
    "warehouse_code": "WH001",
    "name": "Main Distribution Center",
    "type": "MAIN",
    "status": "ACTIVE",
    "address": "123 Warehouse St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "contact_person": "John Doe",
    "contact_email": "warehouse@ozi.com",
    "contact_phone": "+1234567890",
    "emergency_contact": "+1234567891",
    "operational_hours": {
      "monday": "08:00-18:00",
      "tuesday": "08:00-18:00",
      "wednesday": "08:00-18:00",
      "thursday": "08:00-18:00",
      "friday": "08:00-18:00"
    },
    "capacity_sqft": 50000,
    "storage_capacity_units": 100000,
    "current_utilization_percentage": 0,
    "services_offered": ["picking", "packing", "shipping"],
    "supported_fulfillment_types": ["ecommerce", "retail", "wholesale"],
    "is_auto_assignment_enabled": true,
    "max_orders_per_day": 1000,
    "sla_hours": 24,
    "lms_warehouse_id": "LMS_WH_001",
    "integration_status": "PENDING",
    "created_by": 1,
    "updated_by": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "Zones": [],
    "StaffAssignments": []
  },
  "error": null
}
```

### Update Warehouse

**Endpoint:** `PUT /api/warehouses/:id`

**Description:** Updates an existing warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "Updated Distribution Center",
  "contact_person": "Jane Smith",
  "contact_email": "jane.warehouse@ozi.com",
  "max_orders_per_day": 1500
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://localhost:3000/api/warehouses/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "Updated Distribution Center",
    "contact_person": "Jane Smith",
    "contact_email": "jane.warehouse@ozi.com",
    "max_orders_per_day": 1500
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://localhost:3000/api/warehouses/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "name": "Updated Distribution Center",
    "contact_person": "Jane Smith",
    "contact_email": "jane.warehouse@ozi.com",
    "max_orders_per_day": 1500
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 1,
    "warehouse_code": "WH001",
    "name": "Updated Distribution Center",
    "type": "MAIN",
    "status": "ACTIVE",
    "address": "123 Warehouse St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "contact_person": "Jane Smith",
    "contact_email": "jane.warehouse@ozi.com",
    "contact_phone": "+1234567890",
    "emergency_contact": "+1234567891",
    "operational_hours": {
      "monday": "08:00-18:00",
      "tuesday": "08:00-18:00",
      "wednesday": "08:00-18:00",
      "thursday": "08:00-18:00",
      "friday": "08:00-18:00"
    },
    "capacity_sqft": 50000,
    "storage_capacity_units": 100000,
    "current_utilization_percentage": 0,
    "services_offered": ["picking", "packing", "shipping"],
    "supported_fulfillment_types": ["ecommerce", "retail", "wholesale"],
    "is_auto_assignment_enabled": true,
    "max_orders_per_day": 1500,
    "sla_hours": 24,
    "lms_warehouse_id": "LMS_WH_001",
    "integration_status": "PENDING",
    "created_by": 1,
    "updated_by": 2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "error": null
}
```

### Update Warehouse Status

**Endpoint:** `PATCH /api/warehouses/:id/status`

**Description:** Updates the status of a warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "status": "UNDER_MAINTENANCE"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PATCH "http://localhost:3000/api/warehouses/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "status": "UNDER_MAINTENANCE"
  }'
```

**Mobile Client:**
```bash
curl -X PATCH "http://localhost:3000/api/warehouses/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "status": "UNDER_MAINTENANCE"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Warehouse status updated successfully"
  },
  "error": null
}
```

### Delete Warehouse

**Endpoint:** `DELETE /api/warehouses/:id`

**Description:** Deactivates a warehouse (soft delete).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/1" \
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
    "message": "Warehouse deactivated successfully"
  },
  "error": null
}
```

## 🗂️ Zone Management

### Create Zone

**Endpoint:** `POST /api/warehouses/:warehouseId/zones`

**Description:** Creates a new zone within a warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "zone_code": "ZONE-A",
  "zone_name": "Picking Zone A",
  "zone_type": "PICKING",
  "temperature_zone": "AMBIENT",
  "capacity_units": 1000
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/zones" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "zone_code": "ZONE-A",
    "zone_name": "Picking Zone A",
    "zone_type": "PICKING",
    "temperature_zone": "AMBIENT",
    "capacity_units": 1000
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/zones" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "zone_code": "ZONE-A",
    "zone_name": "Picking Zone A",
    "zone_type": "PICKING",
    "temperature_zone": "AMBIENT",
    "capacity_units": 1000
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 1,
    "warehouse_id": 1,
    "zone_code": "ZONE-A",
    "zone_name": "Picking Zone A",
    "zone_type": "PICKING",
    "temperature_zone": "AMBIENT",
    "capacity_units": 1000,
    "current_utilization": 0,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "Warehouse": {
      "id": 1,
      "name": "Main Distribution Center",
      "warehouse_code": "WH001"
    }
  },
  "error": null
}
```

### Get Warehouse Zones

**Endpoint:** `GET /api/warehouses/:warehouseId/zones`

**Description:** Retrieves all zones for a specific warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1/zones" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1/zones" \
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
      "warehouse_id": 1,
      "zone_code": "ZONE-A",
      "zone_name": "Picking Zone A",
      "zone_type": "PICKING",
      "temperature_zone": "AMBIENT",
      "capacity_units": 1000,
      "current_utilization": 0,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "Warehouse": {
        "id": 1,
        "name": "Main Distribution Center",
        "warehouse_code": "WH001"
      }
    }
  ],
  "error": null
}
```

### Update Zone

**Endpoint:** `PUT /api/warehouses/zones/:zoneId`

**Description:** Updates an existing zone.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "zone_name": "Updated Picking Zone A",
  "capacity_units": 1500
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://localhost:3000/api/warehouses/zones/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "zone_name": "Updated Picking Zone A",
    "capacity_units": 1500
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://localhost:3000/api/warehouses/zones/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "zone_name": "Updated Picking Zone A",
    "capacity_units": 1500
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 1,
    "warehouse_id": 1,
    "zone_code": "ZONE-A",
    "zone_name": "Updated Picking Zone A",
    "zone_type": "PICKING",
    "temperature_zone": "AMBIENT",
    "capacity_units": 1500,
    "current_utilization": 0,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "Warehouse": {
      "id": 1,
      "name": "Main Distribution Center",
      "warehouse_code": "WH001"
    }
  },
  "error": null
}
```

### Delete Zone

**Endpoint:** `DELETE /api/warehouses/zones/:zoneId`

**Description:** Deletes a zone (only if no utilization).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/zones/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/zones/1" \
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
    "message": "Zone deleted successfully"
  },
  "error": null
}
```

## 👥 Staff Assignment Management

### Assign Staff to Warehouse

**Endpoint:** `POST /api/warehouses/:warehouseId/staff`

**Description:** Assigns staff members to a warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "user_id": 2,
  "role": "MANAGER",
  "assigned_date": "2024-01-15T10:30:00.000Z",
  "end_date": "2024-12-31T23:59:59.000Z"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "user_id": 2,
    "role": "MANAGER",
    "assigned_date": "2024-01-15T10:30:00.000Z"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/warehouses/1/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "user_id": 2,
    "role": "MANAGER",
    "assigned_date": "2024-01-15T10:30:00.000Z"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 1,
    "warehouse_id": 1,
    "user_id": 2,
    "role": "MANAGER",
    "assigned_date": "2024-01-15T10:30:00.000Z",
    "end_date": null,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "Warehouse": {
      "id": 1,
      "name": "Main Distribution Center",
      "warehouse_code": "WH001"
    },
    "User": {
      "id": 2,
      "email": "manager@ozi.com"
    }
  },
  "error": null
}
```

### Get Warehouse Staff

**Endpoint:** `GET /api/warehouses/:warehouseId/staff`

**Description:** Retrieves all staff assigned to a warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses/1/staff" \
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
      "warehouse_id": 1,
      "user_id": 2,
      "role": "MANAGER",
      "assigned_date": "2024-01-15T10:30:00.000Z",
      "end_date": null,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "Warehouse": {
        "id": 1,
        "name": "Main Distribution Center",
        "warehouse_code": "WH001"
      },
      "User": {
        "id": 2,
        "email": "manager@ozi.com"
      }
    }
  ],
  "error": null
}
```

### Remove Staff Assignment

**Endpoint:** `DELETE /api/warehouses/staff-assignments/:assignmentId`

**Description:** Removes a staff assignment from a warehouse.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/staff-assignments/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X DELETE "http://localhost:3000/api/warehouses/staff-assignments/1" \
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
    "message": "Staff assignment removed successfully"
  },
  "error": null
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
  "error": "User not authenticated"
}
```

**Warehouse Not Found:**
```json
{
  "statusCode": 404,
  "success": false,
  "error": "Warehouse not found"
}
```

**Zone Not Found:**
```json
{
  "statusCode": 404,
  "success": false,
  "error": "Zone not found"
}
```

**User Not Found:**
```json
{
  "statusCode": 404,
  "success": false,
  "error": "User not found"
}
```

**Warehouse Code Already Exists:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Warehouse code already exists"
}
```

**Zone Code Already Exists:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Zone code already exists for this warehouse"
}
```

**Staff Assignment Already Exists:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Staff assignment already exists"
}
```

**Cannot Delete Zone with Utilization:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Cannot delete zone with active utilization"
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
5. **Audit Logging**: Track all warehouse operations

## 📋 Operation Flow

### Warehouse Creation Flow
1. User provides warehouse details
2. System validates required fields
3. System checks for existing warehouse codes
4. System creates warehouse record
5. Success response with warehouse details

### Zone Management Flow
1. User provides zone details
2. System validates warehouse exists
3. System checks for existing zone codes
4. System creates/updates zone record
5. Success response with zone details

### Staff Assignment Flow
1. User provides staff assignment details
2. System validates warehouse and user exist
3. System checks for existing assignments
4. System creates assignment record
5. Success response with assignment details

---

This document covers all warehouse management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.

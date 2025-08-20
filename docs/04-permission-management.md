# Permission Management Module

This document covers all permission management endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## Overview

The permission management module provides functionality for creating and managing system permissions. It supports granular access control and allows administrators to define specific permissions for different operations.

## 🔐 Permission Operations

### Create New Permission

**Endpoint:** `POST /api/permissions`

**Description:** Creates a new permission in the system (admin only).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "orders:view_all",
  "description": "View all orders in the system",
  "module": "orders",
  "action": "view_all"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "orders:view_all",
    "description": "View all orders in the system",
    "module": "orders",
    "action": "view_all"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "name": "orders:view_all",
    "description": "View all orders in the system",
    "module": "orders",
    "action": "view_all"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 1,
    "name": "orders:view_all",
    "description": "View all orders in the system",
    "module": "orders",
    "action": "view_all",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "error": null
}
```

### List All Permissions

**Endpoint:** `GET /api/permissions`

**Description:** Retrieves all permissions in the system (admin only).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/permissions" \
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
      "name": "orders:view_all",
      "description": "View all orders in the system",
      "module": "orders",
      "action": "view_all",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "users_roles:manage",
      "description": "Manage users and roles",
      "module": "users_roles",
      "action": "manage",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 3,
      "name": "picking:assign_manage",
      "description": "Assign and manage picking operations",
      "module": "picking",
      "action": "assign_manage",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
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

**Insufficient Permissions:**
```json
{
  "statusCode": 403,
  "success": false,
  "error": "Insufficient permissions"
}
```

**Permission Not Found:**
```json
{
  "statusCode": 404,
  "success": false,
  "error": "Permission not found"
}
```

**Permission Name Already Exists:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Permission name already exists"
}
```

**Invalid Permission Data:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Invalid permission data provided"
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
2. **Permission-Based Access**: Only users with `users_roles:manage` permission can access these endpoints
3. **Input Validation**: Comprehensive request validation
4. **Version Control**: Mobile app compatibility checking
5. **Audit Logging**: Track all permission management operations

## 📋 Operation Flow

### Permission Creation Flow
1. User provides permission details (name, description, module, action)
2. System validates required fields
3. System checks for existing permission names
4. System creates permission record
5. Success response with permission details

### Permission Listing Flow
1. User requests all permissions
2. System validates user permissions
3. System retrieves all permissions
4. Success response with permissions list

## 📚 Common Permission Examples

### Order Management
- `orders:view_all` - View all orders
- `orders:view_own` - View own orders
- `orders:create` - Create new orders
- `orders:update` - Update orders
- `orders:cancel` - Cancel orders

### User Management
- `users_roles:manage` - Manage users and roles
- `users:view` - View user information
- `users:create` - Create new users
- `users:update` - Update user information
- `users:delete` - Delete users

### Picking Operations
- `picking:view` - View picking operations
- `picking:assign_manage` - Assign and manage picking
- `picking:execute` - Execute picking operations

### Packing Operations
- `packing:view` - View packing operations
- `packing:execute` - Execute packing operations

### Warehouse Management
- `warehouse:view` - View warehouse information
- `warehouse:manage` - Manage warehouse operations
- `staff:assign` - Assign staff to warehouses

### POS Operations
- `pos:execute` - Execute POS operations

---

This document covers all permission management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.

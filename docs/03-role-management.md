# Role Management Module

This document covers all role management endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## Overview

The role management module provides functionality for creating and managing user roles in the system. It supports role-based access control (RBAC) and allows administrators to assign permissions to roles.

## 👥 Role Operations

### Create New Role

**Endpoint:** `POST /api/roles`

**Description:** Creates a new role in the system (admin only).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "warehouse_manager",
  "description": "Manages warehouse operations and staff",
  "permissions": ["warehouse:view", "warehouse:manage", "staff:assign"]
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "warehouse_manager",
    "description": "Manages warehouse operations and staff",
    "permissions": ["warehouse:view", "warehouse:manage", "staff:assign"]
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "name": "warehouse_manager",
    "description": "Manages warehouse operations and staff",
    "permissions": ["warehouse:view", "warehouse:manage", "staff:assign"]
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 1,
    "name": "warehouse_manager",
    "description": "Manages warehouse operations and staff",
    "permissions": ["warehouse:view", "warehouse:manage", "staff:assign"],
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "error": null
}
```

### Assign Permissions to Role

**Endpoint:** `POST /api/roles/assign-permissions`

**Description:** Assigns permissions to an existing role (admin only).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "roleId": 1,
  "permissions": ["picking:view", "picking:execute", "packing:view"]
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/roles/assign-permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "roleId": 1,
    "permissions": ["picking:view", "picking:execute", "packing:view"]
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/roles/assign-permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "roleId": 1,
    "permissions": ["picking:view", "picking:execute", "packing:view"]
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Permissions assigned successfully",
    "roleId": 1,
    "assignedPermissions": ["picking:view", "picking:execute", "packing:view"]
  },
  "error": null
}
```

### List All Roles

**Endpoint:** `GET /api/roles`

**Description:** Retrieves all roles in the system (admin only).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/roles" \
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
      "name": "admin",
      "description": "Full system access",
      "permissions": ["*"],
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "warehouse_manager",
      "description": "Manages warehouse operations and staff",
      "permissions": ["warehouse:view", "warehouse:manage", "staff:assign"],
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

**Role Not Found:**
```json
{
  "statusCode": 404,
  "success": false,
  "error": "Role not found"
}
```

**Role Name Already Exists:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Role name already exists"
}
```

**Invalid Permission:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Invalid permission provided"
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
5. **Audit Logging**: Track all role management operations

## 📋 Operation Flow

### Role Creation Flow
1. User provides role details (name, description, permissions)
2. System validates required fields
3. System checks for existing role names
4. System creates role record
5. Success response with role details

### Permission Assignment Flow
1. User provides role ID and permissions list
2. System validates role exists
3. System validates permissions are valid
4. System assigns permissions to role
5. Success response with assignment details

### Role Listing Flow
1. User requests all roles
2. System validates user permissions
3. System retrieves all roles with their permissions
4. Success response with roles list

---

This document covers all role management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.

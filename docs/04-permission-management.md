# Permission Management (Admin Only)

This document covers all permission management endpoints for the OZi Backend system. These endpoints are restricted to users with admin privileges.

**Base URL:** `http://13.232.150.239`

## 🔐 Permission Operations

### Get All Permissions

**Endpoint:** `GET /api/v1/permissions`

**Description:** Retrieves all available permissions in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `module` (optional): Filter by module (users, orders, picking, packing, etc.)
- `action` (optional): Filter by action (read, write, delete, execute)
- `status` (optional): Filter by status (active, inactive)

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions?page=1&limit=10&module=users&action=read&status=active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": 1,
        "name": "read:users",
        "description": "Read user information",
        "module": "users",
        "action": "read",
        "status": "active",
        "assignedToRoles": 3,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "write:users",
        "description": "Create and modify users",
        "module": "users",
        "action": "write",
        "status": "active",
        "assignedToRoles": 2,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24,
      "totalPages": 3
    }
  }
}
```

### Get Permission by ID

**Endpoint:** `GET /api/v1/permissions/:id`

**Description:** Retrieves a specific permission by its ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permission": {
      "id": 1,
      "name": "read:users",
      "description": "Read user information",
      "module": "users",
      "action": "read",
      "status": "active",
      "assignedToRoles": [
        {
          "id": 1,
          "name": "Super Admin"
        },
        {
          "id": 2,
          "name": "Admin"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create New Permission

**Endpoint:** `POST /api/v1/permissions`

**Description:** Creates a new permission in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "execute:reports",
  "description": "Execute and generate system reports",
  "module": "reports",
  "action": "execute",
  "status": "active"
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "execute:reports",
    "description": "Execute and generate system reports",
    "module": "reports",
    "action": "execute",
    "status": "active"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "permission": {
      "id": 25,
      "name": "execute:reports",
      "description": "Execute and generate system reports",
      "module": "reports",
      "action": "execute",
      "status": "active",
      "assignedToRoles": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update Permission

**Endpoint:** `PUT /api/v1/permissions/:id`

**Description:** Updates an existing permission.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "execute:reports",
  "description": "Execute, generate, and export system reports",
  "module": "reports",
  "action": "execute",
  "status": "active"
}
```

**cURL Example:**
```bash
curl -X PUT "http://13.232.150.239/api/v1/permissions/25" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "execute:reports",
    "description": "Execute, generate, and export system reports",
    "module": "reports",
    "action": "execute",
    "status": "active"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Permission updated successfully",
  "data": {
    "permission": {
      "id": 25,
      "name": "execute:reports",
      "description": "Execute, generate, and export system reports",
      "module": "reports",
      "action": "execute",
      "status": "active",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Delete Permission

**Endpoint:** `DELETE /api/v1/permissions/:id`

**Description:** Deletes a permission (only if not assigned to any roles).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "http://13.232.150.239/api/v1/permissions/25" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "Permission deleted successfully"
}
```

### Activate/Deactivate Permission

**Endpoint:** `PATCH /api/v1/permissions/:id/status`

**Description:** Changes the status of a permission (active/inactive).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "status": "inactive"
}
```

**cURL Example:**
```bash
curl -X PATCH "http://13.232.150.239/api/v1/permissions/25/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "status": "inactive"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Permission status updated successfully",
  "data": {
    "permission": {
      "id": 25,
      "status": "inactive",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

## 🏗️ Permission Structure Management

### Get Permission Modules

**Endpoint:** `GET /api/v1/permissions/modules`

**Description:** Retrieves all available permission modules.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/modules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "name": "users",
        "description": "User management operations",
        "permissionCount": 4,
        "actions": ["read", "write", "delete", "approve"]
      },
      {
        "name": "orders",
        "description": "Order management operations",
        "permissionCount": 6,
        "actions": ["read", "write", "delete", "approve", "cancel", "process"]
      },
      {
        "name": "picking",
        "description": "Picking operations",
        "permissionCount": 5,
        "actions": ["read", "write", "execute", "approve", "cancel"]
      }
    ]
  }
}
```

### Get Permission Actions

**Endpoint:** `GET /api/v1/permissions/actions`

**Description:** Retrieves all available permission actions.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/actions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "name": "read",
        "description": "View and read information",
        "usageCount": 15
      },
      {
        "name": "write",
        "description": "Create and modify information",
        "usageCount": 12
      },
      {
        "name": "delete",
        "description": "Remove information",
        "usageCount": 8
      },
      {
        "name": "execute",
        "description": "Execute operations and processes",
        "usageCount": 6
      }
    ]
  }
}
```

## 🔍 Permission Search and Filtering

### Search Permissions

**Endpoint:** `GET /api/v1/permissions/search`

**Description:** Advanced search for permissions with multiple criteria.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (required): Search query
- `module` (optional): Filter by module
- `action` (optional): Filter by action
- `status` (optional): Filter by status
- `assignedToRole` (optional): Filter by role assignment

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/search?q=user&module=users&action=write&status=active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Get Permissions by Module

**Endpoint:** `GET /api/v1/permissions/module/:moduleName`

**Description:** Retrieves all permissions for a specific module.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/module/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "module": "users",
    "permissions": [
      {
        "id": 1,
        "name": "read:users",
        "description": "Read user information",
        "action": "read",
        "status": "active"
      },
      {
        "id": 2,
        "name": "write:users",
        "description": "Create and modify users",
        "action": "write",
        "status": "active"
      }
    ]
  }
}
```

## 📊 Permission Analytics

### Get Permission Statistics

**Endpoint:** `GET /api/v1/permissions/statistics`

**Description:** Retrieves statistics about permissions and their usage.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/statistics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPermissions": 24,
    "activePermissions": 22,
    "inactivePermissions": 2,
    "totalModules": 8,
    "totalActions": 6,
    "moduleDistribution": [
      {
        "module": "users",
        "permissionCount": 4,
        "percentage": 16.67
      },
      {
        "module": "orders",
        "permissionCount": 6,
        "percentage": 25.0
      }
    ],
    "actionDistribution": [
      {
        "action": "read",
        "permissionCount": 8,
        "percentage": 33.33
      },
      {
        "action": "write",
        "permissionCount": 7,
        "percentage": 29.17
      }
    ],
    "mostUsedPermissions": [
      "read:users",
      "read:orders",
      "write:orders"
    ]
  }
}
```

### Get Permission Usage Report

**Endpoint:** `GET /api/v1/permissions/usage-report`

**Description:** Generates a detailed report of permission usage across roles.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `format` (optional): Report format (json, csv, pdf)
- `dateFrom` (optional): Start date for the report
- `dateTo` (optional): End date for the report

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/usage-report?format=json&dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔄 Bulk Permission Operations

### Bulk Create Permissions

**Endpoint:** `POST /api/v1/permissions/bulk`

**Description:** Creates multiple permissions at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "permissions": [
    {
      "name": "read:analytics",
      "description": "Read analytics and reports",
      "module": "analytics",
      "action": "read"
    },
    {
      "name": "write:analytics",
      "description": "Create and modify analytics",
      "module": "analytics",
      "action": "write"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/permissions/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "permissions": [
      {
        "name": "read:analytics",
        "description": "Read analytics and reports",
        "module": "analytics",
        "action": "read"
      },
      {
        "name": "write:analytics",
        "description": "Create and modify analytics",
        "module": "analytics",
        "action": "write"
      }
    ]
  }'
```

### Bulk Update Permissions

**Endpoint:** `PUT /api/v1/permissions/bulk`

**Description:** Updates multiple permissions at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "updates": [
    {
      "id": 1,
      "description": "Updated description for read:users"
    },
    {
      "id": 2,
      "description": "Updated description for write:users"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X PUT "http://13.232.150.239/api/v1/permissions/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "updates": [
      {
        "id": 1,
        "description": "Updated description for read:users"
      },
      {
        "id": 2,
        "description": "Updated description for write:users"
      }
    ]
  }'
```

## 🔐 Permission Templates

### Get Permission Templates

**Endpoint:** `GET /api/v1/permissions/templates`

**Description:** Retrieves predefined permission templates for common use cases.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/permissions/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "name": "Basic User",
        "description": "Basic user permissions for viewing information",
        "permissions": ["read:orders", "read:profile", "read:notifications"]
      },
      {
        "name": "Manager",
        "description": "Manager permissions for team oversight",
        "permissions": ["read:*", "write:orders", "read:reports", "write:users"]
      },
      {
        "name": "Administrator",
        "description": "Full administrative access",
        "permissions": ["*"]
      }
    ]
  }
}
```

### Apply Permission Template

**Endpoint:** `POST /api/v1/permissions/templates/:templateName/apply`

**Description:** Applies a permission template to create multiple permissions.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "customize": true,
  "customPermissions": [
    "read:custom_module",
    "write:custom_module"
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/permissions/templates/Basic%20User/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "customize": true,
    "customPermissions": [
      "read:custom_module",
      "write:custom_module"
    ]
  }'
```

## ⚠️ Error Responses

### Common Error Responses

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions to manage permissions",
  "statusCode": 403
}
```

**Permission Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Permission not found",
  "statusCode": 404
}
```

**Permission in Use:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Cannot delete permission. It is currently assigned to roles",
  "statusCode": 409
}
```

**Duplicate Permission Name:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Permission name already exists",
  "statusCode": 409
}
```

**Invalid Permission Name:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid permission name format. Use format: action:module",
  "statusCode": 400
}
```

## 🔐 Security Considerations

1. **Admin Only**: All permission management endpoints require admin privileges
2. **Permission Validation**: Changes to permissions are logged and audited
3. **Cascade Protection**: Cannot delete permissions that are currently assigned to roles
4. **System Permission Protection**: Core system permissions cannot be deleted
5. **Permission Inheritance**: Role permissions are inherited by assigned users
6. **Audit Logging**: All permission changes are logged for security tracking

## 📋 Best Practices

1. **Naming Convention**: Use consistent naming format (action:module)
2. **Granular Permissions**: Create specific permissions rather than broad ones
3. **Documentation**: Maintain clear descriptions for each permission
4. **Regular Review**: Periodically review and clean up unused permissions
5. **Testing**: Test permission changes in development before production
6. **Backup**: Keep backups of permission configurations before major changes
7. **Template Usage**: Use predefined templates for common permission sets
8. **Module Organization**: Group related permissions by module

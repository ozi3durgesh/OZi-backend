# Role Management (Admin Only)

This document covers all role management endpoints for the OZi Backend system. These endpoints are restricted to users with admin privileges.

## 👑 Role Operations

### Get All Roles

**Endpoint:** `GET /api/v1/roles`

**Description:** Retrieves all available roles in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `search` (optional): Search term for role names
- `status` (optional): Filter by status (active, inactive)

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/roles?page=1&limit=10&search=admin&status=active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": 1,
        "name": "Super Admin",
        "description": "Full system access with all permissions",
        "permissions": ["*"],
        "status": "active",
        "userCount": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Admin",
        "description": "Administrative access with most permissions",
        "permissions": ["read:*", "write:users", "write:orders", "read:reports"],
        "status": "active",
        "userCount": 3,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "totalPages": 1
    }
  }
}
```

### Get Role by ID

**Endpoint:** `GET /api/v1/roles/:id`

**Description:** Retrieves a specific role by its ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/roles/2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 2,
      "name": "Admin",
      "description": "Administrative access with most permissions",
      "permissions": [
        {
          "id": 1,
          "name": "read:users",
          "description": "Read user information"
        },
        {
          "id": 2,
          "name": "write:users",
          "description": "Create and modify users"
        }
      ],
      "status": "active",
      "userCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create New Role

**Endpoint:** `POST /api/v1/roles`

**Description:** Creates a new role in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "Warehouse Manager",
  "description": "Manages warehouse operations and staff",
  "permissions": ["read:orders", "write:orders", "read:users", "read:reports"],
  "status": "active"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "Warehouse Manager",
    "description": "Manages warehouse operations and staff",
    "permissions": ["read:orders", "write:orders", "read:users", "read:reports"],
    "status": "active"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role": {
      "id": 5,
      "name": "Warehouse Manager",
      "description": "Manages warehouse operations and staff",
      "permissions": ["read:orders", "write:orders", "read:users", "read:reports"],
      "status": "active",
      "userCount": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update Role

**Endpoint:** `PUT /api/v1/roles/:id`

**Description:** Updates an existing role.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "Senior Warehouse Manager",
  "description": "Senior manager with extended warehouse permissions",
  "permissions": ["read:orders", "write:orders", "read:users", "write:users", "read:reports", "write:reports"],
  "status": "active"
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/roles/5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "Senior Warehouse Manager",
    "description": "Senior manager with extended warehouse permissions",
    "permissions": ["read:orders", "write:orders", "read:users", "write:users", "read:reports", "write:reports"],
    "status": "active"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "role": {
      "id": 5,
      "name": "Senior Warehouse Manager",
      "description": "Senior manager with extended warehouse permissions",
      "permissions": ["read:orders", "write:orders", "read:users", "write:users", "read:reports", "write:reports"],
      "status": "active",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Delete Role

**Endpoint:** `DELETE /api/v1/roles/:id`

**Description:** Deletes a role (only if no users are assigned to it).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "https://your-app.onrender.com/api/v1/roles/5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### Activate/Deactivate Role

**Endpoint:** `PATCH /api/v1/roles/:id/status`

**Description:** Changes the status of a role (active/inactive).

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
curl -X PATCH "https://your-app.onrender.com/api/v1/roles/5/status" \
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
  "message": "Role status updated successfully",
  "data": {
    "role": {
      "id": 5,
      "status": "inactive",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

## 🔐 Role Permission Management

### Get Role Permissions

**Endpoint:** `GET /api/v1/roles/:id/permissions`

**Description:** Retrieves all permissions assigned to a specific role.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/roles/2/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 2,
      "name": "Admin"
    },
    "permissions": [
      {
        "id": 1,
        "name": "read:users",
        "description": "Read user information",
        "module": "users",
        "action": "read"
      },
      {
        "id": 2,
        "name": "write:users",
        "description": "Create and modify users",
        "module": "users",
        "action": "write"
      }
    ]
  }
}
```

### Update Role Permissions

**Endpoint:** `PUT /api/v1/roles/:id/permissions`

**Description:** Updates the permissions assigned to a role.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "permissions": ["read:users", "write:users", "read:orders", "write:orders", "read:reports"]
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/roles/2/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "permissions": ["read:users", "write:users", "read:orders", "write:orders", "read:reports"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Role permissions updated successfully",
  "data": {
    "role": {
      "id": 2,
      "permissions": ["read:users", "write:users", "read:orders", "write:orders", "read:reports"]
    }
  }
}
```

### Add Permission to Role

**Endpoint:** `POST /api/v1/roles/:id/permissions`

**Description:** Adds a specific permission to a role.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "permission": "write:reports"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/roles/2/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "permission": "write:reports"
  }'
```

### Remove Permission from Role

**Endpoint:** `DELETE /api/v1/roles/:id/permissions/:permissionId`

**Description:** Removes a specific permission from a role.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "https://your-app.onrender.com/api/v1/roles/2/permissions/5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 👥 Role User Management

### Get Users by Role

**Endpoint:** `GET /api/v1/roles/:id/users`

**Description:** Retrieves all users assigned to a specific role.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `status` (optional): Filter by user status

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/roles/2/users?page=1&limit=10&status=active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 2,
      "name": "Admin"
    },
    "users": [
      {
        "id": 3,
        "email": "admin1@ozi.com",
        "firstName": "John",
        "lastName": "Admin",
        "status": "active",
        "lastLogin": "2024-01-15T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Assign Role to User

**Endpoint:** `POST /api/v1/roles/:id/assign`

**Description:** Assigns a role to a specific user.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "userId": 5
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/roles/2/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "userId": 5
  }'
```

### Remove Role from User

**Endpoint:** `DELETE /api/v1/roles/:id/assign/:userId`

**Description:** Removes a role assignment from a user.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "https://your-app.onrender.com/api/v1/roles/2/assign/5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 📊 Role Analytics

### Get Role Statistics

**Endpoint:** `GET /api/v1/roles/statistics`

**Description:** Retrieves statistics about roles and their usage.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/roles/statistics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRoles": 4,
    "activeRoles": 3,
    "inactiveRoles": 1,
    "totalUsers": 15,
    "roleDistribution": [
      {
        "roleName": "Super Admin",
        "userCount": 1,
        "percentage": 6.67
      },
      {
        "roleName": "Admin",
        "userCount": 3,
        "percentage": 20.0
      }
    ],
    "mostUsedPermissions": [
      "read:users",
      "read:orders",
      "read:reports"
    ]
  }
}
```

## 🔍 Role Search and Filtering

### Search Roles

**Endpoint:** `GET /api/v1/roles/search`

**Description:** Advanced search for roles with multiple criteria.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (required): Search query
- `permissions` (optional): Filter by permissions
- `status` (optional): Filter by status
- `createdAfter` (optional): Filter by creation date
- `createdBefore` (optional): Filter by creation date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/roles/search?q=warehouse&permissions=read:orders&status=active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## ⚠️ Error Responses

### Common Error Responses

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions to manage roles",
  "statusCode": 403
}
```

**Role Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Role not found",
  "statusCode": 404
}
```

**Role in Use:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Cannot delete role. Users are currently assigned to it",
  "statusCode": 409
}
```

**Duplicate Role Name:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Role name already exists",
  "statusCode": 409
}
```

## 🔐 Security Considerations

1. **Admin Only**: All role management endpoints require admin privileges
2. **Permission Validation**: Changes to roles are logged and audited
3. **Cascade Protection**: Cannot delete roles that are currently assigned to users
4. **Default Role Protection**: System default roles cannot be deleted
5. **Permission Inheritance**: Role permissions are inherited by assigned users

## 📋 Best Practices

1. **Role Naming**: Use descriptive names that clearly indicate purpose
2. **Permission Granularity**: Assign specific permissions rather than broad access
3. **Regular Review**: Periodically review and update role permissions
4. **Documentation**: Maintain clear documentation of role purposes
5. **Testing**: Test role changes in development before production
6. **Backup**: Keep backups of role configurations before major changes

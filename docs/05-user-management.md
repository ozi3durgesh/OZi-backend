# User Management

This document covers all user management endpoints for the OZi Backend system.

## 👥 User Operations

### Get All Users

**Endpoint:** `GET /api/v1/users`

**Description:** Retrieves all users in the system (requires appropriate permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `search` (optional): Search term for user names or emails
- `role` (optional): Filter by role ID
- `status` (optional): Filter by status (active, inactive, pending_approval, suspended)
- `department` (optional): Filter by department
- `createdAfter` (optional): Filter by creation date
- `createdBefore` (optional): Filter by creation date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/users?page=1&limit=10&search=john&status=active&department=Operations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "john.doe@ozi.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "role": {
          "id": 2,
          "name": "Admin"
        },
        "department": "Operations",
        "employeeId": "EMP001",
        "status": "active",
        "lastLogin": "2024-01-15T09:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T09:00:00.000Z"
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

### Get User by ID

**Endpoint:** `GET /api/v1/users/:id`

**Description:** Retrieves a specific user by their ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@ozi.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": {
        "id": 2,
        "name": "Admin",
        "permissions": ["read:users", "write:users", "read:orders"]
      },
      "department": "Operations",
      "employeeId": "EMP001",
      "status": "active",
      "lastLogin": "2024-01-15T09:00:00.000Z",
      "loginHistory": [
        {
          "timestamp": "2024-01-15T09:00:00.000Z",
          "ipAddress": "192.168.1.100",
          "device": "Chrome on Windows"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    }
  }
}
```

### Create New User

**Endpoint:** `POST /api/v1/users`

**Description:** Creates a new user in the system (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "email": "jane.smith@ozi.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567891",
  "roleId": 3,
  "department": "Warehouse",
  "employeeId": "EMP002",
  "status": "active"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "email": "jane.smith@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567891",
    "roleId": 3,
    "department": "Warehouse",
    "employeeId": "EMP002",
    "status": "active"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "jane.smith@ozi.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": {
        "id": 3,
        "name": "Manager"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update User

**Endpoint:** `PUT /api/v1/users/:id`

**Description:** Updates an existing user (requires appropriate permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "department": "Senior Operations",
  "roleId": 2
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "department": "Senior Operations",
    "roleId": 2
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "department": "Senior Operations",
      "roleId": 2,
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Delete User

**Endpoint:** `DELETE /api/v1/users/:id`

**Description:** Deletes a user from the system (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "https://your-app.onrender.com/api/v1/users/2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Activate/Deactivate User

**Endpoint:** `PATCH /api/v1/users/:id/status`

**Description:** Changes the status of a user (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Violation of company policies"
}
```

**cURL Example:**
```bash
curl -X PATCH "https://your-app.onrender.com/api/v1/users/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "status": "suspended",
    "reason": "Violation of company policies"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "user": {
      "id": 1,
      "status": "suspended",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

## 🔐 User Authentication Management

### Reset User Password

**Endpoint:** `POST /api/v1/users/:id/reset-password`

**Description:** Resets a user's password (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123!",
  "forceChange": true
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/users/1/reset-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "newPassword": "NewSecurePassword123!",
    "forceChange": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": 1,
      "passwordChangedAt": "2024-01-15T12:00:00.000Z",
      "forcePasswordChange": true
    }
  }
}
```

### Unlock User Account

**Endpoint:** `POST /api/v1/users/:id/unlock`

**Description:** Unlocks a locked user account (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/users/1/unlock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "User account unlocked successfully",
  "data": {
    "user": {
      "id": 1,
      "status": "active",
      "loginAttempts": 0,
      "lockedUntil": null,
      "updatedAt": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

## 👥 User Role Management

### Assign Role to User

**Endpoint:** `POST /api/v1/users/:id/roles`

**Description:** Assigns a role to a user (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "roleId": 3
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/users/1/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "roleId": 3
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "data": {
    "user": {
      "id": 1,
      "role": {
        "id": 3,
        "name": "Manager"
      },
      "updatedAt": "2024-01-15T13:00:00.000Z"
    }
  }
}
```

### Remove Role from User

**Endpoint:** `DELETE /api/v1/users/:id/roles`

**Description:** Removes a role assignment from a user (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "https://your-app.onrender.com/api/v1/users/1/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "Role removed successfully",
  "data": {
    "user": {
      "id": 1,
      "role": null,
      "updatedAt": "2024-01-15T13:30:00.000Z"
    }
  }
}
```

## 📊 User Analytics

### Get User Statistics

**Endpoint:** `GET /api/v1/users/statistics`

**Description:** Retrieves statistics about users in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/users/statistics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 15,
    "activeUsers": 12,
    "inactiveUsers": 2,
    "pendingApproval": 1,
    "suspendedUsers": 0,
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
    "departmentDistribution": [
      {
        "department": "Operations",
        "userCount": 8,
        "percentage": 53.33
      },
      {
        "department": "Warehouse",
        "userCount": 4,
        "percentage": 26.67
      }
    ],
    "recentActivity": {
      "last24Hours": 5,
      "last7Days": 12,
      "last30Days": 15
    }
  }
}
```

### Get User Activity Report

**Endpoint:** `GET /api/v1/users/activity-report`

**Description:** Generates a detailed report of user activity.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `format` (optional): Report format (json, csv, pdf)
- `dateFrom` (optional): Start date for the report
- `dateTo` (optional): End date for the report
- `userId` (optional): Specific user ID for detailed report

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/users/activity-report?format=json&dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔍 User Search and Filtering

### Search Users

**Endpoint:** `GET /api/v1/users/search`

**Description:** Advanced search for users with multiple criteria.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (required): Search query
- `role` (optional): Filter by role
- `department` (optional): Filter by department
- `status` (optional): Filter by status
- `lastLoginAfter` (optional): Filter by last login date
- `lastLoginBefore` (optional): Filter by last login date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/users/search?q=john&role=admin&status=active&lastLoginAfter=2024-01-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Get Users by Department

**Endpoint:** `GET /api/v1/users/department/:departmentName`

**Description:** Retrieves all users in a specific department.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/users/department/Operations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔄 Bulk User Operations

### Bulk Create Users

**Endpoint:** `POST /api/v1/users/bulk`

**Description:** Creates multiple users at once (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "users": [
    {
      "email": "user1@ozi.com",
      "password": "SecurePassword123!",
      "firstName": "User",
      "lastName": "One",
      "roleId": 3,
      "department": "Warehouse"
    },
    {
      "email": "user2@ozi.com",
      "password": "SecurePassword123!",
      "firstName": "User",
      "lastName": "Two",
      "roleId": 4,
      "department": "Operations"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/users/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "users": [
      {
        "email": "user1@ozi.com",
        "password": "SecurePassword123!",
        "firstName": "User",
        "lastName": "One",
        "roleId": 3,
        "department": "Warehouse"
      },
      {
        "email": "user2@ozi.com",
        "password": "SecurePassword123!",
        "firstName": "User",
        "lastName": "Two",
        "roleId": 4,
        "department": "Operations"
      }
    ]
  }'
```

### Bulk Update Users

**Endpoint:** `PUT /api/v1/users/bulk`

**Description:** Updates multiple users at once (requires admin permissions).

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
      "department": "Senior Operations"
    },
    {
      "id": 2,
      "roleId": 3
    }
  ]
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/users/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "updates": [
      {
        "id": 1,
        "department": "Senior Operations"
      },
      {
        "id": 2,
        "roleId": 3
      }
    ]
  }'
```

## 📱 User Invitations

### Send User Invitation

**Endpoint:** `POST /api/v1/users/invite`

**Description:** Sends an invitation to a new user (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "email": "newuser@ozi.com",
  "firstName": "New",
  "lastName": "User",
  "roleId": 4,
  "department": "Operations",
  "invitationMessage": "Welcome to OZi Logistics! Please complete your registration."
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/users/invite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "email": "newuser@ozi.com",
    "firstName": "New",
    "lastName": "User",
    "roleId": 4,
    "department": "Operations",
    "invitationMessage": "Welcome to OZi Logistics! Please complete your registration."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "invitation": {
      "id": "inv_12345",
      "email": "newuser@ozi.com",
      "invitationCode": "INV123456",
      "expiresAt": "2024-02-15T10:30:00.000Z",
      "status": "sent"
    }
  }
}
```

### Resend User Invitation

**Endpoint:** `POST /api/v1/users/invite/:invitationId/resend`

**Description:** Resends an expired invitation (requires admin permissions).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/users/invite/inv_12345/resend" \
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
  "message": "Insufficient permissions to manage users",
  "statusCode": 403
}
```

**User Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found",
  "statusCode": 404
}
```

**Duplicate Email:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "User with this email already exists",
  "statusCode": 409
}
```

**Invalid Role:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid role ID provided",
  "statusCode": 400
}
```

**User Account Locked:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "User account is locked",
  "statusCode": 403
}
```

## 🔐 Security Considerations

1. **Permission-Based Access**: User management requires appropriate permissions
2. **Password Security**: Passwords are hashed and never stored in plain text
3. **Account Lockout**: Failed login attempts can lock accounts
4. **Audit Logging**: All user changes are logged for security tracking
5. **Role Validation**: Role assignments are validated against existing roles
6. **Status Management**: User status changes require proper authorization

## 📋 Best Practices

1. **Regular Review**: Periodically review user accounts and permissions
2. **Strong Passwords**: Enforce strong password policies
3. **Role Assignment**: Assign minimal required permissions to users
4. **Account Cleanup**: Remove inactive or terminated user accounts
5. **Invitation Management**: Use invitation system for new user onboarding
6. **Activity Monitoring**: Monitor user activity for security purposes
7. **Backup**: Keep backups of user configurations before major changes
8. **Documentation**: Maintain clear documentation of user roles and permissions

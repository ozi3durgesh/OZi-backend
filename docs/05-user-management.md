# User Management (Admin Only)

This document covers all user management endpoints for the OZi Backend system. These endpoints are restricted to users with admin privileges.

**Base URL:** `http://13.232.150.239`

## 👥 User Operations

### Get All Users

**Endpoint:** `GET /api/users`

**Description:** Retrieves all users in the system with optional filtering and pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `search` (optional): Search term for user names, emails, or employee IDs
- `status` (optional): Filter by status (active, inactive, pending_approval, locked)
- `department` (optional): Filter by department
- `role` (optional): Filter by role name

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/users?page=1&limit=10&search=john&status=active&department=Operations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/users?page=1&limit=10&search=john&status=active&department=Operations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
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
        "role": "Admin",
        "department": "Operations",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z"
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

### Get User by ID

**Endpoint:** `GET /api/users/:userId`

**Description:** Retrieves a specific user by their ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
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
      "role": "Admin",
      "department": "Operations",
      "employeeId": "EMP001",
      "status": "active",
      "lastLogin": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create New User

**Endpoint:** `POST /api/users`

**Description:** Creates a new user in the system (admin only).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "email": "newuser@ozi.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "roleId": 2,
  "department": "Operations",
  "employeeId": "EMP002"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "email": "newuser@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567890",
    "roleId": 2,
    "department": "Operations",
    "employeeId": "EMP002"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "email": "newuser@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567890",
    "roleId": 2,
    "department": "Operations",
    "employeeId": "EMP002"
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
      "email": "newuser@ozi.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "Manager",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update User

**Endpoint:** `PUT /api/users/:userId`

**Description:** Updates an existing user's information.

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
  "department": "Operations",
  "roleId": 1
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://13.232.150.239/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "department": "Operations",
    "roleId": 1
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://13.232.150.239/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "department": "Operations",
    "roleId": 1
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
      "department": "Operations",
      "roleId": 1,
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Delete User

**Endpoint:** `DELETE /api/users/:userId`

**Description:** Deactivates a user account (soft delete).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X DELETE "http://13.232.150.239/api/users/2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X DELETE "http://13.232.150.239/api/users/2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### Update User Status

**Endpoint:** `PUT /api/users/:userId/status`

**Description:** Updates a user's status (active, inactive, locked).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "status": "inactive",
  "reason": "Temporary suspension"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://13.232.150.239/api/users/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "status": "inactive",
    "reason": "Temporary suspension"
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://13.232.150.239/api/users/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "status": "inactive",
    "reason": "Temporary suspension"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "userId": 1,
    "status": "inactive",
    "reason": "Temporary suspension",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Change User Role

**Endpoint:** `PUT /api/users/:userId/role`

**Description:** Changes a user's role in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "roleId": 2,
  "reason": "Promotion to manager"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://13.232.150.239/api/users/1/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "roleId": 2,
    "reason": "Promotion to manager"
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://13.232.150.239/api/users/1/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "roleId": 2,
    "reason": "Promotion to manager"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User role changed successfully",
  "data": {
    "userId": 1,
    "oldRoleId": 1,
    "newRoleId": 2,
    "reason": "Promotion to manager",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 📊 User Statistics

### Get User Statistics

**Endpoint:** `GET /api/users/statistics`

**Description:** Retrieves user statistics and analytics.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/statistics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/statistics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "inactiveUsers": 20,
    "lockedUsers": 10,
    "usersByRole": {
      "Admin": 5,
      "Manager": 15,
      "Operator": 100,
      "Picker": 30
    },
    "usersByDepartment": {
      "Operations": 80,
      "Management": 20,
      "Warehouse": 50
    }
  }
}
```

## 🔍 User Search & Reports

### Search Users

**Endpoint:** `GET /api/users/search`

**Description:** Advanced user search with multiple filters.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (optional): Search query
- `role` (optional): Filter by role
- `status` (optional): Filter by status
- `department` (optional): Filter by department
- `lastLoginAfter` (optional): Filter by last login date

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/search?q=john&role=admin&status=active&lastLoginAfter=2024-01-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/search?q=john&role=admin&status=active&lastLoginAfter=2024-01-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
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
        "role": "Admin",
        "status": "active",
        "lastLogin": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### Get Users by Department

**Endpoint:** `GET /api/users/department/:department`

**Description:** Retrieves all users in a specific department.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/department/Operations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/users/department/Operations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "department": "Operations",
    "users": [
      {
        "id": 1,
        "email": "john.doe@ozi.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "Manager",
        "status": "active"
      }
    ],
    "total": 1
  }
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
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid access token",
  "statusCode": 401
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource",
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

**App Version Too Old (Mobile Only):**
```json
{
  "success": false,
  "error": "Upgrade Required",
  "message": "Please update your app to version 1.0.0 or higher",
  "statusCode": 426
}
```

## 🔐 Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Permission-Based Access**: Role-based access control (RBAC)
3. **Version Control**: Mobile app compatibility checking
4. **Audit Logging**: Track all user management actions
5. **Input Validation**: Comprehensive request validation

## 📋 User Management Flow

### Web Client Flow
1. Admin authenticates with valid JWT token
2. Admin performs user management operations
3. System validates permissions and processes request
4. Response is returned with operation result

### Mobile Client Flow
1. App sends request with version headers
2. System validates app version compatibility
3. Admin authenticates with valid JWT token
4. Admin performs user management operations
5. System validates permissions and processes request
6. Response is returned with operation result
7. Version checking on every request

---

This document covers all user management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints require admin authentication and appropriate permissions.

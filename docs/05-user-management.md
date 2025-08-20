# User Management (Admin Only)

This document covers all user management endpoints for the OZi Backend system. These endpoints are restricted to users with admin privileges.

**Base URL:** `http://localhost:3000`

## 👥 User Operations

### Create User

**Endpoint:** `POST /api/users`

**Description:** Creates a new user (requires admin authentication and users_roles:manage permission).

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
  "roleId": 2,
  "roleName": "wh_staff_1"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "email": "newuser@ozi.com",
    "password": "SecurePassword123!",
    "roleId": 2
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "email": "newuser@ozi.com",
    "password": "SecurePassword123!",
    "roleId": 2
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "email": "newuser@ozi.com",
    "roleId": 2,
    "role": "wh_staff_1",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### List All Users

**Endpoint:** `GET /api/users`

**Description:** Retrieves all users with pagination and filtering (requires admin authentication and users_roles:manage permission).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role name

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&role=wh_staff_1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&role=wh_staff_1" \
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
        "email": "admin@ozi.com",
        "roleId": 1,
        "isActive": true,
        "availabilityStatus": "available",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "Role": {
          "id": 1,
          "name": "admin",
          "description": "Full system access"
        }
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

### Update User Status

**Endpoint:** `PUT /api/users/:userId/status`

**Description:** Updates the availability status of a user (users can only update their own status).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "availabilityStatus": "break"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://localhost:3000/api/users/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "availabilityStatus": "break"
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://localhost:3000/api/users/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "availabilityStatus": "break"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "availabilityStatus": "break"
  }
}
```

### Change User Role

**Endpoint:** `PUT /api/users/:userId/role`

**Description:** Changes the role of a user (requires admin authentication and users_roles:manage permission).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "roleId": 3,
  "roleName": "supervisor"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://localhost:3000/api/users/2/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "roleId": 3
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://localhost:3000/api/users/2/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "roleId": 3
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "user@ozi.com",
    "roleId": 3,
    "role": "supervisor",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Deactivate User

**Endpoint:** `DELETE /api/users/:userId`

**Description:** Deactivates a user account (requires admin authentication and users_roles:manage permission).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X DELETE "http://localhost:3000/api/users/3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X DELETE "http://localhost:3000/api/users/3" \
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
    "id": 3,
    "email": "user@ozi.com",
    "isActive": false,
    "message": "User deactivated successfully"
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

### Device Management
- Mobile apps should provide unique device identifiers
- Platform detection (ios/android) for analytics
- Secure token storage using platform-specific methods

## ⚠️ Error Responses

### Common Error Responses

**Unauthorized Access:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid token",
  "statusCode": 401
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "Insufficient permissions",
  "statusCode": 403
}
```

**User Not Found:**
```json
{
  "success": false,
  "error": "User not found",
  "message": "User not found",
  "statusCode": 404
}
```

**Invalid Role:**
```json
{
  "success": false,
  "error": "Invalid role name",
  "message": "Invalid role name",
  "statusCode": 400
}
```

**Cannot Deactivate Last Admin:**
```json
{
  "success": false,
  "error": "Cannot deactivate the last admin user",
  "message": "Cannot deactivate the last admin user",
  "statusCode": 403
}
```

**Cannot Deactivate Self:**
```json
{
  "success": false,
  "error": "Cannot deactivate your own account",
  "message": "Cannot deactivate your own account",
  "statusCode": 403
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
2. **Role-Based Access Control**: Users must have specific permissions
3. **Permission Validation**: `users_roles:manage` permission required for most operations
4. **Self-Protection**: Users cannot deactivate their own accounts
5. **Admin Protection**: Last admin user cannot be deactivated
6. **Version Control**: Mobile app compatibility checking
7. **Audit Logging**: Track all user management operations

## 📋 Operation Flow

### User Creation Flow
1. Admin provides user details (email, password, role)
2. System validates input data
3. System checks for existing users with same email
4. System validates role exists
5. Password is hashed and stored
6. User account is created
7. Success response with user details

### User Role Change Flow
1. Admin provides new role information
2. System validates role exists
3. System prevents changing to admin role through this endpoint
4. System prevents changing last admin user
5. User role is updated
6. Success response with updated user details

### User Deactivation Flow
1. Admin requests user deactivation
2. System validates user exists
3. System prevents self-deactivation
4. System prevents deactivating last admin
5. User account is deactivated
6. Success response with confirmation

---

This document covers all user management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.

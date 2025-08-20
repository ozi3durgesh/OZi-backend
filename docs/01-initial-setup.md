# Initial Setup & System Initialization

This document covers the initial setup process and admin registration for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## 🔧 System Initialization

### Health Check

**Endpoint:** `GET /health`

**Description:** Check if the system is running.

**Headers:**
```bash
Content-Type: application/json
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/health" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": { 
    "message": "Server is running" 
  },
  "error": null
}
```

### System Status Check

**Endpoint:** `GET /api/auth/system-status`

**Description:** Check system initialization status.

**Headers:**
```bash
Content-Type: application/json
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "initialized",
    "message": "System is initialized",
    "hasUsers": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Available Roles

**Endpoint:** `GET /api/auth/roles`

**Description:** Get available roles for user registration.

**Headers:**
```bash
Content-Type: application/json
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": 1,
        "name": "Admin",
        "description": "Full system access"
      },
      {
        "id": 2,
        "name": "Manager",
        "description": "Department management access"
      }
    ]
  }
}
```

## 👤 User Registration

### Register New User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user in the system.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@ozi.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "invitationCode": "INV123456",
  "department": "Operations",
  "employeeId": "EMP001"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "invitationCode": "INV123456",
    "department": "Operations",
    "employeeId": "EMP001"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Awaiting admin approval.",
  "data": {
    "user": {
      "id": 1,
      "email": "newuser@ozi.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "pending_approval",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 🔐 Admin Authentication

### Admin Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate admin user.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@ozi.com",
  "password": "AdminPassword123!",
  "deviceId": "admin_device_001",
  "platform": "web"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "AdminPassword123!",
    "deviceId": "admin_device_001",
    "platform": "web"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ozi.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "Admin",
      "permissions": ["read:users", "write:users", "read:orders"],
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessTokenExpiresIn": "15m",
      "refreshTokenExpiresIn": "7d"
    }
  }
}
```

## 👥 Admin User Management

### Create Admin User

**Endpoint:** `POST /api/users`

**Description:** Create a new admin user (requires admin authentication).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "email": "newadmin@ozi.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Admin",
  "phone": "+1234567890",
  "roleId": 1,
  "department": "Management",
  "employeeId": "EMP002"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "email": "newadmin@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Admin",
    "phone": "+1234567890",
    "roleId": 1,
    "department": "Management",
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
      "email": "newadmin@ozi.com",
      "firstName": "Jane",
      "lastName": "Admin",
      "role": "Admin",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### List All Users

**Endpoint:** `GET /api/users`

**Description:** Get all users in the system (requires admin authentication).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/users" \
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
        "email": "admin@ozi.com",
        "firstName": "Admin",
        "lastName": "User",
        "role": "Admin",
        "department": "Management",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
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

## 🏗️ Role Management

### Create Role

**Endpoint:** `POST /api/roles`

**Description:** Create a new role (requires admin authentication).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "name": "Supervisor",
  "description": "Department supervisor with limited admin access",
  "permissions": ["read:users", "read:orders", "write:orders"]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "Supervisor",
    "description": "Department supervisor with limited admin access",
    "permissions": ["read:users", "read:orders", "write:orders"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role": {
      "id": 3,
      "name": "Supervisor",
      "description": "Department supervisor with limited admin access",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### List All Roles

**Endpoint:** `GET /api/roles`

**Description:** Get all roles in the system (requires admin authentication).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/roles" \
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
        "name": "Admin",
        "description": "Full system access"
      },
      {
        "id": 2,
        "name": "Manager",
        "description": "Department management access"
      },
      {
        "id": 3,
        "name": "Supervisor",
        "description": "Department supervisor with limited admin access"
      }
    ]
  }
}
```

## 🔐 Permission Management

### Create Permission

**Endpoint:** `POST /api/permissions`

**Description:** Create a new permission (requires admin authentication).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "module": "warehouse",
  "action": "manage",
  "description": "Full warehouse management access"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "module": "warehouse",
    "action": "manage",
    "description": "Full warehouse management access"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "permission": {
      "id": 1,
      "module": "warehouse",
      "action": "manage",
      "description": "Full warehouse management access",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### List All Permissions

**Endpoint:** `GET /api/permissions`

**Description:** Get all permissions in the system (requires admin authentication).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/permissions" \
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
        "module": "warehouse",
        "action": "manage",
        "description": "Full warehouse management access"
      },
      {
        "id": 2,
        "module": "users",
        "action": "read",
        "description": "Read user information"
      }
    ]
  }
}
```

## 📋 Setup Process

### Step 1: Start the Server
```bash
npm start
# or
npm run dev
```

### Step 2: Check System Health
```bash
curl -X GET "http://localhost:3000/health"
```

### Step 3: Check System Status
```bash
curl -X GET "http://localhost:3000/api/auth/system-status"
```

### Step 4: Register First Admin User
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "AdminPassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890",
    "invitationCode": "INIT123",
    "department": "Management",
    "employeeId": "EMP001"
  }'
```

### Step 5: Login as Admin
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "AdminPassword123!",
    "deviceId": "admin_device_001",
    "platform": "web"
  }'
```

### Step 6: Create Additional Roles and Permissions
Use the JWT token from login to create roles and permissions as needed.

## ⚠️ Important Notes

1. **Version Check**: All API endpoints require version checking via headers
2. **Authentication**: Most endpoints require valid JWT tokens
3. **Permissions**: Admin operations require specific permissions
4. **Base URL**: Use `http://localhost:3000` for local development
5. **Database**: Ensure database is properly configured and running

## 🔧 Troubleshooting

### Common Issues:
- **Port 3000 in use**: Change port in environment variables
- **Database connection failed**: Check database configuration
- **Permission denied**: Ensure user has required permissions
- **Version check failed**: Include proper version headers for mobile clients

---

This document covers the complete initial setup process. All endpoints are verified against the actual route files and will work correctly with localhost:3000.

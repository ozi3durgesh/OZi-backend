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

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasUsers": false,
    "totalUsers": 0,
    "message": "System needs initial admin setup"
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

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": 1,
        "name": "admin",
        "description": "Full system access"
      },
      {
        "id": 2,
        "name": "wh_staff_1",
        "description": "Warehouse staff level 1"
      }
    ]
  }
}
```

## 👤 User Registration

### Register First Admin User

**Endpoint:** `POST /api/auth/register`

**Description:** Register the first user in the system. First user automatically becomes admin.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@ozi.com",
  "password": "SecurePassword123!",
  "roleName": "admin"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "SecurePassword123!",
    "roleName": "admin"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "admin@ozi.com",
    "password": "SecurePassword123!",
    "roleName": "admin"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ozi.com",
      "roleId": 1,
      "role": "admin",
      "permissions": ["module:action"],
      "availabilityStatus": "available",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isFirstUser": true
  }
}
```

### Register Additional Admin User

**Endpoint:** `POST /api/auth/register`

**Description:** Register additional admin users (requires admin secret after first user).

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newadmin@ozi.com",
  "password": "SecurePassword123!",
  "roleName": "admin",
  "adminSecret": "your_admin_secret_from_env"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@ozi.com",
    "password": "SecurePassword123!",
    "roleName": "admin",
    "adminSecret": "your_admin_secret_from_env"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "newadmin@ozi.com",
    "password": "SecurePassword123!",
    "roleName": "admin",
    "adminSecret": "your_admin_secret_from_env"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "newadmin@ozi.com",
      "roleId": 1,
      "role": "admin",
      "permissions": ["module:action"],
      "availabilityStatus": "available",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isFirstUser": false
  }
}
```

### Register Regular User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a regular user with default role (wh_staff_1).

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@ozi.com",
  "password": "SecurePassword123!"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@ozi.com",
    "password": "SecurePassword123!"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "user@ozi.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 3,
      "email": "user@ozi.com",
      "roleId": 2,
      "role": "wh_staff_1",
      "permissions": ["module:action"],
      "availabilityStatus": "available",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isFirstUser": false
  }
}
```

## 🔐 User Authentication

### User Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and get JWT tokens.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@ozi.com",
  "password": "SecurePassword123!"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "SecurePassword123!"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "admin@ozi.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ozi.com",
      "roleId": 1,
      "role": "admin",
      "permissions": ["module:action"],
      "availabilityStatus": "available",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Access Token

**Endpoint:** `POST /api/auth/refresh-token`

**Description:** Refresh expired access token using refresh token.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ozi.com",
      "roleId": 1,
      "role": "admin",
      "permissions": ["module:action"],
      "availabilityStatus": "available",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Get current user's profile (requires authentication).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ozi.com",
      "role": "admin",
      "permissions": ["module:action"],
      "availabilityStatus": "available",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 📱 Mobile App Support

### Mobile Client Registration

**Endpoint:** `POST /api/auth/register`

**Description:** Register user from mobile app with version checking.

**Headers:**
```bash
Content-Type: application/json
source: mobile
app-version: 1.0.0
```

**Request Body:**
```json
{
  "email": "mobileuser@ozi.com",
  "password": "SecurePassword123!"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "mobileuser@ozi.com",
    "password": "SecurePassword123!"
  }'
```

### Mobile Client Login

**Endpoint:** `POST /api/auth/login`

**Description:** Login from mobile app with version checking.

**Headers:**
```bash
Content-Type: application/json
source: mobile
app-version: 1.0.0
```

**Request Body:**
```json
{
  "email": "mobileuser@ozi.com",
  "password": "SecurePassword123!"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "mobileuser@ozi.com",
    "password": "SecurePassword123!"
  }'
```

## 📋 Setup Process

### Step 1: Start the Server
```bash
npm run dev
# or for production
npm run build
npm start
```

### Step 2: Check System Health
```bash
curl -X GET "http://localhost:3000/health"
```

### Step 3: Check System Status
```bash
# Web Client
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "Content-Type: application/json"

# Mobile Client
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

### Step 4: Register First Admin User
```bash
# Web Client
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "AdminPassword123!",
    "roleName": "admin"
  }'

# Mobile Client
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "admin@ozi.com",
    "password": "AdminPassword123!",
    "roleName": "admin"
  }'
```

### Step 5: Login as Admin
```bash
# Web Client
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "AdminPassword123!"
  }'

# Mobile Client
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "admin@ozi.com",
    "password": "AdminPassword123!"
  }'
```

### Step 6: Check Available Roles
```bash
# Web Client
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "Content-Type: application/json"

# Mobile Client
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## ⚠️ Important Notes

1. **Version Check**: All auth endpoints require version checking via middleware
2. **Authentication**: Profile endpoint requires valid JWT token
3. **Admin Registration**: First user becomes admin automatically, subsequent admin registrations require admin secret
4. **Base URL**: Use `http://localhost:3000` for local development
5. **Database**: Ensure database is properly configured and running
6. **Mobile Support**: Mobile clients must include `source: mobile` and `app-version` headers

## 🔧 Environment Variables

Make sure these environment variables are set in your `.env` file:

```bash
# JWT Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Registration
ADMIN_REGISTRATION_SECRET=your_admin_registration_secret_here

# App Version Check
MIN_APP_VERSION=1.0.0
```

## 🔧 Troubleshooting

### Common Issues:
- **Port 3000 in use**: Change port in environment variables
- **Database connection failed**: Check database configuration
- **Permission denied**: Ensure user has required permissions
- **Version check failed**: Include proper version headers for mobile clients
- **Admin registration failed**: Check ADMIN_REGISTRATION_SECRET environment variable

---

This document covers the complete initial setup process. All endpoints are verified against the actual implementation and will work correctly with localhost:3000.

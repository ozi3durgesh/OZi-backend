# Authentication & Authorization

This document covers all authentication and authorization endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## 🔐 User Authentication

### User Registration

**Endpoint:** `POST /api/auth/register`

**Description:** Registers a new user. First user automatically becomes admin. Subsequent admin registrations require admin secret.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "SecurePassword123",
  "roleName": "admin",
  "adminSecret": "your_admin_secret_here"
}
```

**Field Descriptions:**
- `email` (required): User's email address
- `password` (required): User's password (must meet validation requirements)
- `roleName` (optional): Role name for the user (e.g., "admin", "wh_staff_1")
- `adminSecret` (optional): Required only for admin registration after first user

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123",
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
    "email": "admin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin"
  }'
```

**Admin Registration (after first user):**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "newadmin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin",
    "adminSecret": "your_actual_admin_secret_from_env"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@company.com",
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

### User Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user and returns JWT tokens.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "SecurePassword123"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePassword123"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@company.com",
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

**Description:** Refreshes an expired access token using a valid refresh token.

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
      "email": "user@company.com",
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

**Description:** Retrieves the current user's profile information. Requires authentication.

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
      "email": "user@company.com",
      "role": "admin",
      "permissions": ["module:action"],
      "availabilityStatus": "available",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Available Roles

**Endpoint:** `GET /api/auth/roles`

**Description:** Retrieves available roles for user registration.

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

### Check System Status

**Endpoint:** `GET /api/auth/system-status`

**Description:** Checks system status without authentication. Useful for checking if system needs initial admin setup.

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
    "hasUsers": true,
    "totalUsers": 5,
    "message": "System is initialized"
  }
}
```

### Test Auth Route

**Endpoint:** `GET /api/auth/test`

**Description:** Test endpoint to verify auth routes are working.

**Headers:**
```bash
Content-Type: application/json
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/test" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/test" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

**Response:**
```json
{
  "message": "Auth route test endpoint working"
}
```

## 📱 Mobile App Considerations

### Version Check Headers
For mobile clients, the following headers are required:
- `source: mobile` - Identifies the request as coming from a mobile app
- `app-version: 1.0.0` - Current app version for compatibility checking

### Version Compatibility
- Minimum supported version: 1.0.0 (configurable via MIN_APP_VERSION env var)
- If app version is below minimum, API returns 426 status code
- Web clients don't require version checking

### Version Check Behavior
- Mobile requests without `source: mobile` header work normally
- Mobile requests with `source: mobile` but missing `app-version` return 400 error
- Mobile requests with outdated app version return 426 error

## ⚠️ Error Responses

### Common Error Responses

**Invalid Credentials:**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Invalid credentials",
  "statusCode": 401
}
```

**User Already Exists:**
```json
{
  "success": false,
  "error": "User already exists",
  "message": "User already exists",
  "statusCode": 409
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

**Admin Registration Failed:**
```json
{
  "success": false,
  "error": "Invalid admin registration secret",
  "message": "Invalid admin registration secret",
  "statusCode": 403
}
```

**Missing App Version (Mobile Only):**
```json
{
  "success": false,
  "error": "App version is required for mobile users",
  "message": "App version is required for mobile users",
  "statusCode": 400
}
```

**App Version Too Old (Mobile Only):**
```json
{
  "success": false,
  "error": "Please update your app to version 1.0.0 or higher",
  "message": "Please update your app to version 1.0.0 or higher",
  "statusCode": 426
}
```

## 🔐 Security Features

1. **JWT Tokens**: Secure token-based authentication
2. **Refresh Tokens**: Automatic token renewal
3. **Version Control**: Mobile app compatibility checking
4. **Rate Limiting**: Protection against brute force attacks
5. **Password Policies**: Enforced strong password requirements
6. **Admin Secret Protection**: Admin registration requires secret after first user
7. **Role-Based Access Control**: Users are assigned specific roles with permissions

## 📋 Authentication Flow

### First User Registration (Admin)
1. System checks if no users exist
2. First user automatically becomes admin
3. No admin secret required
4. JWT tokens issued immediately

### Subsequent Admin Registration
1. System checks if users already exist
2. Admin secret required from environment variable
3. Secret must match ADMIN_REGISTRATION_SECRET
4. JWT tokens issued upon successful validation

### Regular User Registration
1. User provides email and password
2. Role can be specified or defaults to wh_staff_1
3. JWT tokens issued immediately

### Web Client Flow
1. User provides credentials
2. System validates credentials
3. JWT access token is issued
4. Token is used for subsequent API calls
5. No version checking required

### Mobile Client Flow
1. App sends request with version headers
2. System validates app version compatibility
3. User provides credentials
4. System validates credentials
5. JWT access token is issued
6. Token is used for subsequent API calls
7. Version checking on every request

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

## 📋 Complete Authentication Workflow

### Step 1: Check System Status
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

### Step 2: Register First Admin User
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

### Step 3: Login as Admin
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

### Step 4: Get User Profile (with token)
```bash
# Web Client
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Mobile Client
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

### Step 5: Refresh Token (if needed)
```bash
# Web Client
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'

# Mobile Client
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

---

This document covers all **actually implemented** authentication endpoints with correct examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual route files and will work correctly with localhost:3000.

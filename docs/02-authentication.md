# Authentication & Authorization

This module handles user authentication, JWT token management, and profile access.

## User Login

### Login User
Authenticate a user and receive JWT tokens.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```bash
X-App-Version: 1.0.0
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword123"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "userpassword123"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9...",
      "expiresIn": 900
    }
  },
  "error": null
}
```

## Token Refresh

### Refresh Access Token
Get a new access token using a valid refresh token.

**Endpoint:** `POST /api/auth/refresh-token`

**Headers:**
```bash
X-App-Version: 1.0.0
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..."
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..."
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9...",
    "expiresIn": 900
  },
  "error": null
}
```

## User Profile

### Get User Profile
Retrieve the authenticated user's profile information.

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "admin",
    "status": "active",
    "permissions": [
      "users_roles:manage",
      "orders:view_all",
      "picking:assign_manage",
      "packing:execute",
      "warehouse:manage"
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T12:00:00.000Z"
  },
  "error": null
}
```

## User Roles

### Get Available Roles
Get a list of all available roles in the system.

**Endpoint:** `GET /api/auth/roles`

**Headers:**
```bash
X-App-Version: 1.0.0
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json"
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
      "displayName": "Administrator",
      "description": "Full system access",
      "permissions": [
        "users_roles:manage",
        "orders:view_all",
        "picking:assign_manage",
        "packing:execute",
        "warehouse:manage"
      ]
    },
    {
      "id": 2,
      "name": "manager",
      "displayName": "Manager",
      "description": "Department management access",
      "permissions": [
        "orders:view_all",
        "picking:view",
        "packing:execute",
        "warehouse:view"
      ]
    },
    {
      "id": 3,
      "name": "picker",
      "displayName": "Picker",
      "description": "Picking operations access",
      "permissions": [
        "picking:execute"
      ]
    },
    {
      "id": 4,
      "name": "packer",
      "displayName": "Packer",
      "description": "Packing operations access",
      "permissions": [
        "packing:execute"
      ]
    }
  ],
  "error": null
}
```

## Authentication Flow

### 1. Initial Login
```bash
# Step 1: Login with credentials
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "userpassword123"
  }'
```

### 2. Store Tokens
```bash
# Extract and store tokens from response
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..."
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..."
```

### 3. Use Access Token
```bash
# Include in subsequent requests
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4. Refresh When Expired
```bash
# When access token expires, use refresh token
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }"
```

## JWT Token Details

### Access Token
- **Expiration**: 15 minutes (configurable)
- **Purpose**: API authentication
- **Storage**: Memory (not persistent)
- **Refresh**: Use refresh token when expired

### Refresh Token
- **Expiration**: 7 days (configurable)
- **Purpose**: Get new access tokens
- **Storage**: Secure HTTP-only cookie or secure storage
- **Refresh**: Login again when expired

## Security Headers

All authenticated requests should include:

```bash
X-App-Version: 1.0.0
Authorization: Bearer <access-token>
Content-Type: application/json
```

## Error Responses

### Invalid Credentials
```json
{
  "statusCode": 401,
  "success": false,
  "data": null,
  "error": "Invalid email or password"
}
```

### Token Expired
```json
{
  "statusCode": 401,
  "success": false,
  "data": null,
  "error": "Access token expired"
}
```

### Invalid Token
```json
{
  "statusCode": 401,
  "success": false,
  "data": null,
  "error": "Invalid token"
}
```

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions"
}
```

### Version Mismatch
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "App version not supported. Please update your app."
}
```

## Mobile App Considerations

### Token Storage
- Store access token in memory
- Store refresh token in secure storage (Keychain/iOS, Keystore/Android)
- Never store tokens in plain text

### Auto-refresh
- Implement automatic token refresh before expiration
- Handle refresh failures gracefully
- Redirect to login on refresh failure

### Offline Handling
- Cache user profile data
- Queue API requests when offline
- Sync when connection restored

## Web App Considerations

### Token Storage
- Store access token in memory (not localStorage)
- Store refresh token in HTTP-only cookie
- Implement automatic logout on inactivity

### Security
- Use HTTPS in production
- Implement CSRF protection
- Validate app version on each request

# Initial Setup & Admin Registration

This module handles the initial system setup and creation of the first admin user.

## System Status Check

### Check System Status
Check if the system is ready for initial setup.

**Endpoint:** `GET /api/auth/system-status`

**Headers:**
```bash
X-App-Version: 1.0.0
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "systemReady": true,
    "adminExists": false,
    "databaseConnected": true,
    "message": "System is ready for initial setup"
  },
  "error": null
}
```

## Admin Registration

### Register Initial Admin
Create the first admin user in the system. This endpoint is only available when no admin exists.

**Endpoint:** `POST /api/auth/register`

**Headers:**
```bash
X-App-Version: 1.0.0
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@yourcompany.com",
  "password": "SecureAdminPassword123",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+1234567890",
  "adminRegistrationSecret": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecureAdminPassword123",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890",
    "adminRegistrationSecret": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@yourcompany.com",
      "firstName": "Admin",
      "lastName": "User",
      "phone": "+1234567890",
      "role": "admin",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "message": "Admin user created successfully"
  },
  "error": null
}
```

## Test Endpoint

### Test Auth Route
Test if the auth routes are working correctly.

**Endpoint:** `GET /api/auth/test`

**Headers:**
```bash
X-App-Version: 1.0.0
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/auth/test" \
  -H "X-App-Version: 1.0.0" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Auth route test endpoint working"
}
```

## Environment Variables Required

Make sure these environment variables are set before running the initial setup:

```bash
# Admin Registration
ADMIN_REGISTRATION_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

# Database Configuration
DB_HOST=your-database-host
DB_NAME=your-database-name
DB_PASSWORD=your-database-password
DB_PORT=3306
DB_USER=your-database-user

# Initial Admin Credentials
INITIAL_ADMIN_EMAIL=admin@yourcompany.com
INITIAL_ADMIN_PASSWORD=SecureAdminPassword123

# JWT Configuration
JWT_ACCESS_SECRET=your-jwt-access-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App Configuration
MIN_APP_VERSION=1.0.0
PORT=3000
```

## Setup Flow

1. **Check System Status**: Verify the system is ready
2. **Register Admin**: Create the first admin user
3. **Login**: Use the admin credentials to get JWT tokens
4. **Configure Roles & Permissions**: Set up the RBAC system
5. **Create Additional Users**: Add more users to the system

## Security Notes

- The `adminRegistrationSecret` is required for initial admin creation
- This endpoint is only available when no admin exists
- Use strong passwords for admin accounts
- Store secrets securely in environment variables
- The admin user automatically gets full system permissions

## Error Responses

### Admin Already Exists
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Admin user already exists"
}
```

### Invalid Secret
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid admin registration secret"
}
```

### System Not Ready
```json
{
  "statusCode": 503,
  "success": false,
  "data": null,
  "error": "System is not ready for setup"
}
```

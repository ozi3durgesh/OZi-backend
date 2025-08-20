# Authentication & Authorization

This document covers all authentication and authorization endpoints for the OZi Backend system.

**Base URL:** `http://13.232.150.239`

## 🔐 User Authentication

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
  "email": "user@ozi.com",
  "password": "SecurePassword123!",
  "deviceId": "device_12345",
  "platform": "web"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@ozi.com",
    "password": "SecurePassword123!",
    "deviceId": "device_12345",
    "platform": "web"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "email": "user@ozi.com",
    "password": "SecurePassword123!",
    "deviceId": "mobile_device_12345",
    "platform": "ios"
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
      "email": "user@ozi.com",
      "firstName": "John",
      "lastName": "Doe",
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

### User Registration

**Endpoint:** `POST /api/auth/register`

**Description:** Registers a new user (requires invitation or admin approval).

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@ozi.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "invitationCode": "INV123456",
  "department": "Operations",
  "employeeId": "EMP002"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567890",
    "invitationCode": "INV123456",
    "department": "Operations",
    "employeeId": "EMP002"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "email": "newuser@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567890",
    "invitationCode": "INV123456",
    "department": "Operations",
    "employeeId": "EMP002"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Awaiting admin approval.",
  "data": {
    "user": {
      "id": 3,
      "email": "newuser@ozi.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "status": "pending_approval",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
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
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deviceId": "device_12345"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "deviceId": "device_12345"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "deviceId": "mobile_device_12345"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresIn": "15m"
  }
}
```

### User Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Logs out a user and invalidates their tokens.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "deviceId": "device_12345",
  "logoutAllDevices": false
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "deviceId": "device_12345",
    "logoutAllDevices": false
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Logout All Devices

**Endpoint:** `POST /api/v1/auth/logout-all`

**Description:** Logs out a user from all devices.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/auth/logout-all" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔑 Password Management

### Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Sends a password reset link to the user's email.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@ozi.com"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@ozi.com"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "email": "user@ozi.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Resets password using a reset token.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "resetToken": "reset_token_12345",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "reset_token_12345",
    "newPassword": "NewSecurePassword123!",
    "confirmPassword": "NewSecurePassword123!"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "resetToken": "reset_token_12345",
    "newPassword": "NewSecurePassword123!",
    "confirmPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Change Password

**Endpoint:** `POST /api/v1/auth/change-password`

**Description:** Changes password for authenticated user.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewSecurePassword123!",
    "confirmPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## 👤 Profile Management

### Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Retrieves the current user's profile information.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/auth/profile" \
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
      "email": "user@ozi.com",
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

### Update User Profile

**Endpoint:** `PUT /api/auth/profile`

**Description:** Updates the current user's profile information.

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
  "department": "Operations"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://13.232.150.239/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "department": "Operations"
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://13.232.150.239/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "department": "Operations"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "department": "Operations",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get System Status

**Endpoint:** `GET /api/auth/system-status`

**Description:** Checks system status without authentication.

**Headers:**
```bash
Content-Type: application/json
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/auth/system-status" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/auth/system-status" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "database": "connected"
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
curl -X GET "http://13.232.150.239/api/auth/roles" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/auth/roles" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
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

## 🔒 Two-Factor Authentication

### Enable 2FA

**Endpoint:** `POST /api/auth/2fa/enable`

**Description:** Enables two-factor authentication for the user.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/2fa/enable" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/2fa/enable" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": ["123456", "234567", "345678"]
  }
}
```

### Verify 2FA

**Endpoint:** `POST /api/auth/2fa/verify`

**Description:** Verifies 2FA code during login.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@ozi.com",
  "password": "SecurePassword123!",
  "totpCode": "123456",
  "deviceId": "device_12345"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/2fa/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@ozi.com",
    "password": "SecurePassword123!",
    "totpCode": "123456",
    "deviceId": "device_12345"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/auth/2fa/verify" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "email": "user@ozi.com",
    "password": "SecurePassword123!",
    "totpCode": "123456",
    "deviceId": "mobile_device_12345"
  }'
```

## 📱 Device Management

### Get Active Devices

**Endpoint:** `GET /api/v1/auth/devices`

**Description:** Retrieves all active devices for the current user.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/auth/devices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": 1,
        "deviceId": "device_12345",
        "platform": "web",
        "browser": "Chrome",
        "lastActive": "2024-01-15T10:30:00.000Z",
        "ipAddress": "192.168.1.100"
      }
    ]
  }
}
```

### Revoke Device

**Endpoint:** `DELETE /api/v1/auth/devices/:deviceId`

**Description:** Revokes access for a specific device.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "http://13.232.150.239/api/v1/auth/devices/device_12345" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "Device revoked successfully"
}
```

## 🔍 Session Validation

### Validate Token

**Endpoint:** `POST /api/v1/auth/validate`

**Description:** Validates a JWT token and returns user information.

**Headers:**
```bash
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/auth/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": 1,
      "email": "user@ozi.com",
      "role": "Admin",
      "permissions": ["read:users", "write:users"]
    }
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

**Invalid Credentials:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "statusCode": 401
}
```

**Token Expired:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Access token expired",
  "statusCode": 401
}
```

**Invalid Token:**
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
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource",
  "statusCode": 403
}
```

**Account Locked:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Account is locked. Contact administrator",
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

1. **JWT Tokens**: Secure token-based authentication
2. **Refresh Tokens**: Automatic token renewal
3. **Version Control**: Mobile app compatibility checking
4. **Rate Limiting**: Protection against brute force attacks
5. **Password Policies**: Enforced strong password requirements
6. **Session Management**: Secure session handling
7. **Audit Logging**: Track authentication events

## 📋 Authentication Flow

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

---

This document covers all authentication endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking.

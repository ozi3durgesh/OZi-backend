# Initial Setup & Admin Registration

This document covers the initial setup process and admin registration for the OZi Backend system.

## 🔧 System Initialization

### Initialize RBAC System

**Endpoint:** `POST /api/v1/system/init-rbac`

**Description:** Initializes the Role-Based Access Control system with default roles and permissions.

**Headers:**
```bash
Content-Type: application/json
X-Admin-Secret: your_admin_registration_secret
```

**Request Body:**
```json
{
  "adminEmail": "admin@ozi.com",
  "adminPassword": "SecurePassword123!",
  "adminFirstName": "System",
  "adminLastName": "Administrator",
  "companyName": "OZi Logistics"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/system/init-rbac" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_registration_secret" \
  -d '{
    "adminEmail": "admin@ozi.com",
    "adminPassword": "SecurePassword123!",
    "adminFirstName": "System",
    "adminLastName": "Administrator",
    "companyName": "OZi Logistics"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "RBAC system initialized successfully",
  "data": {
    "adminUser": {
      "id": 1,
      "email": "admin@ozi.com",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "Super Admin"
    },
    "rolesCreated": ["Super Admin", "Admin", "Manager", "Operator"],
    "permissionsCreated": 24
  }
}
```

### Check System Status

**Endpoint:** `GET /api/v1/system/status`

**Description:** Checks if the system has been initialized and returns current status.

**Headers:**
```bash
Content-Type: application/json
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/system/status" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "adminUserExists": true,
    "rolesCount": 4,
    "permissionsCount": 24,
    "databaseConnected": true
  }
}
```

## 👤 Admin Registration

### Register New Admin User

**Endpoint:** `POST /api/v1/auth/register-admin`

**Description:** Registers a new admin user (requires existing admin authentication).

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
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "roleId": 2,
  "department": "Operations",
  "employeeId": "EMP001"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/auth/register-admin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "email": "newadmin@ozi.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "roleId": 2,
    "department": "Operations",
    "employeeId": "EMP001"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user registered successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "newadmin@ozi.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Admin",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 🗄️ Database Setup

### Setup Database Tables

**Endpoint:** `POST /api/v1/system/setup-database`

**Description:** Creates all necessary database tables and indexes.

**Headers:**
```bash
Content-Type: application/json
X-Admin-Secret: your_admin_registration_secret
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/system/setup-database" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_registration_secret"
```

**Response:**
```json
{
  "success": true,
  "message": "Database tables created successfully",
  "data": {
    "tablesCreated": [
      "users",
      "roles",
      "permissions",
      "role_permissions",
      "orders",
      "picking_waves",
      "packing_jobs",
      "coupons"
    ],
    "indexesCreated": 15
  }
}
```

### Setup Picking Tables

**Endpoint:** `POST /api/v1/system/setup-picking`

**Description:** Creates picking-specific database tables.

**Headers:**
```bash
Content-Type: application/json
X-Admin-Secret: your_admin_registration_secret
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/system/setup-picking" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_registration_secret"
```

### Setup Packing Tables

**Endpoint:** `POST /api/v1/system/setup-packing`

**Description:** Creates packing-specific database tables.

**Headers:**
```bash
Content-Type: application/json
X-Admin-Secret: your_admin_registration_secret
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/system/setup-packing" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_registration_secret"
```

## 📊 Generate Mock Data

### Generate Sample Data

**Endpoint:** `POST /api/v1/system/generate-mock-data`

**Description:** Generates sample data for testing and development.

**Headers:**
```bash
Content-Type: application/json
X-Admin-Secret: your_admin_registration_secret
```

**Request Body:**
```json
{
  "usersCount": 10,
  "ordersCount": 50,
  "couponsCount": 20,
  "includePickingData": true,
  "includePackingData": true
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/system/generate-mock-data" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_registration_secret" \
  -d '{
    "usersCount": 10,
    "ordersCount": 50,
    "couponsCount": 20,
    "includePickingData": true,
    "includePackingData": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Mock data generated successfully",
  "data": {
    "usersCreated": 10,
    "ordersCreated": 50,
    "couponsCreated": 20,
    "pickingWavesCreated": 5,
    "packingJobsCreated": 8
  }
}
```

## 🔍 System Health Check

### Health Check

**Endpoint:** `GET /api/v1/system/health`

**Description:** Comprehensive system health check.

**Headers:**
```bash
Content-Type: application/json
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/system/health" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": "2h 15m 30s",
    "database": "connected",
    "redis": "connected",
    "aws": "connected",
    "lms": "connected",
    "version": "1.0.0"
  }
}
```

## 📱 Mobile App Version Check

### Check App Version Compatibility

**Endpoint:** `GET /api/v1/system/version-check`

**Description:** Checks if the mobile app version is compatible.

**Headers:**
```bash
Content-Type: application/json
X-App-Version: 1.0.0
X-Platform: ios
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/system/version-check" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 1.0.0" \
  -H "X-Platform: ios"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "compatible": true,
    "currentVersion": "1.0.0",
    "minimumVersion": "1.0.0",
    "latestVersion": "1.2.0",
    "updateRequired": false,
    "updateUrl": "https://apps.apple.com/app/ozi-logistics/id123456789"
  }
}
```

## ⚠️ Error Responses

### Common Error Responses

**Unauthorized Access:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid admin secret or insufficient permissions",
  "statusCode": 401
}
```

**System Already Initialized:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "RBAC system is already initialized",
  "statusCode": 409
}
```

**Database Connection Error:**
```json
{
  "success": false,
  "error": "Database Error",
  "message": "Unable to connect to database",
  "statusCode": 500
}
```

## 🔐 Security Notes

1. **Admin Secret**: The `X-Admin-Secret` header is required for system initialization and should be kept secure.
2. **JWT Tokens**: Use valid JWT tokens for authenticated endpoints.
3. **HTTPS**: All production API calls should use HTTPS.
4. **Rate Limiting**: Be aware of rate limiting on system endpoints.

## 📋 Setup Checklist

- [ ] Set environment variables
- [ ] Initialize RBAC system
- [ ] Create database tables
- [ ] Register initial admin user
- [ ] Test system health
- [ ] Generate mock data (optional)
- [ ] Verify mobile app compatibility

# OZi Backend API Reference

This document provides a comprehensive reference for all API endpoints in the OZi Backend system.

**Base URL:** `http://localhost:3000`

## 📱 Mobile App Headers

For mobile clients, include these headers:
```bash
source: mobile
app-version: 1.0.0
```

## 🔐 Authentication Endpoints

### POST /api/auth/register
Register a new user.

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

### POST /api/auth/login
Authenticate user and get JWT tokens.

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

### POST /api/auth/refresh-token
Refresh expired access token.

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### GET /api/auth/profile
Get current user profile (requires authentication).

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

### GET /api/auth/roles
Get available roles for registration.

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

### GET /api/auth/system-status
Check system status (no authentication required).

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

### GET /api/auth/test
Test endpoint to verify auth routes.

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

## 👥 User Management Endpoints

### GET /api/users
Get all users (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

### GET /api/users/:id
Get user by ID (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

### PUT /api/users/:id
Update user (requires authentication).

**Web Client:**
```bash
curl -X PUT "http://localhost:3000/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "isActive": true,
    "availabilityStatus": "available"
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://localhost:3000/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "isActive": true,
    "availabilityStatus": "available"
  }'
```

### DELETE /api/users/:id
Delete user (requires authentication).

**Web Client:**
```bash
curl -X DELETE "http://localhost:3000/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X DELETE "http://localhost:3000/api/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 🎭 Role Management Endpoints

### GET /api/roles
Get all roles (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

### POST /api/roles
Create new role (requires authentication).

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "new_role",
    "description": "New role description"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "name": "new_role",
    "description": "New role description"
  }'
```

## 🔐 Permission Management Endpoints

### GET /api/permissions
Get all permissions (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 📦 Order Management Endpoints

### GET /api/orders
Get all orders (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

### POST /api/orders
Create new order (requires authentication).

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "orderData": "order details here"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "orderData": "order details here"
  }'
```

## 🎫 Coupon Management Endpoints

### GET /api/coupon
Get all coupons (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/coupon" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/coupon" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 📋 Picking Management Endpoints

### GET /api/picking
Get picking operations (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/picking" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/picking" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 📦 Packing Management Endpoints

### GET /api/packing
Get packing operations (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/packing" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/packing" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 🤝 Handover Management Endpoints

### GET /api/handover
Get handover operations (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/handover" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/handover" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 🏢 Warehouse Management Endpoints

### GET /api/warehouses
Get warehouse information (requires authentication).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/warehouses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 🏥 Health Check

### GET /health
Check server health (no authentication required).

**Web Client:**
```bash
curl -X GET "http://localhost:3000/health" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/health" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

## 🔑 Authentication Headers

For protected endpoints, include:
```bash
Authorization: Bearer your_jwt_token_here
```

## 📱 Mobile App Requirements

- **source: mobile** - Required for mobile requests
- **app-version: 1.0.0** - Must be >= MIN_APP_VERSION (default: 1.0.0)
- Version checking only applies when `source: mobile` is present

## ⚠️ Common Error Codes

- **400** - Bad Request (missing required fields)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (e.g., user already exists)
- **426** - Upgrade Required (mobile app version too old)
- **500** - Internal Server Error

## 🔧 Environment Variables

Required environment variables:
```bash
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
ADMIN_REGISTRATION_SECRET=your_admin_secret
MIN_APP_VERSION=1.0.0
```

---

This API reference covers all implemented endpoints in the OZi Backend system. All endpoints are verified against the actual route files and will work correctly with localhost:3000.

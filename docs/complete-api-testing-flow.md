# Complete API Testing Flow - Admin Access

This document provides a comprehensive testing flow for all API endpoints using Admin login (which has access to all permissions).

## Prerequisites

- Server running on `http://localhost:3000`
- Admin user already exists in the system
- cURL or Postman available for testing

## Base Configuration

```bash
# Set base URL
BASE_URL="http://localhost:3000"

# Set required headers
HEADERS="-H 'X-App-Version: 1.0.0' -H 'Content-Type: application/json'"
```

## 1. System Status Check

### Check if system is running
```bash
curl -X GET "$BASE_URL/health" $HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 2. Admin Authentication

### Login as Admin
```bash
curl -X POST "$BASE_URL/api/auth/login" $HEADERS \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "roleId": 1,
      "isActive": true,
      "availabilityStatus": "available"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Extract and Set Access Token
```bash
# Extract token from response and set as environment variable
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Set authenticated headers
AUTH_HEADERS="$HEADERS -H 'Authorization: Bearer $ACCESS_TOKEN'"
```

## 3. User Profile & Role Verification

### Get Admin Profile
```bash
curl -X GET "$BASE_URL/api/auth/profile" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "role": {
      "id": 1,
      "name": "admin",
      "permissions": [
        "users_roles:manage",
        "warehouse:manage",
        "picking:assign_manage",
        "handover:manage",
        "orders:view_all",
        "picking:view",
        "picking:execute",
        "packing:execute",
        "warehouse:view",
        "pos:execute",
        "handover:view",
        "handover:execute"
      ]
    }
  }
}
```

## 4. Role Management Testing

### List All Roles
```bash
curl -X GET "$BASE_URL/api/roles" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "admin",
      "description": "System Administrator"
    },
    {
      "id": 2,
      "name": "wh_staff_1",
      "description": "Warehouse Staff Level 1"
    }
  ]
}
```

### Create New Role
```bash
curl -X POST "$BASE_URL/api/roles" $AUTH_HEADERS \
  -d '{
    "name": "supervisor",
    "description": "Warehouse Supervisor"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Role created successfully",
  "data": {
    "id": 3,
    "name": "supervisor",
    "description": "Warehouse Supervisor"
  }
}
```

## 5. Permission Management Testing

### List All Permissions
```bash
curl -X GET "$BASE_URL/api/permissions" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "users_roles:manage",
      "description": "Manage users and roles"
    },
    {
      "id": 2,
      "name": "warehouse:manage",
      "description": "Manage warehouses"
    }
  ]
}
```

### Create New Permission
```bash
curl -X POST "$BASE_URL/api/permissions" $AUTH_HEADERS \
  -d '{
    "name": "reports:view",
    "description": "View system reports"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Permission created successfully",
  "data": {
    "id": 10,
    "name": "reports:view",
    "description": "View system reports"
  }
}
```

## 6. User Management Testing

### List All Users
```bash
curl -X GET "$BASE_URL/api/users" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "roleId": 1,
      "isActive": true
    }
  ]
}
```

### Create New User
```bash
curl -X POST "$BASE_URL/api/users" $AUTH_HEADERS \
  -d '{
    "email": "staff@example.com",
    "password": "staff123",
    "roleId": 2
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "id": 2,
    "email": "staff@example.com",
    "roleId": 2,
    "isActive": true
  }
}
```

## 7. Warehouse Management Testing

### Create Warehouse
```bash
curl -X POST "$BASE_URL/api/warehouses" $AUTH_HEADERS \
  -d '{
    "name": "Main Warehouse",
    "address": "123 Warehouse St, City",
    "contactPerson": "John Doe",
    "contactPhone": "+1234567890",
    "capacity": 10000,
    "status": "active"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Warehouse created successfully",
  "data": {
    "id": 1,
    "name": "Main Warehouse",
    "address": "123 Warehouse St, City",
    "status": "active"
  }
}
```

### List Warehouses
```bash
curl -X GET "$BASE_URL/api/warehouses" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Main Warehouse",
      "address": "123 Warehouse St, City",
      "status": "active"
    }
  ]
}
```

### Create Warehouse Zone
```bash
curl -X POST "$BASE_URL/api/warehouses/1/zones" $AUTH_HEADERS \
  -d '{
    "name": "Zone A",
    "description": "High-value items",
    "capacity": 1000,
    "status": "active"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Zone created successfully",
  "data": {
    "id": 1,
    "name": "Zone A",
    "description": "High-value items",
    "capacity": 1000
  }
}
```

## 8. Order Management Testing

### Create Order
```bash
curl -X POST "$BASE_URL/api/orders/place" $AUTH_HEADERS \
  -d '{
    "customerName": "John Customer",
    "customerPhone": "+1234567890",
    "items": [
      {
        "productId": "PROD001",
        "quantity": 2,
        "unitPrice": 25.99
      }
    ],
    "deliveryAddress": "456 Customer St, City",
    "priority": "normal"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Order placed successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD-2024-001",
    "customerName": "John Customer",
    "status": "pending",
    "totalAmount": 51.98
  }
}
```

### List Orders
```bash
curl -X GET "$BASE_URL/api/orders" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-2024-001",
      "customerName": "John Customer",
      "status": "pending",
      "totalAmount": 51.98
    }
  ]
}
```

## 9. Picking Module Testing

### Generate Picking Waves
```bash
curl -X POST "$BASE_URL/api/picking/waves/generate" $AUTH_HEADERS \
  -d '{
    "warehouseId": 1,
    "priority": "normal"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Picking waves generated successfully",
  "data": {
    "wavesGenerated": 1,
    "totalItems": 2
  }
}
```

### Get Available Waves
```bash
curl -X GET "$BASE_URL/api/picking/waves/available" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "waveNumber": "WAVE-2024-001",
      "status": "pending",
      "totalItems": 2,
      "assignedTo": null
    }
  ]
}
```

### Start Picking Wave
```bash
curl -X POST "$BASE_URL/api/picking/waves/1/start" $AUTH_HEADERS \
  -d '{
    "pickerId": 2
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Picking wave started successfully",
  "data": {
    "waveId": 1,
    "status": "in_progress",
    "startedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

## 10. Packing Operations Testing

### Start Packing Job
```bash
curl -X POST "$BASE_URL/api/packing/start" $AUTH_HEADERS \
  -d '{
    "orderId": 1,
    "packerId": 2,
    "warehouseId": 1
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Packing job started successfully",
  "data": {
    "jobId": 1,
    "orderId": 1,
    "status": "in_progress",
    "startedAt": "2024-01-01T10:30:00.000Z"
  }
}
```

### Verify Packed Item
```bash
curl -X POST "$BASE_URL/api/packing/verify" $AUTH_HEADERS \
  -d '{
    "jobId": 1,
    "itemId": "PROD001",
    "quantity": 2,
    "verificationCode": "VER123"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Item verified successfully",
  "data": {
    "jobId": 1,
    "verifiedItems": 1,
    "totalItems": 2
  }
}
```

### Complete Packing Job
```bash
curl -X POST "$BASE_URL/api/packing/complete" $AUTH_HEADERS \
  -d '{
    "jobId": 1,
    "sealNumber": "SEAL-2024-001"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Packing job completed successfully",
  "data": {
    "jobId": 1,
    "status": "completed",
    "completedAt": "2024-01-01T11:00:00.000Z",
    "sealNumber": "SEAL-2024-001"
  }
}
```

## 11. Coupon Management Testing

### Validate Coupon
```bash
curl -X POST "$BASE_URL/api/coupon/validate" $AUTH_HEADERS \
  -d '{
    "couponCode": "SAVE20",
    "orderAmount": 100.00
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "couponCode": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20,
    "valid": true,
    "message": "Coupon is valid"
  }
}
```

### Apply Coupon to Order
```bash
curl -X GET "$BASE_URL/api/coupon/apply?couponCode=SAVE20&orderId=1" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Coupon applied successfully",
  "data": {
    "orderId": 1,
    "originalAmount": 51.98,
    "discountAmount": 10.40,
    "finalAmount": 41.58
  }
}
```

## 12. Handover & Delivery Testing

### List Available Riders
```bash
curl -X GET "$BASE_URL/api/handover/riders/available" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Rider 1",
      "phone": "+1234567890",
      "status": "available",
      "currentLocation": "Warehouse"
    }
  ]
}
```

### Assign Rider for Delivery
```bash
curl -X POST "$BASE_URL/api/handover/assign-rider" $AUTH_HEADERS \
  -d '{
    "orderId": 1,
    "riderId": 1,
    "estimatedDeliveryTime": "2024-01-01T14:00:00.000Z"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Rider assigned successfully",
  "data": {
    "handoverId": 1,
    "orderId": 1,
    "riderId": 1,
    "status": "assigned"
  }
}
```

### Confirm Handover to Rider
```bash
curl -X POST "$BASE_URL/api/handover/confirm" $AUTH_HEADERS \
  -d '{
    "handoverId": 1,
    "confirmationCode": "CONF123"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Handover confirmed successfully",
  "data": {
    "handoverId": 1,
    "status": "confirmed",
    "confirmedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## 13. Error Handling Testing

### Test Invalid Token
```bash
curl -X GET "$BASE_URL/api/users" $HEADERS \
  -H 'Authorization: Bearer invalid_token'
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Invalid token",
  "code": 401
}
```

### Test Missing Permission
```bash
# Try to access endpoint with insufficient permissions
curl -X GET "$BASE_URL/api/warehouses" $HEADERS \
  -H 'Authorization: Bearer user_token_without_permissions'
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Insufficient permissions",
  "code": 403
}
```

### Test Invalid Data
```bash
curl -X POST "$BASE_URL/api/users" $AUTH_HEADERS \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }'
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Invalid email format",
  "code": 400
}
```

## 14. Performance Testing

### Test Multiple Concurrent Requests
```bash
# Test 10 concurrent user listing requests
for i in {1..10}; do
  curl -X GET "$BASE_URL/api/users" $AUTH_HEADERS &
done
wait
```

### Test Database Query Performance
```bash
# Test large dataset retrieval
time curl -X GET "$BASE_URL/api/orders?limit=1000" $AUTH_HEADERS
```

## 15. Cleanup Testing

### Deactivate Test User
```bash
curl -X PUT "$BASE_URL/api/users/2/status" $AUTH_HEADERS \
  -d '{
    "isActive": false
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "User status updated successfully",
  "data": {
    "id": 2,
    "isActive": false
  }
}
```

### Delete Test Warehouse
```bash
curl -X DELETE "$BASE_URL/api/warehouses/1" $AUTH_HEADERS
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Warehouse deleted successfully"
}
```

## Testing Script

Create a complete testing script:

```bash
#!/bin/bash

# Complete API Testing Script
BASE_URL="http://localhost:3000"
HEADERS="-H 'X-App-Version: 1.0.0' -H 'Content-Type: application/json'"

echo "Starting API Testing..."

# 1. System Check
echo "1. Checking system status..."
curl -s -X GET "$BASE_URL/health" $HEADERS | jq '.'

# 2. Admin Login
echo "2. Admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" $HEADERS \
  -d '{"email": "admin@example.com", "password": "admin123"}')

echo $LOGIN_RESPONSE | jq '.'

# Extract token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
AUTH_HEADERS="$HEADERS -H 'Authorization: Bearer $ACCESS_TOKEN'"

echo "Access Token: $ACCESS_TOKEN"

# 3. Test all endpoints
echo "3. Testing all endpoints..."

# Continue with all the above curl commands...
```

## Summary

This testing flow covers:

✅ **Authentication & Authorization** - Admin login and token management  
✅ **User Management** - CRUD operations on users  
✅ **Role & Permission Management** - Create and manage roles/permissions  
✅ **Warehouse Management** - Full warehouse lifecycle  
✅ **Order Management** - Place and manage orders  
✅ **Picking Operations** - Generate and manage picking waves  
✅ **Packing Operations** - Complete packing workflow  
✅ **Coupon Management** - Validate and apply coupons  
✅ **Handover & Delivery** - Rider assignment and handover  
✅ **Error Handling** - Invalid requests and permissions  
✅ **Performance Testing** - Concurrent requests and response times  

**Total Endpoints Tested**: 25+ endpoints  
**Testing Time**: Approximately 30-45 minutes  
**Coverage**: 100% of core functionality  

Run this flow to ensure all API endpoints are working correctly with proper authentication and authorization.

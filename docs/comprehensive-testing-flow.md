# Comprehensive Testing Flow - All Roles and Permissions

This document provides a complete testing flow covering all roles and permissions in the OZi-backend system.

## System Overview

The system has 5 main roles with different permission levels:
1. **admin** - Full system access
2. **wh_manager** - Warehouse management and staff oversight
3. **wh_staff_1** - Inbound/QC/Putaway/Audit operations
4. **wh_staff_2** - Picking and packing operations
5. **store_ops** - Store operations and POS management

## Testing Prerequisites

1. Start the server: `npm run dev`
2. Ensure database is running and connected
3. Run RBAC initialization: `npm run script:init-rbac`

## Testing Flow

### Phase 1: System Setup and Admin Creation

#### 1.1 Check System Status
```bash
curl -X GET http://localhost:3000/api/v1/auth/system-status
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "error": null
}
```

#### 1.2 Create First Admin User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "Admin@123",
    "roleName": "admin"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ozi.com",
      "roleId": 1,
      "isActive": true,
      "availabilityStatus": "available",
      "Role": {
        "name": "admin",
        "Permissions": [...]
      }
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "error": null
}
```

#### 1.3 Admin Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ozi.com",
    "password": "Admin@123"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ozi.com",
      "roleId": 1,
      "Role": {
        "name": "admin",
        "Permissions": [...]
      }
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "error": null
}
```

**Save the accessToken for subsequent requests:**
```bash
export ADMIN_TOKEN="eyJ..."
```

### Phase 2: Role and Permission Testing

#### 2.1 Get All Roles (Admin)
```bash
curl -X GET http://localhost:3000/api/v1/auth/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "description": "System Administrator - Full system access"
    },
    {
      "id": 2,
      "name": "wh_manager",
      "description": "Warehouse Manager - Manage WH staff and operations"
    },
    {
      "id": 3,
      "name": "wh_staff_1",
      "description": "WH Staff (Inbound/QC/Putaway/Audit) - Execute inbound tasks"
    },
    {
      "id": 4,
      "name": "wh_staff_2",
      "description": "WH Staff (Picker/Packer) - Execute picking and packing"
    },
    {
      "id": 5,
      "name": "store_ops",
      "description": "Store Operations - Manage store and POS operations"
    }
  ],
  "error": null
}
```

#### 2.2 Get Admin Profile with Permissions
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@ozi.com",
    "roleId": 1,
    "isActive": true,
    "availabilityStatus": "available",
    "Role": {
      "id": 1,
      "name": "admin",
      "description": "System Administrator - Full system access",
      "Permissions": [
        {
          "id": 1,
          "module": "users_roles",
          "action": "manage",
          "description": "Create/update users and roles"
        },
        {
          "id": 2,
          "module": "sites",
          "action": "create_config",
          "description": "Create/configure sites"
        }
        // ... all permissions
      ]
    }
  },
  "error": null
}
```

### Phase 3: User Creation for Each Role

#### 3.1 Create Warehouse Manager
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wh_manager@ozi.com",
    "password": "Manager@123",
    "roleName": "wh_manager"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "wh_manager@ozi.com",
      "roleId": 2,
      "Role": {
        "name": "wh_manager",
        "Permissions": [
          "users_roles:create_wh_users",
          "sites:view",
          "orders:view_wh",
          "picking:assign_manage",
          "inbound:approve_variances",
          "putaway:manage",
          "inventory:approve",
          "cycle_count:schedule_approve",
          "replenishment:approve",
          "rtv:create_approve",
          "store_wh_requests:view",
          "exceptions:resolve",
          "dashboards:view_wh",
          "sla:view",
          "picking:view",
          "picking:monitor"
        ]
      }
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "error": null
}
```

**Save the token:**
```bash
export WH_MANAGER_TOKEN="eyJ..."
```

#### 3.2 Create WH Staff 1 (Inbound/QC/Putaway/Audit)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wh_staff1@ozi.com",
    "password": "Staff@123",
    "roleName": "wh_staff_1"
  }'
```

**Save the token:**
```bash
export WH_STAFF1_TOKEN="eyJ..."
```

#### 3.3 Create WH Staff 2 (Picker/Packer)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wh_staff2@ozi.com",
    "password": "Staff@123",
    "roleName": "wh_staff_2"
  }'
```

**Save the token:**
```bash
export WH_STAFF2_TOKEN="eyJ..."
```

#### 3.4 Create Store Operations User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "store_ops@ozi.com",
    "password": "Store@123",
    "roleName": "store_ops"
  }'
```

**Save the token:**
```bash
export STORE_OPS_TOKEN="eyJ..."
```

### Phase 4: Permission Testing by Role

#### 4.1 Admin Permission Testing

**Test Warehouse Creation (Admin has full access):**
```bash
curl -X POST http://localhost:3000/api/v1/warehouses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_code": "WH001",
    "name": "Main Warehouse",
    "address": "123 Warehouse St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "contact_person": "Admin User",
    "contact_phone": "+91-9876543210",
    "contact_email": "admin@ozi.com",
    "warehouse_type": "FULFILLMENT",
    "capacity_cubic_meters": 10000,
    "operating_hours": "24/7",
    "timezone": "Asia/Kolkata"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 1,
    "warehouse_code": "WH001",
    "name": "Main Warehouse",
    "status": "ACTIVE",
    "created_by": 1,
    "CreatedBy": {
      "id": 1,
      "email": "admin@ozi.com"
    }
  },
  "error": null
}
```

#### 4.2 Warehouse Manager Permission Testing

**Test Warehouse View (WH Manager has view permission):**
```bash
curl -X GET http://localhost:3000/api/v1/warehouses \
  -H "Authorization: Bearer $WH_MANAGER_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "warehouses": [
      {
        "id": 1,
        "warehouse_code": "WH001",
        "name": "Main Warehouse",
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  },
  "error": null
}
```

**Test Warehouse Creation (WH Manager should NOT have create permission):**
```bash
curl -X POST http://localhost:3000/api/v1/warehouses \
  -H "Authorization: Bearer $WH_MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_code": "WH002",
    "name": "Secondary Warehouse",
    "address": "456 Warehouse Ave",
    "city": "Delhi",
    "state": "Delhi",
    "country": "India",
    "pincode": "110001"
  }'
```

**Expected Response (Permission Denied):**
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions for this operation"
}
```

#### 4.3 WH Staff 1 Permission Testing

**Test Order View (WH Staff 1 has task scope):**
```bash
curl -X GET http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $WH_STAFF1_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "orders": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0
    }
  },
  "error": null
}
```

**Test Warehouse Creation (WH Staff 1 should NOT have create permission):**
```bash
curl -X POST http://localhost:3000/api/v1/warehouses \
  -H "Authorization: Bearer $WH_STAFF1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_code": "WH003",
    "name": "Test Warehouse",
    "address": "789 Test St",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India"
  }'
```

**Expected Response (Permission Denied):**
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions for this operation"
}
```

#### 4.4 WH Staff 2 Permission Testing

**Test Picking View (WH Staff 2 has picking view permission):**
```bash
curl -X GET http://localhost:3000/api/v1/picking/waves \
  -H "Authorization: Bearer $WH_STAFF2_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "pickingWaves": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0
    }
  },
  "error": null
}
```

**Test Warehouse Management (WH Staff 2 should NOT have management permission):**
```bash
curl -X PUT http://localhost:3000/api/v1/warehouses/1 \
  -H "Authorization: Bearer $WH_STAFF2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Warehouse Name"
  }'
```

**Expected Response (Permission Denied):**
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions for this operation"
}
```

#### 4.5 Store Operations Permission Testing

**Test Store Dashboard View (Store Ops has store scope):**
```bash
curl -X GET http://localhost:3000/api/v1/dashboards/store \
  -H "Authorization: Bearer $STORE_OPS_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "storeMetrics": {
      "totalOrders": 0,
      "pendingOrders": 0,
      "completedOrders": 0
    }
  },
  "error": null
}
```

**Test Warehouse Creation (Store Ops should NOT have warehouse permission):**
```bash
curl -X POST http://localhost:3000/api/v1/warehouses \
  -H "Authorization: Bearer $STORE_OPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_code": "WH004",
    "name": "Store Warehouse",
    "address": "321 Store St",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India"
  }'
```

**Expected Response (Permission Denied):**
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions for this operation"
}
```

### Phase 5: Cross-Role Permission Testing

#### 5.1 Test Role Escalation Prevention

**WH Staff trying to access admin endpoints:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/roles \
  -H "Authorization: Bearer $WH_STAFF1_TOKEN"
```

**Expected Response (Permission Denied):**
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions for this operation"
}
```

#### 5.2 Test Valid Cross-Role Operations

**WH Manager creating WH Staff (has permission):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer $WH_MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new_staff@ozi.com",
    "password": "NewStaff@123",
    "roleName": "wh_staff_1"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "user": {
      "id": 6,
      "email": "new_staff@ozi.com",
      "roleId": 3,
      "Role": {
        "name": "wh_staff_1"
      }
    }
  },
  "error": null
}
```

### Phase 6: Error Handling and Edge Cases

#### 6.1 Invalid Token Testing
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "success": false,
  "data": null,
  "error": "Invalid token"
}
```

#### 6.2 Missing Token Testing
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "success": false,
  "data": null,
  "error": "Access token required"
}
```

#### 6.3 Expired Token Testing
```bash
# Use an expired token (if available)
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer expired_token_here"
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "success": false,
  "data": null,
  "error": "Token expired"
}
```

### Phase 7: Token Refresh Testing

#### 7.1 Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "error": null
}
```

## Testing Summary

### Roles Tested:
1. ✅ **admin** - Full system access verified
2. ✅ **wh_manager** - Warehouse management permissions verified
3. ✅ **wh_staff_1** - Inbound/QC/Putaway/Audit permissions verified
4. ✅ **wh_staff_2** - Picking and packing permissions verified
5. ✅ **store_ops** - Store operations permissions verified

### Permission Categories Tested:
1. ✅ **User Management** - Role-based user creation
2. ✅ **Warehouse Operations** - Create, view, update permissions
3. ✅ **Order Management** - Different scope permissions
4. ✅ **Picking Operations** - View, execute, manage permissions
5. ✅ **Store Operations** - POS and store management
6. ✅ **Dashboard Access** - Role-scoped dashboard permissions
7. ✅ **Exception Handling** - Role-based exception management

### Security Features Verified:
1. ✅ **Authentication** - JWT token validation
2. ✅ **Authorization** - Role-based access control
3. ✅ **Permission Scoping** - Module and action-level permissions
4. ✅ **Token Refresh** - Secure token renewal
5. ✅ **Error Handling** - Proper permission denied responses

## Running the Complete Test Suite

To run all tests in sequence:

```bash
# 1. Set up environment
export BASE_URL="http://localhost:3000/api/v1"

# 2. Run the test script
chmod +x test-complete-flow.sh
./test-complete-flow.sh
```

## Notes

- All endpoints require API version header: `X-API-Version: 1.0`
- Tokens expire after 15 minutes (access) and 7 days (refresh)
- Database should be reset between test runs for clean state
- Monitor server logs for detailed permission checks
- Test both positive (allowed) and negative (denied) permission scenarios

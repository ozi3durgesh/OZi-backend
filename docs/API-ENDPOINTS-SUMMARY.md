# API Endpoints Summary

This document provides a quick reference to all available API endpoints in the OZi Backend system.

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-production-domain.com`

## Required Headers
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>  # For authenticated endpoints
Content-Type: application/json
```

## 1. Initial Setup & Admin Registration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/system-status` | Check system status | No |
| POST | `/api/auth/register` | Register initial admin | No |
| GET | `/api/auth/test` | Test auth route | No |

## 2. Authentication & Authorization

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| GET | `/api/auth/roles` | Get available roles | No |

## 3. Role Management (Admin Only)

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/roles` | Create new role | Yes | `users_roles:manage` |
| GET | `/api/roles` | List all roles | Yes | `users_roles:manage` |
| POST | `/api/roles/assign-permissions` | Assign permissions to role | Yes | `users_roles:manage` |

## 4. Permission Management (Admin Only)

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/permissions` | Create new permission | Yes | `users_roles:manage` |
| GET | `/api/permissions` | List all permissions | Yes | `users_roles:manage` |

## 5. User Management

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/users` | Create new user | Yes | `users_roles:manage` |
| GET | `/api/users` | List all users | Yes | `users_roles:manage` |
| PUT | `/api/users/:userId/status` | Update user status | Yes | No specific permission |
| PUT | `/api/users/:userId/role` | Change user role | Yes | `users_roles:manage` |
| DELETE | `/api/users/:userId` | Deactivate user | Yes | `users_roles:manage` |

## 6. Place Order

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/orders/place` | Create new order | Yes | `orders:view_all` |
| GET | `/api/orders/:id` | Get order by ID | Yes | `orders:view_all` |
| GET | `/api/orders` | List user orders | Yes | `orders:view_all` |
| PUT | `/api/orders/update/:id` | Update order | Yes | `orders:view_all` |

## 7. Coupon Management

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| GET | `/api/coupon/apply` | Apply coupon to order | Yes | `pos:execute` |
| POST | `/api/coupon/validate` | Validate coupon code | Yes | `pos:execute` |

## 8. Picking Module

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/picking/waves/generate` | Generate picking waves | Yes | `picking:assign_manage` |
| GET | `/api/picking/waves/assign` | Assign waves to pickers | Yes | `picking:assign_manage` |
| GET | `/api/picking/waves/available` | Get available waves | Yes | `picking:view` |
| POST | `/api/picking/waves/:waveId/start` | Start picking wave | Yes | `picking:execute` |
| POST | `/api/picking/waves/:waveId/scan` | Scan picked item | Yes | `picking:execute` |
| POST | `/api/picking/waves/:waveId/partial` | Report partial pick | Yes | `picking:execute` |
| POST | `/api/picking/waves/:waveId/complete` | Complete picking wave | Yes | `picking:execute` |
| GET | `/api/picking/sla-status` | Get SLA status | Yes | `picking:view` |
| GET | `/api/picking/expiry-alerts` | Get expiry alerts | Yes | `picking:view` |

## 9. Packing Operations

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/packing/start` | Start packing job | Yes | `packing:execute` |
| POST | `/api/packing/verify` | Verify packed item | Yes | `packing:execute` |
| POST | `/api/packing/complete` | Complete packing job | Yes | `packing:execute` |
| GET | `/api/packing/status/:jobId` | Get job status | Yes | `packing:execute` |
| GET | `/api/packing/awaiting-handover` | Get jobs awaiting handover | Yes | `packing:execute` |
| GET | `/api/packing/sla-status` | Get SLA status | Yes | `packing:execute` |

## 10. Warehouse Management

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/warehouses` | Create warehouse | Yes | `warehouse:manage` |
| GET | `/api/warehouses` | List warehouses | Yes | `warehouse:view` |
| GET | `/api/warehouses/:id` | Get warehouse by ID | Yes | `warehouse:view` |
| PUT | `/api/warehouses/:id` | Update warehouse | Yes | `warehouse:manage` |
| PATCH | `/api/warehouses/:id/status` | Update warehouse status | Yes | `warehouse:manage` |
| DELETE | `/api/warehouses/:id` | Delete warehouse | Yes | `warehouse:manage` |
| POST | `/api/warehouses/:warehouseId/zones` | Create zone | Yes | `warehouse:manage` |
| GET | `/api/warehouses/:warehouseId/zones` | List warehouse zones | Yes | `warehouse:view` |
| PUT | `/api/warehouses/zones/:zoneId` | Update zone | Yes | `warehouse:manage` |
| DELETE | `/api/warehouses/zones/:zoneId` | Delete zone | Yes | `warehouse:manage` |
| POST | `/api/warehouses/:warehouseId/staff` | Assign staff | Yes | `warehouse:manage` |
| GET | `/api/warehouses/:warehouseId/staff` | List warehouse staff | Yes | `warehouse:view` |
| DELETE | `/api/warehouses/staff-assignments/:assignmentId` | Remove staff assignment | Yes | `warehouse:manage` |

## 11. Handover & Delivery

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| POST | `/api/handover/assign-rider` | Assign rider for delivery | Yes | `handover:manage` |
| POST | `/api/handover/confirm` | Confirm handover to rider | Yes | `handover:execute` |
| PUT | `/api/handover/:handoverId/status` | Update handover status | Yes | `handover:execute` |
| GET | `/api/handover/riders/available` | List available riders | Yes | `handover:view` |
| GET | `/api/handover/lms/sync-status` | Get LMS sync status | Yes | `handover:view` |

## Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health check | No |

## Permission Requirements Summary

### High-Level Permissions
- **`users_roles:manage`** - Full user and role management
- **`warehouse:manage`** - Full warehouse management
- **`picking:assign_manage`** - Picking wave management
- **`handover:manage`** - Handover management

### Module-Specific Permissions
- **`orders:view_all`** - Order management
- **`picking:view`** - View picking information
- **`picking:execute`** - Execute picking operations
- **`packing:execute`** - Execute packing operations
- **`warehouse:view`** - View warehouse information
- **`pos:execute`** - POS operations
- **`handover:view`** - View handover information
- **`handover:execute`** - Execute handover operations

## Common HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information included in response headers

## Version Control

- **Header**: `X-App-Version: 1.0.0`
- **Required**: All endpoints
- **Purpose**: API version compatibility

## Authentication Flow

1. **Login**: `POST /api/auth/login`
2. **Get Token**: Extract `accessToken` from response
3. **Use Token**: Include in `Authorization: Bearer <token>` header
4. **Refresh**: Use `POST /api/auth/refresh-token` when expired

## Testing with cURL

All endpoints include cURL examples in their respective documentation files. Use the examples with:

```bash
# Set your access token
export ACCESS_TOKEN="your-jwt-token-here"

# Use in cURL commands
curl -H "Authorization: Bearer $ACCESS_TOKEN" ...
```

## Mobile App Considerations

- Implement automatic token refresh
- Handle offline scenarios gracefully
- Cache frequently accessed data
- Implement proper error handling
- Use appropriate timeouts for mobile networks

## Web App Considerations

- Store tokens securely (not in localStorage)
- Implement CSRF protection
- Use HTTPS in production
- Handle session expiration gracefully

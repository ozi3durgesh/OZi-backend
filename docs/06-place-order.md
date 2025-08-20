# Order Management

This document covers all order management endpoints for the OZi Backend system.

**Base URL:** `http://13.232.150.239`

## 📦 Order Operations

### Create New Order

**Endpoint:** `POST /api/orders/place`

**Description:** Creates a new order in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "customerInfo": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  },
  "items": [
    {
      "productId": "PROD-001",
      "productName": "Wireless Headphones",
      "quantity": 2,
      "unitPrice": 99.99,
      "sku": "WH-001"
    }
  ],
  "shippingMethod": "express",
  "priority": "normal",
  "notes": "Handle with care"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/orders/place" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "customerInfo": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    },
    "items": [
      {
        "productId": "PROD-001",
        "productName": "Wireless Headphones",
        "quantity": 2,
        "unitPrice": 99.99,
        "sku": "WH-001"
      }
    ],
    "shippingMethod": "express",
    "priority": "normal",
    "notes": "Handle with care"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/orders/place" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "customerInfo": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    },
    "items": [
      {
        "productId": "PROD-001",
        "productName": "Wireless Headphones",
        "quantity": 2,
        "unitPrice": 99.99,
        "sku": "WH-001"
      }
    ],
    "shippingMethod": "express",
    "priority": "normal",
    "notes": "Handle with care"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "ORD-2024-001",
      "orderNumber": "ORD-2024-001",
      "status": "pending",
      "totalAmount": 199.98,
      "customerName": "John Doe",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get All Orders

**Endpoint:** `GET /api/orders`

**Description:** Retrieves all orders with optional filtering and pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `status` (optional): Filter by status (pending, processing, shipped, delivered)
- `priority` (optional): Filter by priority (low, normal, high, urgent)

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/orders?page=1&limit=10&status=pending&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/orders?page=1&limit=10&status=pending&priority=high" \
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
    "orders": [
      {
        "id": "ORD-2024-001",
        "orderNumber": "ORD-2024-001",
        "customerName": "John Doe",
        "status": "pending",
        "priority": "high",
        "totalAmount": 199.98,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Get Order by ID

**Endpoint:** `GET /api/orders/:id`

**Description:** Retrieves a specific order by its ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/orders/ORD-2024-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/orders/ORD-2024-001" \
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
    "order": {
      "id": "ORD-2024-001",
      "orderNumber": "ORD-2024-001",
      "customerInfo": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        }
      },
      "items": [
        {
          "productId": "PROD-001",
          "productName": "Wireless Headphones",
          "quantity": 2,
          "unitPrice": 99.99,
          "sku": "WH-001",
          "totalPrice": 199.98
        }
      ],
      "status": "pending",
      "priority": "normal",
      "shippingMethod": "express",
      "totalAmount": 199.98,
      "notes": "Handle with care",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update Order

**Endpoint:** `PUT /api/orders/update/:id`

**Description:** Updates an existing order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "customerInfo": {
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "priority": "high",
  "notes": "Updated notes"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://13.232.150.239/api/orders/update/ORD-2024-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "customerInfo": {
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "priority": "high",
    "notes": "Updated notes"
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://13.232.150.239/api/orders/update/ORD-2024-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "customerInfo": {
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "priority": "high",
    "notes": "Updated notes"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order updated successfully",
  "data": {
    "order": {
      "id": "ORD-2024-001",
      "priority": "high",
      "notes": "Updated notes",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Cancel Order

**Endpoint:** `POST /api/orders/:id/cancel`

**Description:** Cancels an existing order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "reason": "Customer request",
  "notes": "Customer called to cancel"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://13.232.150.239/api/orders/ORD-2024-001/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "reason": "Customer request",
    "notes": "Customer called to cancel"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://13.232.150.239/api/orders/ORD-2024-001/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "reason": "Customer request",
    "notes": "Customer called to cancel"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "orderId": "ORD-2024-001",
    "status": "cancelled",
    "cancelledAt": "2024-01-15T11:30:00.000Z",
    "reason": "Customer request"
  }
}
```

### Update Order Status

**Endpoint:** `PATCH /api/orders/:id/status`

**Description:** Updates the status of an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "status": "processing",
  "notes": "Order is now being processed"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PATCH "http://13.232.150.239/api/orders/ORD-2024-001/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "status": "processing",
    "notes": "Order is now being processed"
  }'
```

**Mobile Client:**
```bash
curl -X PATCH "http://13.232.150.239/api/orders/ORD-2024-001/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "status": "processing",
    "notes": "Order is now being processed"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": "ORD-2024-001",
    "oldStatus": "pending",
    "newStatus": "processing",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Get Order Status History

**Endpoint:** `GET /api/orders/:id/status-history`

**Description:** Retrieves the status history of an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://13.232.150.239/api/orders/ORD-2024-001/status-history" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://13.232.150.239/api/orders/ORD-2024-001/status-history" \
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
    "orderId": "ORD-2024-001",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "notes": "Order created",
        "updatedBy": "system"
      },
      {
        "status": "processing",
        "timestamp": "2024-01-15T12:00:00.000Z",
        "notes": "Order is now being processed",
        "updatedBy": "admin@ozi.com"
      }
    ]
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

## ⚠️ Error Responses

### Common Error Responses

**Unauthorized Access:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid access token",
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

**Order Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Order not found",
  "statusCode": 404
}
```

**Invalid Order Status:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid order status",
  "statusCode": 400
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

## 🔐 Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Permission-Based Access**: Role-based access control (RBAC)
3. **Version Control**: Mobile app compatibility checking
4. **Input Validation**: Comprehensive request validation
5. **Audit Logging**: Track all order operations

## 📋 Order Management Flow

### Web Client Flow
1. User authenticates with valid JWT token
2. User performs order operations
3. System validates permissions and processes request
4. Response is returned with operation result

### Mobile Client Flow
1. App sends request with version headers
2. System validates app version compatibility
3. User authenticates with valid JWT token
4. User performs order operations
5. System validates permissions and processes request
6. Response is returned with operation result
7. Version checking on every request

---

This document covers all order management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints require authentication and appropriate permissions.

8. **Data Backup**: Regular backup of order data

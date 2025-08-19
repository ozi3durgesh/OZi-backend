# Place Order

This document covers all order placement and management endpoints for the OZi Backend system.

## 📦 Order Operations

### Create New Order

**Endpoint:** `POST /api/v1/orders`

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
      "productId": "PROD001",
      "productName": "Wireless Headphones",
      "quantity": 2,
      "unitPrice": 99.99,
      "sku": "WH-001",
      "weight": 0.5,
      "dimensions": {
        "length": 20,
        "width": 15,
        "height": 8
      }
    },
    {
      "productId": "PROD002",
      "productName": "Smartphone Case",
      "quantity": 1,
      "unitPrice": 29.99,
      "sku": "SC-001",
      "weight": 0.1,
      "dimensions": {
        "length": 15,
        "width": 8,
        "height": 2
      }
    }
  ],
  "shippingMethod": "express",
  "priority": "high",
  "notes": "Handle with care - fragile items",
  "expectedDeliveryDate": "2024-01-20"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/orders" \
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
        "productId": "PROD001",
        "productName": "Wireless Headphones",
        "quantity": 2,
        "unitPrice": 99.99,
        "sku": "WH-001",
        "weight": 0.5,
        "dimensions": {
          "length": 20,
          "width": 15,
          "height": 8
        }
      }
    ],
    "shippingMethod": "express",
    "priority": "high",
    "notes": "Handle with care - fragile items",
    "expectedDeliveryDate": "2024-01-20"
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
      "status": "pending",
      "customerInfo": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890"
      },
      "items": [
        {
          "id": 1,
          "productId": "PROD001",
          "productName": "Wireless Headphones",
          "quantity": 2,
          "unitPrice": 99.99,
          "totalPrice": 199.98
        }
      ],
      "totalAmount": 199.98,
      "shippingMethod": "express",
      "priority": "high",
      "expectedDeliveryDate": "2024-01-20",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "estimatedProcessingTime": "2-3 business days"
    }
  }
}
```

### Get All Orders

**Endpoint:** `GET /api/v1/orders`

**Description:** Retrieves all orders with filtering and pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `status` (optional): Filter by status (pending, processing, picked, packed, shipped, delivered, cancelled)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `customerEmail` (optional): Filter by customer email
- `dateFrom` (optional): Filter by creation date
- `dateTo` (optional): Filter by creation date
- `shippingMethod` (optional): Filter by shipping method

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/orders?page=1&limit=10&status=pending&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ORD-2024-001",
        "status": "pending",
        "customerInfo": {
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "totalAmount": 199.98,
        "priority": "high",
        "shippingMethod": "express",
        "expectedDeliveryDate": "2024-01-20",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### Get Order by ID

**Endpoint:** `GET /api/v1/orders/:id`

**Description:** Retrieves a specific order by its ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/orders/ORD-2024-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ORD-2024-001",
      "status": "pending",
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
          "id": 1,
          "productId": "PROD001",
          "productName": "Wireless Headphones",
          "quantity": 2,
          "unitPrice": 99.99,
          "totalPrice": 199.98,
          "sku": "WH-001",
          "weight": 0.5,
          "dimensions": {
            "length": 20,
            "width": 15,
            "height": 8
          }
        }
      ],
      "totalAmount": 199.98,
      "shippingMethod": "express",
      "priority": "high",
      "notes": "Handle with care - fragile items",
      "expectedDeliveryDate": "2024-01-20",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "estimatedProcessingTime": "2-3 business days",
      "trackingNumber": null,
      "shippedAt": null,
      "deliveredAt": null
    }
  }
}
```

### Update Order

**Endpoint:** `PUT /api/v1/orders/:id`

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
    "phone": "+1234567891"
  },
  "shippingMethod": "standard",
  "priority": "medium",
  "notes": "Updated notes - standard shipping preferred"
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/orders/ORD-2024-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "customerInfo": {
      "phone": "+1234567891"
    },
    "shippingMethod": "standard",
    "priority": "medium",
    "notes": "Updated notes - standard shipping preferred"
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
      "customerInfo": {
        "phone": "+1234567891"
      },
      "shippingMethod": "standard",
      "priority": "medium",
      "notes": "Updated notes - standard shipping preferred",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Cancel Order

**Endpoint:** `POST /api/v1/orders/:id/cancel`

**Description:** Cancels an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "reason": "Customer requested cancellation",
  "refundRequired": true
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "reason": "Customer requested cancellation",
    "refundRequired": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "id": "ORD-2024-001",
      "status": "cancelled",
      "cancelledAt": "2024-01-15T11:30:00.000Z",
      "cancellationReason": "Customer requested cancellation",
      "refundRequired": true
    }
  }
}
```

## 📋 Order Status Management

### Update Order Status

**Endpoint:** `PATCH /api/v1/orders/:id/status`

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
  "notes": "Order moved to processing queue"
}
```

**cURL Example:**
```bash
curl -X PATCH "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "status": "processing",
    "notes": "Order moved to processing queue"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "id": "ORD-2024-001",
      "status": "processing",
      "statusUpdatedAt": "2024-01-15T12:00:00.000Z",
      "statusNotes": "Order moved to processing queue"
    }
  }
}
```

### Get Order Status History

**Endpoint:** `GET /api/v1/orders/:id/status-history`

**Description:** Retrieves the status change history of an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/status-history" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
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
        "updatedBy": "system",
        "notes": "Order created"
      },
      {
        "status": "processing",
        "timestamp": "2024-01-15T12:00:00.000Z",
        "updatedBy": "john.doe@ozi.com",
        "notes": "Order moved to processing queue"
      }
    ]
  }
}
```

## 📦 Order Items Management

### Add Item to Order

**Endpoint:** `POST /api/v1/orders/:id/items`

**Description:** Adds a new item to an existing order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "productId": "PROD003",
  "productName": "Bluetooth Speaker",
  "quantity": 1,
  "unitPrice": 79.99,
  "sku": "BS-001",
  "weight": 0.8,
  "dimensions": {
    "length": 25,
    "width": 20,
    "height": 15
  }
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "productId": "PROD003",
    "productName": "Bluetooth Speaker",
    "quantity": 1,
    "unitPrice": 79.99,
    "sku": "BS-001",
    "weight": 0.8,
    "dimensions": {
      "length": 25,
      "width": 20,
      "height": 15
    }
  }'
```

### Update Order Item

**Endpoint:** `PUT /api/v1/orders/:id/items/:itemId`

**Description:** Updates an existing item in an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "quantity": 3,
  "notes": "Increased quantity as requested by customer"
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/items/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "quantity": 3,
    "notes": "Increased quantity as requested by customer"
  }'
```

### Remove Item from Order

**Endpoint:** `DELETE /api/v1/orders/:id/items/:itemId`

**Description:** Removes an item from an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/items/2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🚚 Shipping and Delivery

### Update Shipping Information

**Endpoint:** `PUT /api/v1/orders/:id/shipping`

**Description:** Updates shipping information for an order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "shippingMethod": "overnight",
  "trackingNumber": "TRK123456789",
  "carrier": "FedEx",
  "estimatedDeliveryDate": "2024-01-16"
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/shipping" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "shippingMethod": "overnight",
    "trackingNumber": "TRK123456789",
    "carrier": "FedEx",
    "estimatedDeliveryDate": "2024-01-16"
  }'
```

### Mark Order as Shipped

**Endpoint:** `POST /api/v1/orders/:id/ship`

**Description:** Marks an order as shipped.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "trackingNumber": "TRK123456789",
  "carrier": "FedEx",
  "shippedAt": "2024-01-15T14:00:00.000Z",
  "estimatedDeliveryDate": "2024-01-16"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/ship" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "trackingNumber": "TRK123456789",
    "carrier": "FedEx",
    "shippedAt": "2024-01-15T14:00:00.000Z",
    "estimatedDeliveryDate": "2024-01-16"
  }'
```

### Mark Order as Delivered

**Endpoint:** `POST /api/v1/orders/:id/deliver`

**Description:** Marks an order as delivered.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "deliveredAt": "2024-01-16T10:00:00.000Z",
  "deliveryNotes": "Delivered to front desk",
  "signature": "John Doe"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/orders/ORD-2024-001/deliver" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "deliveredAt": "2024-01-16T10:00:00.000Z",
    "deliveryNotes": "Delivered to front desk",
    "signature": "John Doe"
  }'
```

## 📊 Order Analytics

### Get Order Statistics

**Endpoint:** `GET /api/v1/orders/statistics`

**Description:** Retrieves statistics about orders.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `dateFrom` (optional): Start date for statistics
- `dateTo` (optional): End date for statistics

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/orders/statistics?dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 15750.50,
    "averageOrderValue": 105.00,
    "statusDistribution": [
      {
        "status": "pending",
        "count": 25,
        "percentage": 16.67
      },
      {
        "status": "processing",
        "count": 30,
        "percentage": 20.0
      }
    ],
    "priorityDistribution": [
      {
        "priority": "high",
        "count": 45,
        "percentage": 30.0
      }
    ],
    "shippingMethodDistribution": [
      {
        "method": "express",
        "count": 60,
        "percentage": 40.0
      }
    ]
  }
}
```

### Get Order Report

**Endpoint:** `GET /api/v1/orders/report`

**Description:** Generates a detailed order report.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `format` (optional): Report format (json, csv, pdf)
- `dateFrom` (required): Start date for the report
- `dateTo` (required): End date for the report
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/orders/report?format=json&dateFrom=2024-01-01&dateTo=2024-01-31&status=delivered" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔍 Order Search and Filtering

### Search Orders

**Endpoint:** `GET /api/v1/orders/search`

**Description:** Advanced search for orders with multiple criteria.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (required): Search query
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `customerEmail` (optional): Filter by customer email
- `dateFrom` (optional): Filter by creation date
- `dateTo` (optional): Filter by creation date

**cURL Example:**
```bash
curl -X GET "https://your-app.onrender.com/api/v1/orders/search?q=wireless&status=pending&priority=high" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔄 Bulk Order Operations

### Bulk Create Orders

**Endpoint:** `POST /api/v1/orders/bulk`

**Description:** Creates multiple orders at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "orders": [
    {
      "customerInfo": {
        "name": "Customer 1",
        "email": "customer1@example.com"
      },
      "items": [
        {
          "productId": "PROD001",
          "quantity": 1,
          "unitPrice": 99.99
        }
      ]
    },
    {
      "customerInfo": {
        "name": "Customer 2",
        "email": "customer2@example.com"
      },
      "items": [
        {
          "productId": "PROD002",
          "quantity": 2,
          "unitPrice": 29.99
        }
      ]
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "https://your-app.onrender.com/api/v1/orders/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "orders": [
      {
        "customerInfo": {
          "name": "Customer 1",
          "email": "customer1@example.com"
        },
        "items": [
          {
            "productId": "PROD001",
            "quantity": 1,
            "unitPrice": 99.99
          }
        ]
      }
    ]
  }'
```

### Bulk Update Order Status

**Endpoint:** `PUT /api/v1/orders/bulk/status`

**Description:** Updates the status of multiple orders at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "orders": [
    {
      "id": "ORD-2024-001",
      "status": "processing"
    },
    {
      "id": "ORD-2024-002",
      "status": "processing"
    }
  ],
  "notes": "Bulk status update to processing"
}
```

**cURL Example:**
```bash
curl -X PUT "https://your-app.onrender.com/api/v1/orders/bulk/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "orders": [
      {
        "id": "ORD-2024-001",
        "status": "processing"
      },
      {
        "id": "ORD-2024-002",
        "status": "processing"
      }
    ],
    "notes": "Bulk status update to processing"
  }'
```

## ⚠️ Error Responses

### Common Error Responses

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
  "message": "Invalid order status transition",
  "statusCode": 400
}
```

**Order Already Shipped:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Cannot modify shipped order",
  "statusCode": 409
}
```

**Insufficient Stock:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Insufficient stock for requested items",
  "statusCode": 409
}
```

## 🔐 Security Considerations

1. **Permission-Based Access**: Order management requires appropriate permissions
2. **Status Validation**: Order status changes follow business rules
3. **Audit Logging**: All order changes are logged for tracking
4. **Customer Data Protection**: Customer information is handled securely
5. **Financial Validation**: Order amounts and pricing are validated

## 📋 Best Practices

1. **Status Management**: Follow proper order status workflow
2. **Data Validation**: Validate all order data before processing
3. **Customer Communication**: Keep customers informed of order status
4. **Inventory Management**: Check stock availability before order confirmation
5. **Shipping Integration**: Integrate with shipping carriers for tracking
6. **Order Tracking**: Maintain comprehensive order history
7. **Performance Monitoring**: Monitor order processing performance
8. **Data Backup**: Regular backup of order data

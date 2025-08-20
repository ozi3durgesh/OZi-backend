# Place Order

This module handles order creation, management, and tracking. Users need `orders:view_all` permission to access these endpoints.

## Place Order

### Create New Order
Create a new order in the system.

**Endpoint:** `POST /api/orders/place`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
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
      "sku": "PROD-001",
      "quantity": 2,
      "unitPrice": 29.99,
      "description": "Product Description"
    },
    {
      "sku": "PROD-002",
      "quantity": 1,
      "unitPrice": 49.99,
      "description": "Another Product"
    }
  ],
  "shippingMethod": "standard",
  "priority": "normal",
  "specialInstructions": "Handle with care"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/orders/place" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
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
        "sku": "PROD-001",
        "quantity": 2,
        "unitPrice": 29.99,
        "description": "Product Description"
      },
      {
        "sku": "PROD-002",
        "quantity": 1,
        "unitPrice": 49.99,
        "description": "Another Product"
      }
    ],
    "shippingMethod": "standard",
    "priority": "normal",
    "specialInstructions": "Handle with care"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "orderId": "ORD-2024-001",
    "orderNumber": "ORD-2024-001",
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
        "sku": "PROD-001",
        "quantity": 2,
        "unitPrice": 29.99,
        "description": "Product Description",
        "totalPrice": 59.98
      },
      {
        "sku": "PROD-002",
        "quantity": 1,
        "unitPrice": 49.99,
        "description": "Another Product",
        "totalPrice": 49.99
      }
    ],
    "orderSummary": {
      "subtotal": 109.97,
      "tax": 8.80,
      "shipping": 5.99,
      "total": 124.76
    },
    "shippingMethod": "standard",
    "priority": "normal",
    "specialInstructions": "Handle with care",
    "estimatedDelivery": "2024-01-05T00:00:00.000Z",
    "createdAt": "2024-01-01T19:00:00.000Z",
    "createdBy": 1
  },
  "error": null
}
```

## Get Order by ID

### Retrieve Order Details
Get detailed information about a specific order.

**Endpoint:** `GET /api/orders/:id`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/orders/ORD-2024-001" \
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
    "orderId": "ORD-2024-001",
    "orderNumber": "ORD-2024-001",
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
        "sku": "PROD-001",
        "quantity": 2,
        "unitPrice": 29.99,
        "description": "Product Description",
        "totalPrice": 59.98,
        "pickingStatus": "pending",
        "packingStatus": "pending"
      },
      {
        "sku": "PROD-002",
        "quantity": 1,
        "unitPrice": 49.99,
        "description": "Another Product",
        "totalPrice": 49.99,
        "pickingStatus": "pending",
        "packingStatus": "pending"
      }
    ],
    "orderSummary": {
      "subtotal": 109.97,
      "tax": 8.80,
      "shipping": 5.99,
      "total": 124.76
    },
    "shippingMethod": "standard",
    "priority": "normal",
    "specialInstructions": "Handle with care",
    "estimatedDelivery": "2024-01-05T00:00:00.000Z",
    "workflowStatus": {
      "picking": "pending",
      "packing": "pending",
      "handover": "pending"
    },
    "createdAt": "2024-01-01T19:00:00.000Z",
    "createdBy": 1,
    "updatedAt": "2024-01-01T19:00:00.000Z"
  },
  "error": null
}
```

## Get User Orders

### List User's Orders
Retrieve a list of orders for the authenticated user.

**Endpoint:** `GET /api/orders`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `status` (optional): Filter by order status
- `priority` (optional): Filter by priority level
- `dateFrom` (optional): Filter orders from date (YYYY-MM-DD)
- `dateTo` (optional): Filter orders to date (YYYY-MM-DD)
- `limit` (optional): Number of orders to return (default: 50)
- `offset` (optional): Number of orders to skip (default: 0)

**cURL Example:**
```bash
# Get all orders
curl -X GET "http://localhost:3000/api/orders" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by status
curl -X GET "http://localhost:3000/api/orders?status=pending" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by priority
curl -X GET "http://localhost:3000/api/orders?priority=high" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by date range
curl -X GET "http://localhost:3000/api/orders?dateFrom=2024-01-01&dateTo=2024-01-31" \
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
    "orders": [
      {
        "orderId": "ORD-2024-001",
        "orderNumber": "ORD-2024-001",
        "status": "pending",
        "customerInfo": {
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "orderSummary": {
          "total": 124.76,
          "itemCount": 2
        },
        "priority": "normal",
        "estimatedDelivery": "2024-01-05T00:00:00.000Z",
        "workflowStatus": {
          "picking": "pending",
          "packing": "pending",
          "handover": "pending"
        },
        "createdAt": "2024-01-01T19:00:00.000Z"
      },
      {
        "orderId": "ORD-2024-002",
        "orderNumber": "ORD-2024-002",
        "status": "in_progress",
        "customerInfo": {
          "name": "Jane Smith",
          "email": "jane.smith@example.com"
        },
        "orderSummary": {
          "total": 89.99,
          "itemCount": 1
        },
        "priority": "high",
        "estimatedDelivery": "2024-01-03T00:00:00.000Z",
        "workflowStatus": {
          "picking": "completed",
          "packing": "in_progress",
          "handover": "pending"
        },
        "createdAt": "2024-01-01T18:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 2,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  },
  "error": null
}
```

## Update Order

### Modify Existing Order
Update order information before it enters the picking phase.

**Endpoint:** `PUT /api/orders/update/:id`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerInfo": {
    "phone": "+1234567899"
  },
  "items": [
    {
      "sku": "PROD-001",
      "quantity": 3
    }
  ],
  "specialInstructions": "Updated special instructions"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/orders/update/ORD-2024-001" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "customerInfo": {
      "phone": "+1234567899"
    },
    "items": [
      {
        "sku": "PROD-001",
        "quantity": 3
      }
    ],
    "specialInstructions": "Updated special instructions"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "orderId": "ORD-2024-001",
    "orderNumber": "ORD-2024-001",
    "status": "updated",
    "message": "Order updated successfully",
    "updatedFields": [
      "customerInfo.phone",
      "items[0].quantity",
      "specialInstructions"
    ],
    "updatedAt": "2024-01-01T20:00:00.000Z",
    "updatedBy": 1
  },
  "error": null
}
```

## Order Status Workflow

### Order Lifecycle
Orders follow a specific workflow:

1. **pending** - Order created, awaiting processing
2. **confirmed** - Order confirmed, ready for picking
3. **picking** - Items being picked from warehouse
4. **picked** - All items picked successfully
5. **packing** - Items being packed for shipment
6. **packed** - Order packed and ready for handover
7. **handover** - Order handed over to delivery partner
8. **in_transit** - Order in delivery
9. **delivered** - Order delivered successfully
10. **cancelled** - Order cancelled

### Priority Levels
- **low** - Standard processing time
- **normal** - Regular processing time
- **high** - Expedited processing
- **urgent** - Highest priority processing

### Shipping Methods
- **standard** - 3-5 business days
- **express** - 1-2 business days
- **overnight** - Next business day

## Order Creation Examples

### 1. High Priority Order
```bash
curl -X POST "http://localhost:3000/api/orders/place" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerInfo": {
      "name": "VIP Customer",
      "email": "vip@example.com",
      "phone": "+1234567890",
      "address": {
        "street": "456 VIP Ave",
        "city": "Los Angeles",
        "state": "CA",
        "zipCode": "90210",
        "country": "USA"
      }
    },
    "items": [
      {
        "sku": "VIP-001",
        "quantity": 1,
        "unitPrice": 199.99,
        "description": "Premium Product"
      }
    ],
    "shippingMethod": "overnight",
    "priority": "urgent",
    "specialInstructions": "VIP customer - handle with extra care"
  }'
```

### 2. Bulk Order
```bash
curl -X POST "http://localhost:3000/api/orders/place" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerInfo": {
      "name": "Bulk Customer",
      "email": "bulk@example.com",
      "phone": "+1234567890",
      "address": {
        "street": "789 Bulk St",
        "city": "Chicago",
        "state": "IL",
        "zipCode": "60601",
        "country": "USA"
      }
    },
    "items": [
      {
        "sku": "BULK-001",
        "quantity": 100,
        "unitPrice": 9.99,
        "description": "Bulk Product A"
      },
      {
        "sku": "BULK-002",
        "quantity": 50,
        "unitPrice": 19.99,
        "description": "Bulk Product B"
      }
    ],
    "shippingMethod": "standard",
    "priority": "normal",
    "specialInstructions": "Bulk order - palletize if possible"
  }'
```

### 3. International Order
```bash
curl -X POST "http://localhost:3000/api/orders/place" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerInfo": {
      "name": "International Customer",
      "email": "international@example.com",
      "phone": "+44123456789",
      "address": {
        "street": "10 International Lane",
        "city": "London",
        "state": "",
        "zipCode": "SW1A 1AA",
        "country": "UK"
      }
    },
    "items": [
      {
        "sku": "INT-001",
        "quantity": 2,
        "unitPrice": 79.99,
        "description": "International Product"
      }
    ],
    "shippingMethod": "express",
    "priority": "high",
    "specialInstructions": "International shipping - customs documentation required"
  }'
```

## Error Responses

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions. Required: orders:view_all"
}
```

### Order Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Order not found"
}
```

### Invalid Order Data
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid order data: missing required fields"
}
```

### Order Cannot Be Updated
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Order cannot be updated in current status"
}
```

### Insufficient Inventory
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Insufficient inventory for SKU: PROD-001"
}
```

## Best Practices

### Order Creation
- Validate all customer information
- Check inventory availability
- Use appropriate priority levels
- Include clear special instructions

### Order Management
- Update orders promptly
- Communicate status changes
- Handle cancellations gracefully
- Maintain audit trail

### Customer Experience
- Provide clear order confirmations
- Send status update notifications
- Handle special requests professionally
- Resolve issues quickly

## Mobile App Integration

### Order Display
- Show order status clearly
- Display progress indicators
- Provide estimated delivery times
- Show order history

### Order Management
- Allow order updates when possible
- Implement order tracking
- Handle offline order creation
- Sync order changes

### Offline Handling
- Cache order information
- Queue order updates
- Sync when connection restored
- Handle conflicts gracefully

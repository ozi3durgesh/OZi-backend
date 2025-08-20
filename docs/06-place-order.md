# Order Management

This document covers all order management endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## 📦 Order Operations

### Place Order

**Endpoint:** `POST /api/orders/place`

**Description:** Creates a new order with cart items and optional coupon.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "cart": [
    {
      "sku": 12345,
      "amount": 29.99
    },
    {
      "sku": 67890,
      "amount": 15.50
    }
  ],
  "coupon_code": "SAVE20",
  "order_amount": 45.49,
  "order_type": "delivery",
  "payment_method": "cash_on_delivery",
  "store_id": 1,
  "distance": 5.2,
  "discount_amount": 0,
  "tax_amount": 2.27,
  "address": "123 Main St, City, State 12345",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "contact_person_name": "John Doe",
  "contact_person_number": "+1234567890",
  "address_type": "home",
  "is_scheduled": 0,
  "scheduled_timestamp": 1642233600,
  "promised_delv_tat": "24"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/orders/place" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "cart": [
      {
        "sku": 12345,
        "amount": 29.99
      },
      {
        "sku": 67890,
        "amount": 15.50
      }
    ],
    "order_amount": 45.49,
    "order_type": "delivery",
    "payment_method": "cash_on_delivery",
    "store_id": 1,
    "address": "123 Main St, City, State 12345",
    "contact_person_number": "+1234567890"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/orders/place" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "cart": [
      {
        "sku": 12345,
        "amount": 29.99
      },
      {
        "sku": 67890,
        "amount": 15.50
      }
    ],
    "order_amount": 45.49,
    "order_type": "delivery",
    "payment_method": "cash_on_delivery",
    "store_id": 1,
    "address": "123 Main St, City, State 12345",
    "contact_person_number": "+1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "user_id": 1,
      "cart": [
        {
          "sku": 12345,
          "amount": 29.99
        },
        {
          "sku": 67890,
          "amount": 15.50
        }
      ],
      "coupon_discount_amount": 0,
      "order_amount": 45.49,
      "order_type": "delivery",
      "payment_method": "cash_on_delivery",
      "store_id": 1,
      "distance": 5.2,
      "discount_amount": 0,
      "tax_amount": 2.27,
      "address": "123 Main St, City, State 12345",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "contact_person_name": "John Doe",
      "contact_person_number": "+1234567890",
      "address_type": "home",
      "is_scheduled": 0,
      "scheduled_timestamp": 1642233600,
      "promised_delv_tat": "24",
      "created_at": 1642233600
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
curl -X GET "http://localhost:3000/api/orders/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/orders/1" \
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
      "id": 1,
      "user_id": 1,
      "cart": [
        {
          "sku": 12345,
          "amount": 29.99
        },
        {
          "sku": 67890,
          "amount": 15.50
        }
      ],
      "coupon_discount_amount": 0,
      "order_amount": 45.49,
      "order_type": "delivery",
      "payment_method": "cash_on_delivery",
      "store_id": 1,
      "distance": 5.2,
      "discount_amount": 0,
      "tax_amount": 2.27,
      "address": "123 Main St, City, State 12345",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "contact_person_name": "John Doe",
      "contact_person_number": "+1234567890",
      "address_type": "home",
      "is_scheduled": 0,
      "scheduled_timestamp": 1642233600,
      "promised_delv_tat": "24",
      "created_at": 1642233600,
      "updated_at": 1642233600
    }
  }
}
```

### Get User Orders

**Endpoint:** `GET /api/orders`

**Description:** Retrieves all orders for the authenticated user with pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/orders?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/orders?page=1&limit=10" \
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
        "id": 1,
        "user_id": 1,
        "cart": [
          {
            "sku": 12345,
            "amount": 29.99
          }
        ],
        "order_amount": 29.99,
        "order_type": "delivery",
        "payment_method": "cash_on_delivery",
        "store_id": 1,
        "address": "123 Main St, City, State 12345",
        "created_at": 1642233600
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_orders": 1
    }
  }
}
```

### Update Order

**Endpoint:** `PUT /api/orders/update/:id`

**Description:** Updates an existing order (requires availability check).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "cart": [
    {
      "sku": 12345,
      "amount": 29.99
    },
    {
      "sku": 67890,
      "amount": 15.50
    }
  ],
  "coupon_code": "SAVE20",
  "order_amount": 45.49,
  "discount_amount": 5.00,
  "tax_amount": 2.27,
  "address": "456 Oak St, City, State 12345",
  "contact_person_name": "Jane Smith",
  "contact_person_number": "+1234567891"
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X PUT "http://localhost:3000/api/orders/update/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "cart": [
      {
        "sku": 12345,
        "amount": 29.99
      },
      {
        "sku": 67890,
        "amount": 15.50
      }
    ],
    "order_amount": 45.49,
    "discount_amount": 5.00,
    "address": "456 Oak St, City, State 12345"
  }'
```

**Mobile Client:**
```bash
curl -X PUT "http://localhost:3000/api/orders/update/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "cart": [
      {
        "sku": 12345,
        "amount": 29.99
      },
      {
        "sku": 67890,
        "amount": 15.50
      }
    ],
    "order_amount": 45.49,
    "discount_amount": 5.00,
    "address": "456 Oak St, City, State 12345"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "user_id": 1,
      "cart": [
        {
          "sku": 12345,
          "amount": 29.99
        },
        {
          "sku": 67890,
          "amount": 15.50
        }
      ],
      "coupon_discount_amount": 9.10,
      "order_amount": 40.39,
      "discount_amount": 5.00,
      "tax_amount": 2.27,
      "address": "456 Oak St, City, State 12345",
      "contact_person_name": "Jane Smith",
      "contact_person_number": "+1234567891",
      "updated_at": 1642233600
    },
    "updated_fields": ["cart", "order_amount", "discount_amount", "address", "contact_person_name", "contact_person_number"],
    "applied_coupon": {
      "id": 1,
      "code": "SAVE20",
      "discount": 20,
      "discount_type": "percentage",
      "calculated_discount": 9.10
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

**Unauthorized Access:**
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

**User Not Available:**
```json
{
  "success": false,
  "error": "User not available",
  "message": "User is currently off-shift or unavailable",
  "statusCode": 403
}
```

**Invalid Cart:**
```json
{
  "success": false,
  "error": "Invalid cart",
  "message": "Cart must be an array with at least one item",
  "statusCode": 400
}
```

**Invalid SKU:**
```json
{
  "success": false,
  "error": "Invalid SKU",
  "message": "Cart item 1: SKU is required and must be a number",
  "statusCode": 400
}
```

**Invalid Amount:**
```json
{
  "success": false,
  "error": "Invalid amount",
  "message": "Cart item 1: Amount is required and must be a positive number",
  "statusCode": 400
}
```

**Invalid Coupon:**
```json
{
  "success": false,
  "error": "Invalid coupon",
  "message": "Minimum purchase amount of 100 required",
  "statusCode": 400
}
```

**Order Not Found:**
```json
{
  "success": false,
  "error": "Order not found",
  "message": "Order not found",
  "statusCode": 404
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

1. **JWT Authentication**: All endpoints require valid JWT tokens
2. **Permission Validation**: `orders:view_all` permission required
3. **Availability Check**: Users must be available (not off-shift)
4. **User Isolation**: Users can only access their own orders
5. **Input Validation**: Comprehensive request validation
6. **Version Control**: Mobile app compatibility checking
7. **Audit Logging**: Track all order operations

## 📋 Operation Flow

### Order Creation Flow
1. User provides cart items and order details
2. System validates cart structure and item data
3. System applies coupon if provided
4. System calculates final order amounts
5. Order is created in database
6. Coupon usage is incremented if applied
7. Success response with order details

### Order Update Flow
1. User provides update data
2. System validates input data
3. System recalculates amounts if cart changes
4. System revalidates coupon if provided
5. Order is updated in database
6. Success response with updated order details

### Order Retrieval Flow
1. User requests order information
2. System validates user authentication
3. System checks user permissions
4. System retrieves order data
5. Success response with order details

---

This document covers all order management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.

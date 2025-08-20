# Coupon Management

This document covers all coupon management endpoints for the OZi Backend system.

**Base URL:** `http://13.232.150.239`

## 🎫 Coupon Operations

### Create New Coupon

**Endpoint:** `POST /api/v1/coupons`

**Description:** Creates a new coupon in the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "code": "SAVE20",
  "name": "20% Off Electronics",
  "description": "Get 20% off on all electronics",
  "type": "percentage",
  "value": 20,
  "minOrderAmount": 100,
  "maxDiscountAmount": 50,
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validUntil": "2024-12-31T23:59:59.000Z",
  "usageLimit": 1000,
  "perUserLimit": 1,
  "categories": ["electronics", "gadgets"],
  "excludedProducts": ["PROD-001", "PROD-002"],
  "isActive": true
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/coupons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "code": "SAVE20",
    "name": "20% Off Electronics",
    "description": "Get 20% off on all electronics",
    "type": "percentage",
    "value": 20,
    "minOrderAmount": 100,
    "maxDiscountAmount": 50,
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-12-31T23:59:59.000Z",
    "usageLimit": 1000,
    "perUserLimit": 1,
    "categories": ["electronics", "gadgets"],
    "excludedProducts": ["PROD-001", "PROD-002"],
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "coupon": {
      "id": "CPN001",
      "code": "SAVE20",
      "type": "percentage",
      "value": 20,
      "minOrderAmount": 100.00,
      "maxDiscountAmount": 50.00,
      "validFrom": "2024-01-15T00:00:00.000Z",
      "validUntil": "2024-02-15T23:59:59.000Z",
      "maxUsage": 1000,
      "currentUsage": 0,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get All Coupons

**Endpoint:** `GET /api/v1/coupons`

**Description:** Retrieves all coupons with filtering and pagination.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `status` (optional): Filter by status (active, inactive, expired)
- `type` (optional): Filter by type (percentage, fixed, free_shipping)
- `isActive` (optional): Filter by active status (true, false)
- `validFrom` (optional): Filter by validity start date
- `validUntil` (optional): Filter by validity end date

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/coupons?page=1&limit=10&status=active&type=percentage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "CPN001",
        "code": "SAVE20",
        "type": "percentage",
        "value": 20,
        "minOrderAmount": 100.00,
        "maxDiscountAmount": 50.00,
        "validFrom": "2024-01-15T00:00:00.000Z",
        "validUntil": "2024-02-15T23:59:59.000Z",
        "maxUsage": 1000,
        "currentUsage": 0,
        "isActive": true,
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

### Get Coupon by ID

**Endpoint:** `GET /api/v1/coupons/:id`

**Description:** Retrieves a specific coupon by its ID.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/coupons/CPN001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coupon": {
      "id": "CPN001",
      "code": "SAVE20",
      "type": "percentage",
      "value": 20,
      "minOrderAmount": 100.00,
      "maxDiscountAmount": 50.00,
      "validFrom": "2024-01-15T00:00:00.000Z",
      "validUntil": "2024-02-15T23:59:59.000Z",
      "maxUsage": 1000,
      "currentUsage": 0,
      "maxUsagePerUser": 1,
      "applicableProducts": ["PROD001", "PROD002"],
      "excludedProducts": ["PROD003"],
      "applicableCategories": ["electronics", "accessories"],
      "excludedCategories": ["sale"],
      "customerGroups": ["vip", "regular"],
      "description": "Save 20% on your order",
      "terms": "Valid on orders above $100. Maximum discount $50.",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update Coupon

**Endpoint:** `PUT /api/v1/coupons/:id`

**Description:** Updates an existing coupon.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "value": 25,
  "maxDiscountAmount": 75.00,
  "validUntil": "2024-03-15T23:59:59.000Z",
  "maxUsage": 1500,
  "description": "Save 25% on your order - Extended validity!",
  "terms": "Valid on orders above $100. Maximum discount $75. Extended until March 15th."
}
```

**cURL Example:**
```bash
curl -X PUT "http://13.232.150.239/api/v1/coupons/CPN001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "value": 25,
    "maxDiscountAmount": 75.00,
    "validUntil": "2024-03-15T23:59:59.000Z",
    "maxUsage": 1500,
    "description": "Save 25% on your order - Extended validity!",
    "terms": "Valid on orders above $100. Maximum discount $75. Extended until March 15th."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon updated successfully",
  "data": {
    "coupon": {
      "id": "CPN001",
      "value": 25,
      "maxDiscountAmount": 75.00,
      "validUntil": "2024-03-15T23:59:59.000Z",
      "maxUsage": 1500,
      "description": "Save 25% on your order - Extended validity!",
      "terms": "Valid on orders above $100. Maximum discount $75. Extended until March 15th.",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Delete Coupon

**Endpoint:** `DELETE /api/v1/coupons/:id`

**Description:** Deletes a coupon from the system.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X DELETE "http://13.232.150.239/api/v1/coupons/CPN001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon deleted successfully"
}
```

### Activate/Deactivate Coupon

**Endpoint:** `PATCH /api/v1/coupons/:id/status`

**Description:** Changes the status of a coupon (active/inactive).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Temporarily disabled due to system maintenance"
}
```

**cURL Example:**
```bash
curl -X PATCH "http://13.232.150.239/api/v1/coupons/CPN001/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "isActive": false,
    "reason": "Temporarily disabled due to system maintenance"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon status updated successfully",
  "data": {
    "coupon": {
      "id": "CPN001",
      "isActive": false,
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

## 🎯 Coupon Validation

### Validate Coupon Code

**Endpoint:** `POST /api/v1/coupons/validate`

**Description:** Validates a coupon code for a specific order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "code": "SAVE20",
  "orderAmount": 150.00,
  "customerId": "CUST001",
  "products": [
    {
      "productId": "PROD001",
      "category": "electronics",
      "price": 150.00
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/coupons/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "code": "SAVE20",
    "orderAmount": 150.00,
    "customerId": "CUST001",
    "products": [
      {
        "productId": "PROD001",
        "category": "electronics",
        "price": 150.00
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": {
      "id": "CPN001",
      "code": "SAVE20",
      "type": "percentage",
      "value": 20,
      "description": "Save 20% on your order"
    },
    "discount": {
      "amount": 30.00,
      "percentage": 20,
      "finalAmount": 120.00
    },
    "message": "Coupon applied successfully! You saved $30.00"
  }
}
```

### Apply Coupon to Order

**Endpoint:** `POST /api/v1/coupons/:id/apply`

**Description:** Applies a coupon to a specific order.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "orderId": "ORD-2024-001",
  "customerId": "CUST001",
  "orderAmount": 150.00
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/coupons/CPN001/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "orderId": "ORD-2024-001",
    "customerId": "CUST001",
    "orderAmount": 150.00
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "application": {
      "id": "APP001",
      "couponId": "CPN001",
      "orderId": "ORD-2024-001",
      "customerId": "CUST001",
      "discountAmount": 30.00,
      "finalAmount": 120.00,
      "appliedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

## 🌍 Multi-Language Support

### Create Coupon Translation

**Endpoint:** `POST /api/v1/coupons/:id/translations`

**Description:** Creates a translation for a coupon in a specific language.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "language": "es",
  "description": "Ahorra 20% en tu pedido",
  "terms": "Válido en pedidos superiores a $100. Descuento máximo $50."
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/coupons/CPN001/translations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "language": "es",
    "description": "Ahorra 20% en tu pedido",
    "terms": "Válido en pedidos superiores a $100. Descuento máximo $50."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon translation created successfully",
  "data": {
    "translation": {
      "id": "TRN001",
      "couponId": "CPN001",
      "language": "es",
      "description": "Ahorra 20% en tu pedido",
      "terms": "Válido en pedidos superiores a $100. Descuento máximo $50.",
      "createdAt": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

### Get Coupon Translations

**Endpoint:** `GET /api/v1/coupons/:id/translations`

**Description:** Retrieves all translations for a specific coupon.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/coupons/CPN001/translations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "couponId": "CPN001",
    "translations": [
      {
        "id": "TRN001",
        "language": "es",
        "description": "Ahorra 20% en tu pedido",
        "terms": "Válido en pedidos superiores a $100. Descuento máximo $50.",
        "createdAt": "2024-01-15T12:30:00.000Z"
      },
      {
        "id": "TRN002",
        "language": "fr",
        "description": "Économisez 20% sur votre commande",
        "terms": "Valide sur les commandes supérieures à 100$. Remise maximale 50$.",
        "createdAt": "2024-01-15T13:00:00.000Z"
      }
    ]
  }
}
```

## 📊 Coupon Analytics

### Get Coupon Statistics

**Endpoint:** `GET /api/v1/coupons/statistics`

**Description:** Retrieves statistics about coupons.

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
curl -X GET "http://13.232.150.239/api/v1/coupons/statistics?dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCoupons": 25,
    "activeCoupons": 20,
    "expiredCoupons": 3,
    "inactiveCoupons": 2,
    "totalUsage": 1500,
    "totalDiscount": 25000.00,
    "averageDiscount": 16.67,
    "typeDistribution": [
      {
        "type": "percentage",
        "count": 15,
        "percentage": 60.0
      },
      {
        "type": "fixed",
        "count": 8,
        "percentage": 32.0
      }
    ],
    "topPerformingCoupons": [
      {
        "code": "SAVE20",
        "usage": 500,
        "totalDiscount": 10000.00
      }
    ]
  }
}
```

### Get Coupon Usage Report

**Endpoint:** `GET /api/v1/coupons/usage-report`

**Description:** Generates a detailed report of coupon usage.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `format` (optional): Report format (json, csv, pdf)
- `dateFrom` (optional): Start date for the report
- `dateTo` (optional): End date for the report
- `couponId` (optional): Specific coupon ID for detailed report

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/coupons/usage-report?format=json&dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔍 Coupon Search and Filtering

### Search Coupons

**Endpoint:** `GET /api/v1/coupons/search`

**Description:** Advanced search for coupons with multiple criteria.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `q` (required): Search query
- `type` (optional): Filter by type
- `status` (optional): Filter by status
- `minValue` (optional): Filter by minimum value
- `maxValue` (optional): Filter by maximum value
- `customerGroup` (optional): Filter by customer group

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/coupons/search?q=SAVE&type=percentage&status=active&minValue=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### Get Coupons by Category

**Endpoint:** `GET /api/v1/coupons/category/:categoryName`

**Description:** Retrieves all coupons applicable to a specific category.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/coupons/category/electronics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

## 🔄 Bulk Coupon Operations

### Bulk Create Coupons

**Endpoint:** `POST /api/v1/coupons/bulk`

**Description:** Creates multiple coupons at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "coupons": [
    {
      "code": "SAVE10",
      "type": "percentage",
      "value": 10,
      "minOrderAmount": 50.00,
      "validFrom": "2024-01-15T00:00:00.000Z",
      "validUntil": "2024-02-15T23:59:59.000Z"
    },
    {
      "code": "FREESHIP",
      "type": "free_shipping",
      "minOrderAmount": 100.00,
      "validFrom": "2024-01-15T00:00:00.000Z",
      "validUntil": "2024-02-15T23:59:59.000Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/coupons/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "coupons": [
      {
        "code": "SAVE10",
        "type": "percentage",
        "value": 10,
        "minOrderAmount": 50.00,
        "validFrom": "2024-01-15T00:00:00.000Z",
        "validUntil": "2024-02-15T23:59:59.000Z"
      },
      {
        "code": "FREESHIP",
        "type": "free_shipping",
        "minOrderAmount": 100.00,
        "validFrom": "2024-01-15T00:00:00.000Z",
        "validUntil": "2024-02-15T23:59:59.000Z"
      }
    ]
  }'
```

### Bulk Update Coupon Status

**Endpoint:** `PUT /api/v1/coupons/bulk/status`

**Description:** Updates the status of multiple coupons at once.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "coupons": [
    {
      "id": "CPN001",
      "isActive": false
    },
    {
      "id": "CPN002",
      "isActive": false
    }
  ],
  "reason": "Seasonal campaign ended"
}
```

**cURL Example:**
```bash
curl -X PUT "http://13.232.150.239/api/v1/coupons/bulk/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "coupons": [
      {
        "id": "CPN001",
        "isActive": false
      },
      {
        "id": "CPN002",
        "isActive": false
      }
    ],
    "reason": "Seasonal campaign ended"
  }'
```

## 🎁 Coupon Templates

### Get Coupon Templates

**Endpoint:** `GET /api/v1/coupons/templates`

**Description:** Retrieves predefined coupon templates for common use cases.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**cURL Example:**
```bash
curl -X GET "http://13.232.150.239/api/v1/coupons/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "name": "Welcome Discount",
        "description": "10% off for new customers",
        "type": "percentage",
        "value": 10,
        "minOrderAmount": 25.00,
        "maxUsage": 1000,
        "validityDays": 30
      },
      {
        "name": "Free Shipping",
        "description": "Free shipping on orders above $100",
        "type": "free_shipping",
        "minOrderAmount": 100.00,
        "maxUsage": 500,
        "validityDays": 60
      },
      {
        "name": "Flash Sale",
        "description": "20% off for limited time",
        "type": "percentage",
        "value": 20,
        "minOrderAmount": 50.00,
        "maxUsage": 200,
        "validityDays": 7
      }
    ]
  }
}
```

### Apply Coupon Template

**Endpoint:** `POST /api/v1/coupons/templates/:templateName/apply`

**Description:** Applies a coupon template to create a new coupon.

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "customize": true,
  "customCode": "WELCOME2024",
  "customValue": 15,
  "customMinOrderAmount": 30.00,
  "customMaxUsage": 500
}
```

**cURL Example:**
```bash
curl -X POST "http://13.232.150.239/api/v1/coupons/templates/Welcome%20Discount/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "customize": true,
    "customCode": "WELCOME2024",
    "customValue": 15,
    "customMinOrderAmount": 30.00,
    "customMaxUsage": 500
  }'
```
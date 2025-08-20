# Coupon Management

This module handles coupon validation and application during POS operations. Users need `pos:execute` permission to access these endpoints.

## Apply Coupon

### Apply Coupon to Order
Apply a coupon code to an order to get discounts.

**Endpoint:** `GET /api/coupon/apply`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `code` (required): Coupon code to apply
- `orderId` (required): ID of the order
- `amount` (required): Order subtotal amount

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/coupon/apply?code=SAVE20&orderId=ORD-2024-001&amount=124.76" \
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
    "couponCode": "SAVE20",
    "couponType": "percentage",
    "discountValue": 20,
    "discountAmount": 24.95,
    "minimumOrderAmount": 50.00,
    "maximumDiscount": 50.00,
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-12-31T23:59:59.000Z",
    "usageLimit": 1000,
    "usedCount": 45,
    "remainingUses": 955,
    "applicable": true,
    "message": "Coupon applied successfully",
    "orderSummary": {
      "subtotal": 124.76,
      "discount": 24.95,
      "finalAmount": 99.81
    }
  },
  "error": null
}
```

## Validate Coupon

### Validate Coupon Code
Validate a coupon code before applying it to an order.

**Endpoint:** `POST /api/coupon/validate`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "SAVE20",
  "orderAmount": 124.76,
  "customerId": "CUST-001",
  "items": [
    {
      "sku": "PROD-001",
      "category": "electronics"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/coupon/validate" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "orderAmount": 124.76,
    "customerId": "CUST-001",
    "items": [
      {
        "sku": "PROD-001",
        "category": "electronics"
      }
    ]
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "couponCode": "SAVE20",
    "validation": {
      "isValid": true,
      "isExpired": false,
      "isActive": true,
      "usageLimitReached": false,
      "minimumOrderMet": true,
      "categoryRestrictions": [],
      "customerRestrictions": [],
      "timeRestrictions": []
    },
    "couponDetails": {
      "type": "percentage",
      "value": 20,
      "description": "Save 20% on your order",
      "terms": "Valid on orders over $50, maximum discount $50",
      "validFrom": "2024-01-01T00:00:00.000Z",
      "validUntil": "2024-12-31T23:59:59.000Z"
    },
    "applicability": {
      "canApply": true,
      "reason": "Coupon is valid and applicable",
      "estimatedDiscount": 24.95
    }
  },
  "error": null
}
```

## Coupon Types

### Available Coupon Types
The system supports various coupon types:

#### 1. Percentage Discount
- **Type**: `percentage`
- **Example**: 20% off
- **Format**: `{"type": "percentage", "value": 20}`
- **Calculation**: `discount = orderAmount * (value / 100)`

#### 2. Fixed Amount Discount
- **Type**: `fixed`
- **Example**: $10 off
- **Format**: `{"type": "fixed", "value": 10.00}`
- **Calculation**: `discount = value`

#### 3. Buy One Get One
- **Type**: `bogo`
- **Example**: Buy 1, Get 1 Free
- **Format**: `{"type": "bogo", "value": 1}`
- **Calculation**: Free item of equal or lesser value

#### 4. Free Shipping
- **Type**: `shipping`
- **Example**: Free shipping on orders over $100
- **Format**: `{"type": "shipping", "value": 0}`
- **Calculation**: Shipping cost deducted

## Coupon Application Examples

### 1. Percentage Discount Coupon
```bash
curl -X GET "http://localhost:3000/api/coupon/apply?code=WELCOME15&orderId=ORD-2024-001&amount=89.99" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "couponCode": "WELCOME15",
    "couponType": "percentage",
    "discountValue": 15,
    "discountAmount": 13.50,
    "minimumOrderAmount": 25.00,
    "maximumDiscount": 25.00,
    "applicable": true,
    "message": "Welcome discount applied",
    "orderSummary": {
      "subtotal": 89.99,
      "discount": 13.50,
      "finalAmount": 76.49
    }
  },
  "error": null
}
```

### 2. Fixed Amount Coupon
```bash
curl -X GET "http://localhost:3000/api/coupon/apply?code=SAVE10&orderId=ORD-2024-002&amount=45.99" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "couponCode": "SAVE10",
    "couponType": "fixed",
    "discountValue": 10.00,
    "discountAmount": 10.00,
    "minimumOrderAmount": 30.00,
    "maximumDiscount": 10.00,
    "applicable": true,
    "message": "Fixed discount applied",
    "orderSummary": {
      "subtotal": 45.99,
      "discount": 10.00,
      "finalAmount": 35.99
    }
  },
  "error": null
}
```

### 3. Free Shipping Coupon
```bash
curl -X GET "http://localhost:3000/api/coupon/apply?code=FREESHIP&orderId=ORD-2024-003&amount=125.00" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "couponCode": "FREESHIP",
    "couponType": "shipping",
    "discountValue": 0,
    "discountAmount": 5.99,
    "minimumOrderAmount": 100.00,
    "maximumDiscount": 15.00,
    "applicable": true,
    "message": "Free shipping applied",
    "orderSummary": {
      "subtotal": 125.00,
      "shipping": 0.00,
      "discount": 5.99,
      "finalAmount": 125.00
    }
  },
  "error": null
}
```

## Coupon Validation Examples

### 1. Validate Expired Coupon
```bash
curl -X POST "http://localhost:3000/api/coupon/validate" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "EXPIRED50",
    "orderAmount": 75.00,
    "customerId": "CUST-001"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "couponCode": "EXPIRED50",
    "validation": {
      "isValid": false,
      "isExpired": true,
      "isActive": false,
      "usageLimitReached": false,
      "minimumOrderMet": true,
      "categoryRestrictions": [],
      "customerRestrictions": [],
      "timeRestrictions": ["Coupon expired on 2023-12-31"]
    },
    "couponDetails": {
      "type": "percentage",
      "value": 50,
      "description": "50% off expired coupon",
      "validFrom": "2023-01-01T00:00:00.000Z",
      "validUntil": "2023-12-31T23:59:59.000Z"
    },
    "applicability": {
      "canApply": false,
      "reason": "Coupon has expired",
      "estimatedDiscount": 0
    }
  },
  "error": null
}
```

### 2. Validate Usage Limit Reached
```bash
curl -X POST "http://localhost:3000/api/coupon/validate" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LIMITED25",
    "orderAmount": 60.00,
    "customerId": "CUST-001"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "couponCode": "LIMITED25",
    "validation": {
      "isValid": false,
      "isExpired": false,
      "isActive": true,
      "usageLimitReached": true,
      "minimumOrderMet": true,
      "categoryRestrictions": [],
      "customerRestrictions": [],
      "timeRestrictions": []
    },
    "couponDetails": {
      "type": "percentage",
      "value": 25,
      "description": "25% off limited use",
      "usageLimit": 100,
      "usedCount": 100,
      "remainingUses": 0
    },
    "applicability": {
      "canApply": false,
      "reason": "Usage limit reached",
      "estimatedDiscount": 0
    }
  },
  "error": null
}
```

### 3. Validate Minimum Order Not Met
```bash
curl -X POST "http://localhost:3000/api/coupon/validate" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MIN100",
    "orderAmount": 75.00,
    "customerId": "CUST-001"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "couponCode": "MIN100",
    "validation": {
      "isValid": false,
      "isExpired": false,
      "isActive": true,
      "usageLimitReached": false,
      "minimumOrderMet": false,
      "categoryRestrictions": [],
      "customerRestrictions": [],
      "timeRestrictions": []
    },
    "couponDetails": {
      "type": "fixed",
      "value": 20.00,
      "description": "$20 off orders over $100",
      "minimumOrderAmount": 100.00
    },
    "applicability": {
      "canApply": false,
      "reason": "Minimum order amount not met. Need $25.00 more",
      "estimatedDiscount": 0
    }
  },
  "error": null
}
```

## Coupon Restrictions

### Common Restriction Types

#### 1. Category Restrictions
- **Product Categories**: Electronics, Clothing, Books
- **Brand Restrictions**: Specific brand exclusions
- **Seasonal Restrictions**: Holiday-specific coupons

#### 2. Customer Restrictions
- **New Customers Only**: First-time buyers
- **VIP Customers**: Premium customer segments
- **Geographic Restrictions**: Location-based coupons

#### 3. Time Restrictions
- **Business Hours**: Specific time windows
- **Day of Week**: Weekend-only coupons
- **Seasonal**: Holiday or event-specific

#### 4. Usage Restrictions
- **One-time Use**: Single use per customer
- **Daily Limits**: Maximum uses per day
- **Total Limits**: Overall usage cap

## Error Responses

### Invalid Coupon Code
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid coupon code"
}
```

### Coupon Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Coupon not found"
}
```

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions. Required: pos:execute"
}
```

### Coupon Already Applied
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Coupon already applied to this order"
}
```

### Coupon Not Applicable
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Coupon not applicable to this order"
}
```

## Best Practices

### Coupon Application
- Validate coupons before applying
- Check all restrictions and conditions
- Calculate discounts accurately
- Provide clear feedback to users

### Coupon Management
- Set appropriate usage limits
- Monitor coupon performance
- Prevent coupon abuse
- Regular coupon audits

### Customer Experience
- Clear coupon terms and conditions
- Easy coupon application process
- Transparent discount calculations
- Handle errors gracefully

## Mobile App Integration

### Coupon Display
- Show available coupons clearly
- Display discount amounts prominently
- Indicate coupon restrictions
- Provide application status

### Coupon Application
- Validate coupons in real-time
- Show discount calculations
- Handle multiple coupons
- Provide clear feedback

### Offline Handling
- Cache coupon information
- Queue coupon applications
- Sync when online
- Handle validation errors

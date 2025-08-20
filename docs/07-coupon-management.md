# Coupon Management Module

This document covers all coupon management endpoints for the OZi Backend system.

**Base URL:** `http://localhost:3000`

## Overview

The coupon management module provides functionality for applying and validating coupons during order processing. It supports various coupon types and validation rules.

## 🎫 Coupon Operations

### Apply Coupon

**Endpoint:** `GET /api/coupons/apply`

**Description:** Applies a coupon code to an order (requires POS execution permission).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Query Parameters:**
- `coupon_code` (required): The coupon code to apply
- `order_amount` (required): The total order amount before discount
- `user_id` (optional): User ID for user-specific coupons

**cURL Examples:**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/coupons/apply?coupon_code=SAVE20&order_amount=100.00&user_id=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/coupons/apply?coupon_code=SAVE20&order_amount=100.00&user_id=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "coupon_code": "SAVE20",
    "discount_amount": 20.00,
    "discount_percentage": 20,
    "final_amount": 80.00,
    "coupon_type": "PERCENTAGE",
    "valid_until": "2024-12-31T23:59:59.000Z",
    "minimum_order_amount": 50.00,
    "maximum_discount": 50.00,
    "usage_limit": 100,
    "used_count": 45
  },
  "error": null
}
```

### Validate Coupon

**Endpoint:** `POST /api/coupons/validate`

**Description:** Validates a coupon code without applying it (requires POS execution permission).

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "coupon_code": "SAVE20",
  "order_amount": 100.00,
  "user_id": 1,
  "items": [
    {
      "sku": "PROD001",
      "amount": 50.00,
      "category": "electronics"
    },
    {
      "sku": "PROD002",
      "amount": 50.00,
      "category": "clothing"
    }
  ]
}
```

**cURL Examples:**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "coupon_code": "SAVE20",
    "order_amount": 100.00,
    "user_id": 1,
    "items": [
      {
        "sku": "PROD001",
        "amount": 50.00,
        "category": "electronics"
      },
      {
        "sku": "PROD002",
        "amount": 50.00,
        "category": "clothing"
      }
    ]
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.2.0" \
  -d '{
    "coupon_code": "SAVE20",
    "order_amount": 100.00,
    "user_id": 1,
    "items": [
      {
        "sku": "PROD001",
        "amount": 50.00,
        "category": "electronics"
      },
      {
        "sku": "PROD002",
        "amount": 50.00,
        "category": "clothing"
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
    "is_valid": true,
    "coupon_code": "SAVE20",
    "discount_amount": 20.00,
    "discount_percentage": 20,
    "final_amount": 80.00,
    "coupon_type": "PERCENTAGE",
    "valid_until": "2024-12-31T23:59:59.000Z",
    "minimum_order_amount": 50.00,
    "maximum_discount": 50.00,
    "usage_limit": 100,
    "used_count": 45,
    "validation_message": "Coupon applied successfully",
    "restrictions": {
      "categories": ["electronics", "clothing"],
      "excluded_products": [],
      "user_groups": ["all"]
    }
  },
  "error": null
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
  "statusCode": 401,
  "success": false,
  "error": "User not authenticated"
}
```

**Insufficient Permissions:**
```json
{
  "statusCode": 403,
  "success": false,
  "error": "Insufficient permissions"
}
```

**Coupon Not Found:**
```json
{
  "statusCode": 404,
  "success": false,
  "error": "Coupon not found"
}
```

**Coupon Expired:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Coupon has expired"
}
```

**Coupon Usage Limit Exceeded:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Coupon usage limit exceeded"
}
```

**Order Amount Too Low:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Order amount does not meet minimum requirement"
}
```

**Coupon Already Used:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Coupon has already been used by this user"
}
```

**Invalid Coupon Code:**
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Invalid coupon code format"
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
2. **Permission-Based Access**: Only users with `pos:execute` permission can access these endpoints
3. **Input Validation**: Comprehensive request validation
4. **Version Control**: Mobile app compatibility checking
5. **Audit Logging**: Track all coupon operations

## 📋 Operation Flow

### Coupon Application Flow
1. User provides coupon code and order details
2. System validates coupon exists and is active
3. System checks coupon validity (expiry, usage limits, etc.)
4. System applies discount based on coupon rules
5. Success response with discount details

### Coupon Validation Flow
1. User provides coupon code and order details
2. System validates coupon exists and is active
3. System checks all validation rules
4. System returns validation result with detailed information
5. Success response with validation details

## 📚 Coupon Types and Rules

### Coupon Types
- **PERCENTAGE**: Percentage-based discount (e.g., 20% off)
- **FIXED_AMOUNT**: Fixed amount discount (e.g., $10 off)
- **FREE_SHIPPING**: Free shipping on orders
- **BUY_ONE_GET_ONE**: Buy one, get one free offers

### Validation Rules
- **Expiry Date**: Coupon must be within valid date range
- **Usage Limits**: Maximum number of times coupon can be used
- **Minimum Order Amount**: Order must meet minimum value requirement
- **Maximum Discount**: Cap on maximum discount amount
- **User Restrictions**: Specific user groups or individual users
- **Category Restrictions**: Applicable product categories
- **Product Exclusions**: Products not eligible for discount

### Coupon Restrictions
- **Geographic**: Location-based restrictions
- **Time-based**: Time of day or day of week restrictions
- **First-time Users**: New customer only offers
- **Loyalty**: Customer loyalty tier requirements

---

This document covers all coupon management endpoints with examples for both web and mobile clients. Mobile clients must include version headers for compatibility checking. All endpoints are verified against the actual controller code and will work correctly with localhost:3000.
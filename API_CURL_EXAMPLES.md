# Product Master API - cURL Examples

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 1. Create New Product

### Endpoint
```
POST /api/products
```

### cURL Example
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "color": "Red",
    "age_size": "0-6 months",
    "name": "Premium Baby Formula",
    "category": "Baby Food",
    "description": "High-quality baby formula for infants aged 0-6 months",
    "mrp": 299.99,
    "brand_id": 1,
    "gst": 18.0,
    "cess": 0.0,
    "hsn": "19011090",
    "image_url": "https://example.com/baby-formula.jpg",
    "ean_upc": "1234567890123",
    "weight": 400.0,
    "length": 22.0,
    "height": 5.0,
    "width": 16.0,
    "inventory_threshold": 10
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "catelogue_id": "4000001",
    "product_id": "400000101",
    "sku_id": "400000101001",
    "name": "Premium Baby Formula",
    "color": "Red",
    "age_size": "0-6 months",
    "category": "Baby Food",
    "mrp": 299.99,
    "brand_id": 1,
    "created_at": "2025-01-18T10:30:00.000Z"
  }
}
```

### Minimal Required Fields Example
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "color": "Blue",
    "age_size": "6-12 months",
    "name": "Basic Baby Formula",
    "category": "Baby Food",
    "description": "Basic baby formula for older infants",
    "mrp": 199.99,
    "brand_id": 1,
    "gst": 18.0,
    "cess": 0.0,
    "hsn": "19011090"
  }'
```

---

## 2. Update Product

### Endpoint
```
PUT /api/products/:skuId
```

### cURL Example
```bash
curl -X PUT http://localhost:3000/api/products/400000101001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mrp": 319.99,
    "description": "Updated description with new features",
    "weight": 450.0,
    "inventory_threshold": 15
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "catelogue_id": "4000001",
    "product_id": "400000101",
    "sku_id": "400000101001",
    "name": "Premium Baby Formula",
    "color": "Red",
    "age_size": "0-6 months",
    "category": "Baby Food",
    "mrp": 319.99,
    "brand_id": 1,
    "updated_at": "2025-01-18T11:00:00.000Z"
  }
}
```

### Update Only Price
```bash
curl -X PUT http://localhost:3000/api/products/400000101001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mrp": 349.99
  }'
```

---

## 3. Get Product by SKU ID

### Endpoint
```
GET /api/products/:skuId
```

### cURL Example
```bash
curl -X GET http://localhost:3000/api/products/400000101001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": 1,
    "catelogue_id": "4000001",
    "product_id": "400000101",
    "sku_id": "400000101001",
    "color": "Red",
    "age_size": "0-6 months",
    "name": "Premium Baby Formula",
    "category": "Baby Food",
    "description": "High-quality baby formula for infants aged 0-6 months",
    "image_url": "https://example.com/baby-formula.jpg",
    "mrp": 299.99,
    "avg_cost_to_ozi": 0.00,
    "ean_upc": "1234567890123",
    "brand_id": 1,
    "weight": 400.0,
    "length": 22.0,
    "height": 5.0,
    "width": 16.0,
    "inventory_threshold": 10,
    "gst": 18.0,
    "cess": 0.0,
    "hsn": "19011090",
    "created_by": 1,
    "created_at": "2025-01-18T10:30:00.000Z",
    "updated_at": "2025-01-18T10:30:00.000Z",
    "logs": [
      {
        "action": "CREATE",
        "timestamp": "2025-01-18T10:30:00.000Z",
        "user_id": 1,
        "changes": {
          "created": { /* original product data */ }
        }
      }
    ]
  }
}
```

---

## 4. Get Products by Catalogue ID

### Endpoint
```
GET /api/products/catalogue/:catalogueId
```

### cURL Example
```bash
curl -X GET http://localhost:3000/api/products/catalogue/4000001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "catelogue_id": "4000001",
      "product_id": "400000101",
      "sku_id": "400000101001",
      "color": "Red",
      "age_size": "0-6 months",
      "name": "Premium Baby Formula",
      "category": "Baby Food",
      "mrp": 299.99
    },
    {
      "id": 2,
      "catelogue_id": "4000001",
      "product_id": "400000101",
      "sku_id": "400000101002",
      "color": "Red",
      "age_size": "6-12 months",
      "name": "Premium Baby Formula",
      "category": "Baby Food",
      "mrp": 299.99
    }
  ]
}
```

---

## 5. Get All Products (Paginated)

### Endpoint
```
GET /api/products
```

### Basic Pagination
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### With Filters
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10&category=Baby%20Food&color=Red&status=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Multiple Filters
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=5&category=Baby%20Food&brand_id=1&age_size=0-6%20months" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "catelogue_id": "4000001",
        "product_id": "400000101",
        "sku_id": "400000101001",
        "color": "Red",
        "age_size": "0-6 months",
        "name": "Premium Baby Formula",
        "category": "Baby Food",
        "mrp": 299.99,
        "brand_id": 1,
        "created_at": "2025-01-18T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Available Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (0 or 1)
- `category` - Filter by category
- `brand_id` - Filter by brand ID
- `color` - Filter by color
- `age_size` - Filter by age/size

---

## 6. Update Average Cost

### Endpoint
```
PATCH /api/products/:skuId/avg-cost
```

### cURL Example
```bash
curl -X PATCH http://localhost:3000/api/products/400000101001/avg-cost \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "avg_cost_to_ozi": 250.00
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Average cost updated successfully",
  "data": {
    "sku_id": "400000101001",
    "avg_cost_to_ozi": 250.00,
    "updated_at": "2025-01-18T11:30:00.000Z"
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Missing mandatory fields",
  "missingFields": ["color", "age_size", "name"]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Product not found"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to create product",
  "error": "Database connection error"
}
```

---

## Testing Script

### Create a test script to run all endpoints:
```bash
#!/bin/bash

# Set your JWT token
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"
BASE_URL="http://localhost:3000/api"

echo "🧪 Testing Product Master API..."

# 1. Create Product
echo "📋 Creating product..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "color": "Red",
    "age_size": "0-6 months",
    "name": "Test Baby Formula",
    "category": "Baby Food",
    "description": "Test product",
    "mrp": 299.99,
    "brand_id": 1,
    "gst": 18.0,
    "cess": 0.0,
    "hsn": "19011090"
  }')

echo "Create Response: $CREATE_RESPONSE"

# Extract SKU ID from response (you might need to parse JSON)
SKU_ID="400000101001"

# 2. Get Product
echo "📋 Getting product..."
curl -s -X GET $BASE_URL/products/$SKU_ID \
  -H "Authorization: Bearer $JWT_TOKEN"

# 3. Update Product
echo "📋 Updating product..."
curl -s -X PUT $BASE_URL/products/$SKU_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"mrp": 319.99}'

# 4. Update Average Cost
echo "📋 Updating average cost..."
curl -s -X PATCH $BASE_URL/products/$SKU_ID/avg-cost \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"avg_cost_to_ozi": 250.00}'

# 5. Get All Products
echo "📋 Getting all products..."
curl -s -X GET "$BASE_URL/products?page=1&limit=5" \
  -H "Authorization: Bearer $JWT_TOKEN"

echo "✅ API testing completed!"
```

---

## Notes

1. **Authentication**: All endpoints require a valid JWT token
2. **Content-Type**: Use `application/json` for POST, PUT, and PATCH requests
3. **URL Encoding**: Encode special characters in query parameters (e.g., spaces as `%20`)
4. **Error Handling**: Always check the `success` field in responses
5. **Pagination**: Use `page` and `limit` parameters for large datasets
6. **Logging**: All updates are automatically logged in the `logs` field
7. **ID Generation**: Catalogue, Product, and SKU IDs are auto-generated based on your logic

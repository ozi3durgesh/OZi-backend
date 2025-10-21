# New Product Master System

## Overview

The new Product Master system provides a comprehensive solution for managing products with automatic ID generation, detailed logging, and flexible categorization based on color and age/size combinations.

## Table Structure

### Fields

#### Mandatory Fields
- `color` (VARCHAR(100)) - Product color
- `age_size` (VARCHAR(100)) - Age range or size specification
- `name` (VARCHAR(255)) - Product name
- `category` (VARCHAR(255)) - Product category
- `description` (TEXT) - Product description
- `mrp` (DECIMAL(10,2)) - Maximum Retail Price
- `brand_id` (INT) - Reference to brands table
- `gst` (DECIMAL(5,2)) - GST percentage (0-100)
- `cess` (DECIMAL(5,2)) - CESS percentage (0-100)
- `hsn` (VARCHAR(8)) - HSN code (4-8 digits)
- `status` (INT) - Product status (0=inactive, 1=active)

#### Optional Fields
- `image_url` (TEXT) - Product image URL
- `ean_upc` (VARCHAR(14)) - EAN/UPC code (8-14 digits)
- `weight` (DECIMAL(10,2)) - Product weight
- `length` (DECIMAL(10,2)) - Product length
- `height` (DECIMAL(10,2)) - Product height
- `width` (DECIMAL(10,2)) - Product width
- `inventory_threshold` (INT) - Inventory threshold

#### Auto-Generated Fields
- `id` (INT) - Auto-increment primary key
- `catelogue_id` (VARCHAR(7)) - 7-character catalogue ID starting from 4000001
- `product_id` (VARCHAR(9)) - 9-character product ID (catalogue_id + 2 digits for colors)
- `sku_id` (VARCHAR(12)) - 12-character SKU ID (product_id + 3 digits for age_size)
- `avg_cost_to_ozi` (DECIMAL(10,2)) - Average cost to OZI (updated via PO pricing)
- `created_by` (INT) - User ID who created the product
- `created_at` (DATETIME) - Creation timestamp
- `updated_at` (DATETIME) - Last update timestamp
- `logs` (JSON) - Edit history log

## ID Generation Logic

### Catalogue ID (7 characters)
- Format: `4XXXXXX` (starts with 4, followed by 6 digits)
- Starting value: `4000001`
- Auto-increments for each new product

### Product ID (9 characters)
- Format: `{catalogue_id}{XX}` (catalogue_id + 2 digits for color variants)
- Example: `400000101`, `400000102`, `400000103`
- Increments for each color variant of the same base product

### SKU ID (12 characters)
- Format: `{product_id}{XXX}` (product_id + 3 digits for age/size variants)
- Example: `400000101001`, `400000101002`, `400000101003`
- Increments for each age/size variant of the same product

## API Endpoints

### Create Product
```
POST /api/products
```

**Request Body:**
```json
{
  "color": "Red",
  "age_size": "0-6 months",
  "name": "Baby Formula",
  "category": "Baby Food",
  "description": "Premium baby formula",
  "mrp": 299.99,
  "brand_id": 1,
  "gst": 18.0,
  "cess": 0.0,
  "hsn": "19011090",
  "image_url": "https://example.com/image.jpg",
  "ean_upc": "1234567890123",
  "weight": 400.0,
  "length": 22.0,
  "height": 5.0,
  "width": 16.0,
  "inventory_threshold": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "catelogue_id": "4000001",
    "product_id": "400000101",
    "sku_id": "400000101001",
    "name": "Baby Formula",
    "color": "Red",
    "age_size": "0-6 months",
    "category": "Baby Food",
    "mrp": 299.99,
    "brand_id": 1,
    "created_at": "2025-01-18T10:30:00.000Z"
  }
}
```

### Update Product
```
PUT /api/products/:skuId
```

**Request Body:**
```json
{
  "mrp": 319.99,
  "description": "Updated description"
}
```

### Get Product by SKU ID
```
GET /api/products/:skuId
```

### Get Products by Catalogue ID
```
GET /api/products/catalogue/:catalogueId
```

### Get All Products (with pagination and filters)
```
GET /api/products?page=1&limit=10&category=Baby Food&color=Red
```

### Update Average Cost
```
PATCH /api/products/:skuId/avg-cost
```

**Request Body:**
```json
{
  "avg_cost_to_ozi": 250.00
}
```

## Usage Examples

### Creating Multiple Variants

1. **Base Product (Red, 0-6 months):**
   - Catalogue ID: `4000001`
   - Product ID: `400000101`
   - SKU ID: `400000101001`

2. **Same Color, Different Age (Red, 6-12 months):**
   - Catalogue ID: `4000001`
   - Product ID: `400000101`
   - SKU ID: `400000101002`

3. **Different Color, Same Age (Blue, 0-6 months):**
   - Catalogue ID: `4000001`
   - Product ID: `400000102`
   - SKU ID: `400000102001`

### Logging System

Every update to a product is logged in the `logs` JSON field:

```json
{
  "logs": [
    {
      "action": "CREATE",
      "timestamp": "2025-01-18T10:30:00.000Z",
      "user_id": 1,
      "changes": {
        "created": { /* original product data */ }
      }
    },
    {
      "action": "UPDATE",
      "timestamp": "2025-01-18T11:00:00.000Z",
      "user_id": 1,
      "changes": {
        "before": { /* previous data */ },
        "after": { /* updated data */ }
      }
    }
  ]
}
```

## Service Methods

### ProductMasterService

- `createProduct(productData, userId)` - Create new product with auto-generated IDs
- `updateProduct(skuId, updateData, userId)` - Update product and log changes
- `getProductBySkuId(skuId)` - Get product by SKU ID
- `getProductsByCatalogueId(catalogueId)` - Get all products for a catalogue
- `getProductsByProductId(productId)` - Get all SKUs for a product
- `updateAverageCost(skuId, newCost, userId)` - Update average cost to OZI
- `getAllProducts(page, limit, filters)` - Get paginated products with filters

## Database Constraints

- `catelogue_id` - Unique constraint
- `sku_id` - Unique constraint
- `brand_id` - Foreign key to `brands` table
- `created_by` - Foreign key to `Users` table
- Various indexes for performance optimization

## Migration Notes

- The old `product_master` table has been replaced
- Foreign key constraints from other tables have been dropped
- New table structure supports the enhanced product management system
- All existing data needs to be migrated to the new structure if required

## Testing

Run the test script to verify functionality:
```bash
node src/scripts/test-product-creation.js
```

This will create test products and verify the ID generation logic works correctly.

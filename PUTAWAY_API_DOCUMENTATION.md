# Putaway API Documentation

## Overview
The Putaway system allows warehouse operators to move QC-passed stock from GRN areas to appropriate bins while maintaining 100% location accuracy.

## Base URL
```
https://your-domain.com/api/putaway
```

## Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Get GRN Putaway List
**URL**: `GET /grn-list`  
**Description**: Get paginated list of GRNs ready for putaway  
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "putawayList": [
      {
        "GRN": 123,
        "PO id": "PO-2024-001",
        "SKU": "SKU001",
        "Quantity": 50,
        "GRN Date": "2024-01-15"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  },
  "error": null
}
```

### 2. Get Return Putaway List
**URL**: `GET /return-list`  
**Description**: Get paginated list of return/RTV items for putaway  
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "returnPutawayList": [
      {
        "GRN": 124,
        "PO id": "PO-2024-002",
        "SKU": "SKU002",
        "RTV Quantity": 10,
        "Held Quantity": 5,
        "GRN Date": "2024-01-15"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  },
  "error": null
}
```

### 3. Get GRN Details by ID
**URL**: `GET /grn/:id`  
**Description**: Get detailed information about a specific GRN

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "GRN": 123,
    "PO ID": "PO-2024-001",
    "Vendor Name": "ABC Suppliers",
    "Created On": "2024-01-15",
    "Purchase Date": "2024-01-10",
    "Expected Delivery Date": "2024-01-20"
  },
  "error": null
}
```

### 4. Scan SKU
**URL**: `POST /scan-sku`  
**Description**: Scan and validate a SKU for putaway

**Request Body**:
```json
{
  "sku_id": "SKU001"
}
```

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "SKU scanned successfully",
    "sku_id": "SKU001",
    "grn_id": 123,
    "available_quantity": 50
  },
  "error": null
}
```

### 5. Get Scanned Product Details
**URL**: `GET /product-details?sku_id=SKU001&grn_id=123`  
**Description**: Get detailed product information after scanning

**Query Parameters**:
- `sku_id`: Product SKU ID
- `grn_id`: GRN ID

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "Scanned Product detail": {
      "SKU": "SKU001",
      "EAN": "1234567890123",
      "MRP": 999.99,
      "NAME": "Product Name",
      "MODEL": "MODEL-001",
      "COLOUR": "Red",
      "SIZE": "M"
    },
    "PO ID": "PO-2024-001",
    "GRN": 123,
    "Vendor Name": "ABC Suppliers",
    "Available Quantity": 50
  },
  "error": null
}
```

### 6. Confirm Putaway
**URL**: `POST /confirm`  
**Description**: Confirm putaway with quantity and bin location

**Request Body**:
```json
{
  "sku_id": "SKU001",
  "grn_id": 123,
  "quantity": 25,
  "bin_location": "A1-B2-C3",
  "remarks": "Standard putaway"
}
```

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Putaway confirmed successfully",
    "putaway_task_id": 789,
    "bin_location": "A1-B2-C3",
    "quantity": 25
  },
  "error": null
}
```

### 7. Get Bin Suggestions
**URL**: `GET /bin-suggestions?sku_id=SKU001&category=electronics`  
**Description**: Get suggested bin locations based on SKU or category

**Query Parameters**:
- `sku_id` (optional): Product SKU ID
- `category` (optional): Product category

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "suggestions": [
      {
        "bin_code": "A1-B2-C3",
        "zone": "A",
        "aisle": "1",
        "rack": "B",
        "shelf": "2",
        "available_capacity": 75,
        "utilization_percentage": 25
      }
    ]
  },
  "error": null
}
```

### 8. Get Putaway Tasks by User
**URL**: `GET /tasks`  
**Description**: Get user's assigned putaway tasks

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "tasks": [
      {
        "task_id": 789,
        "grn_id": 123,
        "sku_id": "SKU001",
        "quantity": 50,
        "scanned_quantity": 25,
        "status": "in-progress",
        "bin_location": "A1-B2-C3",
        "po_id": "PO-2024-001",
        "vendor_name": "ABC Suppliers",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  },
  "error": null
}
```

## Database Schema

### putaway_tasks
```sql
CREATE TABLE putaway_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grn_id INT NOT NULL,
  grn_line_id INT NOT NULL,
  sku_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  assigned_to INT NULL,
  bin_location VARCHAR(100) NULL,
  scanned_quantity INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  remarks VARCHAR(255) NULL
);
```

### putaway_audit
```sql
CREATE TABLE putaway_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  putaway_task_id INT NOT NULL,
  user_id INT NOT NULL,
  action ENUM('scan_product', 'scan_bin', 'confirm_quantity', 'complete_task', 'override_bin') NOT NULL,
  sku_id VARCHAR(50) NOT NULL,
  bin_location VARCHAR(100) NULL,
  quantity INT NOT NULL,
  from_bin VARCHAR(100) NULL,
  to_bin VARCHAR(100) NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### bin_locations
```sql
CREATE TABLE bin_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bin_code VARCHAR(50) NOT NULL UNIQUE,
  zone VARCHAR(50) NOT NULL,
  aisle VARCHAR(50) NOT NULL,
  rack VARCHAR(50) NOT NULL,
  shelf VARCHAR(50) NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  current_quantity INT NOT NULL DEFAULT 0,
  sku_mapping JSON NULL,
  category_mapping JSON NULL,
  status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Error Responses

All APIs return consistent error responses:

```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Error message"
}
```

Common error codes:
- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (GRN/SKU not found)
- `500`: Internal Server Error

## Key Features

1. **Scan-to-Confirm**: Must scan both product and bin
2. **Capacity Management**: Prevents overfilling bins
3. **Bin Suggestions**: Intelligent bin recommendations
4. **Audit Trail**: Complete activity logging
5. **Batch/Expiry Tracking**: Carries forward batch information
6. **Exception Handling**: Damaged/expired item management

## Mobile App Integration

The APIs are designed for mobile applications with:
- Pagination support for large datasets
- Real-time validation
- Offline capability considerations
- Consistent response formats
- Comprehensive error handling

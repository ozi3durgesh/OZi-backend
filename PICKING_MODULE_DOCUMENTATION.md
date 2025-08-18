# 🎯 **PICKING MODULE - COMPREHENSIVE DOCUMENTATION**

## 📋 **Table of Contents**
1. [Overview & Architecture](#overview--architecture)
2. [Role-Based Access Control](#role-based-access-control)
3. [Database Schema](#database-schema)
4. [API Endpoints with Edge Cases](#api-endpoints-with-edge-cases)
5. [Workflow Processes](#workflow-processes)
6. [Error Handling & Edge Cases](#error-handling--edge-cases)
7. [Testing & Validation](#testing--validation)
8. [Performance & Monitoring](#performance--monitoring)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ **OVERVIEW & ARCHITECTURE**

### **What is the Picking Module?**
The Picking Module is a production-grade warehouse management system that handles high-volume order fulfillment with strict accuracy and SLA requirements. It manages the complete picking workflow from wave generation to completion, including exception handling and performance monitoring.

### **Core Components**
- **PickingWave**: Manages picking waves and their lifecycle
- **PicklistItem**: Individual items within picking waves  
- **PickingException**: Handles picking issues and exceptions
- **PickingController**: Business logic and API endpoints
- **PickingRoutes**: RESTful API routing with middleware

### **Key Features**
- ✅ **Wave Management**: Intelligent wave generation and assignment
- ✅ **Picker Operations**: Real-time picking with scanning and validation
- ✅ **FEFO Support**: First Expiry First Out picking for perishables
- ✅ **Exception Handling**: Comprehensive issue management and resolution
- ✅ **SLA Tracking**: Real-time deadline monitoring and alerts
- ✅ **Performance Metrics**: Pick accuracy and efficiency tracking

---

## 🔐 **ROLE-BASED ACCESS CONTROL**

### **Permission Matrix**

| Permission | Admin | WH Manager | WH Staff 1 | WH Staff 2 (Picker) | Store Ops |
|------------|-------|------------|------------|---------------------|-----------|
| `picking:view` | ✅ Full Access | ✅ Full Access | ✅ Limited Access | ✅ Limited Access | ❌ No Access |
| `picking:assign_manage` | ✅ Full Access | ✅ Full Access | ❌ No Access | ❌ No Access | ❌ No Access |
| `picking:execute` | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access | ❌ No Access |
| `picking:monitor` | ✅ Full Access | ✅ Full Access | ❌ No Access | ❌ No Access | ❌ No Access |

### **Detailed Role Breakdown**

#### **🔴 ADMIN Role**
- **Permissions**: All picking permissions
- **Can Do**:
  - Generate picking waves
  - Assign waves to any picker
  - Monitor all picking operations
  - Execute picking tasks
  - View all picking data
  - Manage exceptions
  - Override any restrictions
- **Cannot Do**: Nothing (full access)

#### **🟠 WH MANAGER Role**
- **Permissions**: `picking:view`, `picking:assign_manage`, `picking:monitor`
- **Can Do**:
  - Generate picking waves
  - Assign waves to available pickers
  - Monitor picking performance
  - View all picking data
  - Manage exceptions
  - Override picker assignments
- **Cannot Do**:
  - Execute picking tasks (unless they have `picking:execute`)
  - Access admin-only features

#### **🟡 WH STAFF 1 Role**
- **Permissions**: `picking:view`, `picking:execute`
- **Can Do**:
  - View assigned picking waves
  - Execute picking tasks
  - Report partial picks
  - Complete picking operations
  - View their own performance
- **Cannot Do**:
  - Generate waves
  - Assign waves to others
  - Monitor other pickers
  - Access management features

#### **🟢 WH STAFF 2 (PICKER/PACKER) Role**
- **Permissions**: `picking:view`, `picking:execute`
- **Can Do**:
  - View assigned picking waves
  - Execute picking tasks
  - Report partial picks
  - Complete picking operations
  - View their own performance
- **Cannot Do**:
  - Generate waves
  - Assign waves to others
  - Monitor other pickers
  - Access management features

#### **🔵 STORE OPS Role**
- **Permissions**: None
- **Can Do**: Nothing related to picking
- **Cannot Do**: Any picking operations

### **Availability Status Impact**
All users must have `availabilityStatus` set to `'available'` to:
- Receive wave assignments
- Start picking operations
- Be considered for auto-assignment

**Available Statuses**:
- `'available'` - Can receive tasks
- `'break'` - Temporarily unavailable
- `'off-shift'` - Not available for tasks

---

## 🗄️ **DATABASE SCHEMA**

### **picking_waves Table**
```sql
CREATE TABLE picking_waves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  wave_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('GENERATED', 'ASSIGNED', 'PICKING', 'COMPLETED', 'CANCELLED') DEFAULT 'GENERATED',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  picker_id INT,
  assigned_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  total_orders INT DEFAULT 0,
  total_items INT DEFAULT 0,
  estimated_duration INT DEFAULT 30,
  sla_deadline DATETIME NOT NULL,
  route_optimization BOOLEAN DEFAULT TRUE,
  fefo_required BOOLEAN DEFAULT FALSE,
  tags_and_bags BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (picker_id) REFERENCES users(id)
);
```

### **picklist_items Table**
```sql
CREATE TABLE picklist_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  wave_id INT NOT NULL,
  order_id INT NOT NULL,
  sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  bin_location VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 1,
  picked_quantity INT DEFAULT 0,
  status ENUM('PENDING', 'PICKING', 'PICKED', 'PARTIAL', 'OOS', 'DAMAGED') DEFAULT 'PENDING',
  fefo_batch VARCHAR(100),
  expiry_date DATETIME,
  scan_sequence INT DEFAULT 1,
  partial_reason VARCHAR(255),
  partial_photo VARCHAR(500),
  picked_at DATETIME,
  picked_by INT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wave_id) REFERENCES picking_waves(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (picked_by) REFERENCES users(id)
);
```

### **picking_exceptions Table**
```sql
CREATE TABLE picking_exceptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  wave_id INT NOT NULL,
  order_id INT NOT NULL,
  sku VARCHAR(100) NOT NULL,
  exception_type ENUM('OOS', 'DAMAGED', 'EXPIRY', 'WRONG_LOCATION', 'QUANTITY_MISMATCH', 'OTHER') NOT NULL,
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  description TEXT NOT NULL,
  reported_by INT NOT NULL,
  reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED') DEFAULT 'OPEN',
  assigned_to INT,
  resolution TEXT,
  resolved_at DATETIME,
  resolution_photo VARCHAR(500),
  sla_deadline DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wave_id) REFERENCES picking_waves(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

---

## 🚀 **COMPLETE API ENDPOINTS WITH EDGE CASES**

### **2. AUTO-ASSIGN WAVES TO PICKERS**
**Endpoint**: `GET /api/picking/waves/assign`

#### **Who Can Access**
- **Admin**: ✅ Full access
- **WH Manager**: ✅ Full access  
- **WH Staff 1**: ❌ No access
- **WH Staff 2**: ❌ No access
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:assign_manage`

#### **Basic Request**
```bash
curl --location 'http://localhost:3000/api/picking/waves/assign' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **With Query Parameters**
```bash
curl --location 'http://localhost:3000/api/picking/waves/assign?maxWavesPerPicker=3&priority=HIGH' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Edge Cases & Validation**

**Case 1: No Available Waves**
```bash
curl --location 'http://localhost:3000/api/picking/waves/assign' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `200 OK - "No waves available for assignment"`

**Case 2: No Available Pickers**
```bash
# When all pickers are on break or off-shift
curl --location 'http://localhost:3000/api/picking/waves/assign' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `200 OK - "No available pickers found"`

**Case 3: Invalid Query Parameters**
```bash
curl --location 'http://localhost:3000/api/picking/waves/assign?maxWavesPerPicker=invalid' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Invalid maxWavesPerPicker value"`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Assigned 2 waves to pickers",
    "assignments": [
      {
        "waveId": 1,
        "waveNumber": "W1755493722475-1",
        "pickerId": 2,
        "pickerEmail": "picker1@company.com",
        "assignedAt": "2025-08-18T05:08:57.932Z"
      },
      {
        "waveId": 2,
        "waveNumber": "W1755493722475-2",
        "pickerId": 3,
        "pickerEmail": "picker2@company.com",
        "assignedAt": "2025-08-18T05:08:58.123Z"
      }
    ]
  },
  "error": null
}
```

---

### **3. LIST AVAILABLE WAVES**
**Endpoint**: `GET /api/picking/waves/available`

#### **Who Can Access**
- **Admin**: ✅ Full access (all waves)
- **WH Manager**: ✅ Full access (all waves)
- **WH Staff 1**: ✅ Limited access (assigned waves only)
- **WH Staff 2**: ✅ Limited access (assigned waves only)
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:view`

#### **Basic Request**
```bash
curl --location 'http://localhost:3000/api/picking/waves/available' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **With Filters**
```bash
curl --location 'http://localhost:3000/api/picking/waves/available?status=GENERATED&priority=HIGH&page=1&limit=10' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Edge Cases & Validation**

**Case 1: No Waves Found**
```bash
curl --location 'http://localhost:3000/api/picking/waves/available?status=COMPLETED' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `200 OK - Empty waves array with pagination`

**Case 2: Invalid Status Filter**
```bash
curl --location 'http://localhost:3000/api/picking/waves/available?status=INVALID_STATUS' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Invalid status value"`

**Case 3: Invalid Pagination**
```bash
curl --location 'http://localhost:3000/api/picking/waves/available?page=-1&limit=0' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Invalid pagination parameters"`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "waves": [
      {
        "id": 1,
        "waveNumber": "W1755493722475-1",
        "status": "GENERATED",
        "priority": "HIGH",
        "pickerId": null,
        "assignedAt": null,
        "startedAt": null,
        "completedAt": null,
        "totalOrders": 3,
        "totalItems": 8,
        "estimatedDuration": 6,
        "slaDeadline": "2025-08-19T05:08:42.000Z",
        "routeOptimization": true,
        "fefoRequired": false,
        "tagsAndBags": false,
        "createdAt": "2025-08-18T05:08:42.000Z",
        "updatedAt": "2025-08-18T05:08:42.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "error": null
}
```

---

### **4. START PICKING A WAVE**
**Endpoint**: `POST /api/picking/waves/{waveId}/start`

#### **Who Can Access**
- **Admin**: ✅ Full access
- **WH Manager**: ✅ Full access
- **WH Staff 1**: ✅ Limited access (assigned waves only)
- **WH Staff 2**: ✅ Limited access (assigned waves only)
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:execute`

#### **Basic Request**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/start \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Edge Cases & Validation**

**Case 1: Wave Not Found**
```bash
curl -X POST http://localhost:3000/api/picking/waves/99999/start \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `404 Not Found - "Wave not found"`

**Case 2: Wave Already Started**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/start \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Wave is already in progress"`

**Case 3: Wave Not Assigned to User**
```bash
# When a picker tries to start a wave assigned to someone else
curl -X POST http://localhost:3000/api/picking/waves/1/start \
  --header 'Authorization: Bearer DIFFERENT_PICKER_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `403 Forbidden - "Wave not assigned to you"`

**Case 4: Wave Status Invalid**
```bash
# When wave is already completed or cancelled
curl -X POST http://localhost:3000/api/picking/waves/1/start \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Cannot start wave in current status"`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Picking started successfully",
    "wave": {
      "id": 1,
      "waveNumber": "W1755493722475-1",
      "status": "PICKING",
      "totalItems": 8,
      "estimatedDuration": 6,
      "startedAt": "2025-08-18T05:10:00.000Z"
    },
    "picklistItems": [
      {
        "id": 1,
        "sku": "SKU001",
        "productName": "Product 1",
        "binLocation": "A1-B2-C3",
        "quantity": 2,
        "scanSequence": 1,
        "fefoBatch": null,
        "expiryDate": null
      }
    ]
  },
  "error": null
}
```

---

### **5. SCAN AN ITEM**
**Endpoint**: `POST /api/picking/waves/{waveId}/scan`

#### **Who Can Access**
- **Admin**: ✅ Full access
- **WH Manager**: ✅ Full access
- **WH Staff 1**: ✅ Limited access (assigned waves only)
- **WH Staff 2**: ✅ Limited access (assigned waves only)
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:execute`

#### **Basic Request**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/scan \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU001",
    "binLocation": "A1-B2-C3",
    "quantity": 2
  }'
```

#### **Edge Cases & Validation**

**Case 1: Invalid SKU**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/scan \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "INVALID_SKU",
    "binLocation": "A1-B2-C3",
    "quantity": 2
  }'
```
**Expected Response**: `400 Bad Request - "SKU not found in picklist"`

**Case 2: Wrong Bin Location**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/scan \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU001",
    "binLocation": "WRONG_LOCATION",
    "quantity": 2
  }'
```
**Expected Response**: `400 Bad Request - "SKU not found in specified bin location"`

**Case 3: Quantity Exceeds Required**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/scan \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU001",
    "binLocation": "A1-B2-C3",
    "quantity": 10
  }'
```
**Expected Response**: `400 Bad Request - "Quantity exceeds required amount"`

**Case 4: Item Already Picked**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/scan \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU001",
    "binLocation": "A1-B2-C3",
    "quantity": 2
  }'
```
**Expected Response**: `400 Bad Request - "Item already picked"`

**Case 5: Wave Not in PICKING Status**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/scan \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU001",
    "binLocation": "A1-B2-C3",
    "quantity": 2
  }'
```
**Expected Response**: `400 Bad Request - "Wave is not in PICKING status"`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Item scanned successfully",
    "item": {
      "id": 1,
      "sku": "SKU001",
      "productName": "Product 1",
      "status": "PICKED",
      "pickedQuantity": 2,
      "remainingQuantity": 0,
      "pickedAt": "2025-08-18T05:12:00.000Z"
    },
    "waveStatus": "PICKING",
    "remainingItems": 7,
    "progress": {
      "picked": 1,
      "total": 8,
      "percentage": 12.5
    }
  },
  "error": null
}
```

---

### **6. REPORT PARTIAL PICK**
**Endpoint**: `POST /api/picking/waves/{waveId}/partial`

#### **Who Can Access**
- **Admin**: ✅ Full access
- **WH Manager**: ✅ Full access
- **WH Staff 1**: ✅ Limited access (assigned waves only)
- **WH Staff 2**: ✅ Limited access (assigned waves only)
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:execute`

#### **Basic Request**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/partial \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU002",
    "binLocation": "A1-B2-C4",
    "reason": "OOS",
    "photo": "base64_encoded_photo_data",
    "notes": "Item not found in bin location",
    "pickedQuantity": 0
  }'
```

#### **Edge Cases & Validation**

**Case 1: Invalid Reason**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/partial \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU002",
    "binLocation": "A1-B2-C4",
    "reason": "INVALID_REASON",
    "photo": "base64_encoded_photo_data",
    "notes": "Item not found in bin location",
    "pickedQuantity": 0
  }'
```
**Expected Response**: `400 Bad Request - "Invalid reason value"`

**Case 2: Negative Picked Quantity**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/partial \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU002",
    "binLocation": "A1-B2-C4",
    "reason": "OOS",
    "photo": "base64_encoded_photo_data",
    "notes": "Item not found in bin location",
    "pickedQuantity": -1
  }'
```
**Expected Response**: `400 Bad Request - "Picked quantity cannot be negative"`

**Case 3: Picked Quantity Exceeds Required**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/partial \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU002",
    "binLocation": "A1-B2-C4",
    "reason": "OOS",
    "photo": "base64_encoded_photo_data",
    "notes": "Item not found in bin location",
    "pickedQuantity": 10
  }'
```
**Expected Response**: `400 Bad Request - "Picked quantity exceeds required amount"`

**Case 4: Missing Required Fields**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/partial \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{
    "sku": "SKU002",
    "binLocation": "A1-B2-C4"
  }'
```
**Expected Response**: `400 Bad Request - "Missing required fields: reason, pickedQuantity"`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Partial pick reported successfully",
    "item": {
      "id": 2,
      "sku": "SKU002",
      "productName": "Product 2",
      "status": "PARTIAL",
      "partialReason": "OOS",
      "pickedQuantity": 0,
      "remainingQuantity": 3,
      "partialPhoto": "base64_encoded_photo_data",
      "notes": "Item not found in bin location"
    },
    "exception": {
      "id": 1,
      "exceptionType": "OOS",
      "severity": "MEDIUM",
      "description": "Item not found in bin location",
      "status": "OPEN",
      "slaDeadline": "2025-08-19T05:08:42.000Z"
    }
  },
  "error": null
}
```

---

### **7. COMPLETE PICKING**
**Endpoint**: `POST /api/picking/waves/{waveId}/complete`

#### **Who Can Access**
- **Admin**: ✅ Full access
- **WH Manager**: ✅ Full access
- **WH Staff 1**: ✅ Limited access (assigned waves only)
- **WH Staff 2**: ✅ Limited access (assigned waves only)
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:execute`

#### **Basic Request**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/complete \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Edge Cases & Validation**

**Case 1: Wave Not Found**
```bash
curl -X POST http://localhost:3000/api/picking/waves/99999/complete \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `404 Not Found - "Wave not found"`

**Case 2: Wave Not in PICKING Status**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/complete \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Wave is not in PICKING status"`

**Case 3: Unpicked Items Remain**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/complete \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Wave has unpicked items"`

**Case 4: Wave Not Assigned to User**
```bash
curl -X POST http://localhost:3000/api/picking/waves/1/complete \
  --header 'Authorization: Bearer DIFFERENT_PICKER_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `403 Forbidden - "Wave not assigned to you"`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "message": "Picking completed successfully",
    "wave": {
      "id": 1,
      "waveNumber": "W1755493722475-1",
      "status": "COMPLETED",
      "completedAt": "2025-08-18T05:30:00.000Z"
    },
    "metrics": {
      "totalItems": 8,
      "pickedItems": 7,
      "partialItems": 1,
      "accuracy": 87.5,
      "completionTime": "20 minutes",
      "efficiency": "0.4 items per minute"
    },
    "exceptions": [
      {
        "id": 1,
        "exceptionType": "OOS",
        "severity": "MEDIUM",
        "status": "OPEN",
        "slaDeadline": "2025-08-19T05:08:42.000Z"
      }
    ]
  },
  "error": null
}
```

---

### **8. CHECK SLA COMPLIANCE**
**Endpoint**: `GET /api/picking/sla-status`

#### **Who Can Access**
- **Admin**: ✅ Full access (all waves)
- **WH Manager**: ✅ Full access (all waves)
- **WH Staff 1**: ❌ No access
- **WH Staff 2**: ❌ No access
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:monitor`

#### **Basic Request**
```bash
curl --location 'http://localhost:3000/api/picking/sla-status' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **With Wave Filter**
```bash
curl --location 'http://localhost:3000/api/picking/sla-status?waveId=1' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Edge Cases & Validation**

**Case 1: No Waves Found**
```bash
curl --location 'http://localhost:3000/api/picking/sla-status?waveId=99999' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `404 Not Found - "Wave not found"`

**Case 2: Insufficient Permissions**
```bash
curl --location 'http://localhost:3000/api/picking/sla-status' \
  --header 'Authorization: Bearer WH_STAFF_TOKEN' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `403 Forbidden - "Insufficient permissions"`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "slaMetrics": {
      "total": 2,
      "onTime": 1,
      "atRisk": 1,
      "breached": 0,
      "waves": [
        {
          "id": 1,
          "waveNumber": "W1755493722475-1",
          "status": "PICKING",
          "priority": "HIGH",
          "slaDeadline": "2025-08-19T05:08:42.000Z",
          "slaStatus": "onTime",
          "hoursToDeadline": 23.5,
          "picker": {
            "id": 2,
            "email": "picker1@company.com"
          }
        },
        {
          "id": 2,
          "waveNumber": "W1755493722475-2",
          "status": "ASSIGNED",
          "priority": "MEDIUM",
          "slaDeadline": "2025-08-18T20:00:00.000Z",
          "slaStatus": "atRisk",
          "hoursToDeadline": 2.5,
          "picker": {
            "id": 3,
            "email": "picker2@company.com"
          }
        }
      ]
    },
    "summary": {
      "onTimePercentage": 50,
      "atRiskPercentage": 50,
      "breachedPercentage": 0
    }
  },
  "error": null
}
```

---

### **9. GET EXPIRY ALERTS**
**Endpoint**: `GET /api/picking/expiry-alerts`

#### **Who Can Access**
- **Admin**: ✅ Full access
- **WH Manager**: ✅ Full access
- **WH Staff 1**: ❌ No access
- **WH Staff 2**: ❌ No access
- **Store Ops**: ❌ No access

#### **Required Permission**
`picking:monitor`

#### **Basic Request**
```bash
curl --location 'http://localhost:3000/api/picking/expiry-alerts' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **With Threshold Filter**
```bash
curl --location 'http://localhost:3000/api/picking/expiry-alerts?daysThreshold=7' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Edge Cases & Validation**

**Case 1: Invalid Threshold Value**
```bash
curl --location 'http://localhost:3000/api/picking/expiry-alerts?daysThreshold=invalid' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `400 Bad Request - "Invalid daysThreshold value"`

**Case 2: No Expiring Items**
```bash
curl --location 'http://localhost:3000/api/picking/expiry-alerts?daysThreshold=1' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```
**Expected Response**: `200 OK - Empty alerts array`

#### **Success Response**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "totalAlerts": 2,
    "alerts": [
      {
        "id": 1,
        "sku": "SKU003",
        "productName": "Perishable Product 1",
        "expiryDate": "2025-08-20T00:00:00.000Z",
        "daysUntilExpiry": 1,
        "waveNumber": "W1755493722475-1",
        "wavePriority": "HIGH",
        "orderId": 1,
        "urgency": "CRITICAL",
        "recommendedAction": "Prioritize picking for immediate fulfillment"
      },
      {
        "id": 2,
        "sku": "SKU004",
        "productName": "Perishable Product 2",
        "expiryDate": "2025-08-22T00:00:00.000Z",
        "daysUntilExpiry": 3,
        "waveNumber": "W1755493722475-2",
        "wavePriority": "MEDIUM",
        "orderId": 2,
        "urgency": "HIGH",
        "recommendedAction": "Schedule for next picking cycle"
      }
    ],
    "summary": {
      "critical": 1,
      "high": 1,
      "medium": 0,
      "low": 0
    }
  },
  "error": null
}
```

---

## 🔄 **COMPLETE WORKFLOW EXAMPLES**

### **End-to-End Picking Workflow**

#### **Step 1: Generate Wave (Admin/WH Manager)**
```bash
# Login as Admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "SecurePassword123"}' | jq -r '.data.accessToken')

# Generate picking wave
curl -X POST http://localhost:3000/api/picking/waves/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{"orderIds": [1, 2], "priority": "HIGH", "routeOptimization": true, "fefoRequired": false, "tagsAndBags": false, "maxOrdersPerWave": 20}'
```

#### **Step 2: Assign Wave (Admin/WH Manager)**
```bash
# Auto-assign wave to available picker
curl --location 'http://localhost:3000/api/picking/waves/assign' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Step 3: Start Picking (Picker)**
```bash
# Login as Picker
PICKER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "picker@company.com", "password": "Password123"}' | jq -r '.data.accessToken')

# Start picking
curl -X POST http://localhost:3000/api/picking/waves/1/start \
  --header "Authorization: Bearer $PICKER_TOKEN" \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Step 4: Scan Items (Picker)**
```bash
# Scan first item
curl -X POST http://localhost:3000/api/picking/waves/1/scan \
  --header "Authorization: Bearer $PICKER_TOKEN" \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{"sku": "SKU001", "binLocation": "A1-B2-C3", "quantity": 2}'

# Report partial pick for second item
curl -X POST http://localhost:3000/api/picking/waves/1/partial \
  --header "Authorization: Bearer $PICKER_TOKEN" \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0' \
  --data '{"sku": "SKU002", "binLocation": "A1-B2-C4", "reason": "OOS", "photo": "base64_photo", "notes": "Item not found", "pickedQuantity": 0}'
```

#### **Step 5: Complete Picking (Picker)**
```bash
# Complete the wave
curl -X POST http://localhost:3000/api/picking/waves/1/complete \
  --header "Authorization: Bearer $PICKER_TOKEN" \
  --header 'Content-Type: application/json' \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

#### **Step 6: Monitor Performance (Admin/WH Manager)**
```bash
# Check SLA status
curl --location 'http://localhost:3000/api/picking/sla-status' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'

# Check expiry alerts
curl --location 'http://localhost:3000/api/picking/expiry-alerts?daysThreshold=7' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --header 'source: mobile' \
  --header 'app-version: 1.0.0'
```

---

## 📊 **PERFORMANCE TESTING SCENARIOS**

### **Load Testing Commands**

#### **Concurrent Wave Generation**
```bash
# Generate 10 waves concurrently
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/picking/waves/generate \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -H "source: mobile" \
    -H "app-version: 1.0.0" \
    -d "{\"orderIds\": [$i], \"priority\": \"HIGH\", \"routeOptimization\": true, \"fefoRequired\": false, \"tagsAndBags\": false, \"maxOrdersPerWave\": 20}" &
done
wait
```

#### **Concurrent Scanning**
```bash
# Simulate 5 pickers scanning simultaneously
for picker in {1..5}; do
  PICKER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"picker${picker}@company.com\", \"password\": \"Password123\"}" | jq -r '.data.accessToken')
  
  # Start picking
  curl -X POST http://localhost:3000/api/picking/waves/$picker/start \
    --header "Authorization: Bearer $PICKER_TOKEN" \
    --header 'Content-Type: application/json' \
    --header 'source: mobile' \
    --header 'app-version: 1.0.0' &
done
wait
```

---

## 🚨 **SECURITY CONSIDERATIONS**

### **Permission Validation**
- All endpoints validate user permissions before execution
- Users can only access waves assigned to them (unless Admin/WH Manager)
- Role-based access control enforced at API level
- JWT tokens validated for every request

### **Data Validation**
- Input sanitization for all user inputs
- SQL injection prevention through parameterized queries
- XSS protection through proper output encoding
- Rate limiting to prevent abuse

### **Audit Logging**
- All picking operations logged with user ID and timestamp
- Exception reports tracked with full details
- Performance metrics recorded for analysis
- Security events logged for monitoring

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All edge cases tested
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Backup procedures established

### **Deployment**
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] RBAC system initialized
- [ ] Picking tables created
- [ ] Monitoring enabled

### **Post-Deployment**
- [ ] End-to-end workflow tested
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] User training completed
- [ ] Support procedures established

---

**Version**: 2.0.0  
**Last Updated**: August 2024  
**Compatibility**: Node.js v22.18.0+, MySQL 8.0+  
**Status**: Production Ready ✅  
**Coverage**: Complete API documentation with edge cases, role-based permissions, and comprehensive testing scenarios

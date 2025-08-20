# Permission Management (Admin Only)

This module handles the creation and management of system permissions. Only users with `users_roles:manage` permission can access these endpoints.

## Create Permission

### Create New Permission
Create a new permission in the system.

**Endpoint:** `POST /api/permissions`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "inventory:adjust",
  "displayName": "Adjust Inventory",
  "description": "Ability to adjust inventory levels and quantities",
  "category": "inventory",
  "module": "warehouse"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inventory:adjust",
    "displayName": "Adjust Inventory",
    "description": "Ability to adjust inventory levels and quantities",
    "category": "inventory",
    "module": "warehouse"
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 25,
    "name": "inventory:adjust",
    "displayName": "Adjust Inventory",
    "description": "Ability to adjust inventory levels and quantities",
    "category": "inventory",
    "module": "warehouse",
    "createdAt": "2024-01-01T14:00:00.000Z",
    "updatedAt": "2024-01-01T14:00:00.000Z"
  },
  "error": null
}
```

## List Permissions

### Get All Permissions
Retrieve a list of all permissions in the system.

**Endpoint:** `GET /api/permissions`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `category` (optional): Filter by permission category
- `module` (optional): Filter by module
- `search` (optional): Search in permission names and descriptions

**cURL Example:**
```bash
# Get all permissions
curl -X GET "http://localhost:3000/api/permissions" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by category
curl -X GET "http://localhost:3000/api/permissions?category=warehouse" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Search permissions
curl -X GET "http://localhost:3000/api/permissions?search=picking" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "users_roles:manage",
      "displayName": "Manage Users and Roles",
      "description": "Full user and role management capabilities",
      "category": "administration",
      "module": "users",
      "usageCount": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "orders:view_all",
      "displayName": "View All Orders",
      "description": "Access to view all orders in the system",
      "category": "orders",
      "module": "orders",
      "usageCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "name": "orders:view_own",
      "displayName": "View Own Orders",
      "description": "Access to view only own orders",
      "category": "orders",
      "module": "orders",
      "usageCount": 8,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 4,
      "name": "picking:execute",
      "displayName": "Execute Picking",
      "description": "Perform picking operations",
      "category": "operations",
      "module": "picking",
      "usageCount": 12,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 5,
      "name": "picking:view",
      "displayName": "View Picking",
      "description": "View picking information and reports",
      "category": "operations",
      "module": "picking",
      "usageCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 6,
      "name": "picking:assign_manage",
      "displayName": "Manage Picking Assignments",
      "description": "Assign and manage picking waves",
      "category": "management",
      "module": "picking",
      "usageCount": 2,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 7,
      "name": "packing:execute",
      "displayName": "Execute Packing",
      "description": "Perform packing operations",
      "category": "operations",
      "module": "packing",
      "usageCount": 7,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 8,
      "name": "packing:view",
      "displayName": "View Packing",
      "description": "View packing information and reports",
      "category": "operations",
      "module": "packing",
      "usageCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 9,
      "name": "warehouse:view",
      "displayName": "View Warehouse",
      "description": "View warehouse information and zones",
      "category": "warehouse",
      "module": "warehouse",
      "usageCount": 4,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 10,
      "name": "warehouse:manage",
      "displayName": "Manage Warehouse",
      "description": "Full warehouse management capabilities",
      "category": "warehouse",
      "module": "warehouse",
      "usageCount": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 11,
      "name": "pos:execute",
      "displayName": "Execute POS",
      "description": "Perform point of sale operations",
      "category": "sales",
      "module": "pos",
      "usageCount": 6,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 25,
      "name": "inventory:adjust",
      "displayName": "Adjust Inventory",
      "description": "Ability to adjust inventory levels and quantities",
      "category": "inventory",
      "module": "warehouse",
      "usageCount": 0,
      "createdAt": "2024-01-01T14:00:00.000Z"
    }
  ],
  "error": null
}
```

## Permission Categories

The system organizes permissions into logical categories:

### Administration
- `users_roles:manage` - User and role management
- `system:config` - System configuration
- `system:logs` - Access system logs
- `system:backup` - System backup operations

### Orders
- `orders:view_all` - View all orders
- `orders:view_own` - View own orders
- `orders:create` - Create new orders
- `orders:update` - Update orders
- `orders:cancel` - Cancel orders

### Operations
- `picking:execute` - Execute picking operations
- `picking:view` - View picking information
- `packing:execute` - Execute packing operations
- `packing:view` - View packing information

### Management
- `picking:assign_manage` - Manage picking assignments
- `picking:reports` - Access picking reports
- `packing:manage` - Manage packing operations
- `warehouse:manage` - Full warehouse management

### Warehouse
- `warehouse:view` - View warehouse information
- `warehouse:zones` - Manage warehouse zones
- `warehouse:staff` - Manage warehouse staff
- `inventory:adjust` - Adjust inventory levels

### Sales
- `pos:execute` - Execute POS operations
- `pos:view` - View POS information
- `pos:reports` - Access POS reports

## Permission Naming Convention

Permissions follow a consistent naming pattern:

```
<module>:<action>
```

### Examples:
- `users:create` - Create users in the users module
- `orders:view_all` - View all orders in the orders module
- `picking:execute` - Execute operations in the picking module
- `warehouse:manage` - Manage operations in the warehouse module

### Action Types:
- `view` - Read-only access
- `create` - Create new resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `execute` - Perform operations
- `manage` - Full management capabilities
- `reports` - Access to reports and analytics

## Creating Custom Permissions

### 1. Inventory Management Permission
```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inventory:audit",
    "displayName": "Audit Inventory",
    "description": "Perform inventory audits and cycle counts",
    "category": "inventory",
    "module": "warehouse"
  }'
```

### 2. Quality Control Permission
```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "quality:inspect",
    "displayName": "Quality Inspection",
    "description": "Perform quality control inspections",
    "category": "quality",
    "module": "packing"
  }'
```

### 3. Reporting Permission
```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "reports:analytics",
    "displayName": "Analytics Reports",
    "description": "Access to advanced analytics and reporting",
    "category": "reports",
    "module": "system"
  }'
```

## Permission Usage Tracking

The system tracks how many roles use each permission:

- **usageCount**: Number of roles that currently have this permission
- **createdAt**: When the permission was created
- **updatedAt**: When the permission was last modified

## Error Responses

### Insufficient Permissions
```json
{
  "statusCode": 403,
  "success": false,
  "data": null,
  "error": "Insufficient permissions. Required: users_roles:manage"
}
```

### Permission Already Exists
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Permission with name 'inventory:adjust' already exists"
}
```

### Invalid Permission Name
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid permission name format. Use 'module:action' format"
}
```

### Missing Required Fields
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Missing required fields: name, displayName, description"
}
```

## Best Practices

### Permission Design
- Use descriptive names that clearly indicate the capability
- Follow the established naming convention
- Group related permissions by module and category
- Keep permissions granular for better access control

### Security Considerations
- Only create permissions that are actually needed
- Regularly audit permission usage
- Remove unused permissions
- Document the purpose of each permission

### Integration with Roles
- Assign permissions to roles, not directly to users
- Use role-based access control (RBAC)
- Regularly review role-permission assignments
- Test permission combinations for conflicts

## Mobile App Integration

### Permission Display
- Show available permissions based on user's role
- Display permission descriptions for clarity
- Group permissions by category for better organization
- Provide feedback when permissions are insufficient

### Permission Validation
- Validate permissions before showing features
- Handle permission errors gracefully
- Cache permission information for offline use
- Sync permission changes when online

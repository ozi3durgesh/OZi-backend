# Role Management (Admin Only)

This module handles the creation and management of user roles in the system. Only users with `users_roles:manage` permission can access these endpoints.

## Create Role

### Create New Role
Create a new role with specific permissions.

**Endpoint:** `POST /api/roles`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "warehouse_supervisor",
  "displayName": "Warehouse Supervisor",
  "description": "Manages warehouse operations and staff",
  "permissions": [
    "warehouse:manage",
    "picking:view",
    "packing:execute",
    "orders:view_all"
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "warehouse_supervisor",
    "displayName": "Warehouse Supervisor",
    "description": "Manages warehouse operations and staff",
    "permissions": [
      "warehouse:manage",
      "picking:view",
      "packing:execute",
      "orders:view_all"
    ]
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 5,
    "name": "warehouse_supervisor",
    "displayName": "Warehouse Supervisor",
    "description": "Manages warehouse operations and staff",
    "permissions": [
      "warehouse:manage",
      "picking:view",
      "packing:execute",
      "orders:view_all"
    ],
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "error": null
}
```

## List Roles

### Get All Roles
Retrieve a list of all roles in the system.

**Endpoint:** `GET /api/roles`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/roles" \
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
      "name": "admin",
      "displayName": "Administrator",
      "description": "Full system access",
      "permissions": [
        "users_roles:manage",
        "orders:view_all",
        "picking:assign_manage",
        "packing:execute",
        "warehouse:manage"
      ],
      "userCount": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "manager",
      "displayName": "Manager",
      "description": "Department management access",
      "permissions": [
        "orders:view_all",
        "picking:view",
        "packing:execute",
        "warehouse:view"
      ],
      "userCount": 3,
      "createdAt": "2024-01-01T01:00:00.000Z"
    },
    {
      "id": 3,
      "name": "picker",
      "displayName": "Picker",
      "description": "Picking operations access",
      "permissions": [
        "picking:execute"
      ],
      "userCount": 8,
      "createdAt": "2024-01-01T02:00:00.000Z"
    },
    {
      "id": 4,
      "name": "packer",
      "displayName": "Packer",
      "description": "Packing operations access",
      "permissions": [
        "packing:execute"
      ],
      "userCount": 5,
      "createdAt": "2024-01-01T03:00:00.000Z"
    },
    {
      "id": 5,
      "name": "warehouse_supervisor",
      "displayName": "Warehouse Supervisor",
      "description": "Manages warehouse operations and staff",
      "permissions": [
        "warehouse:manage",
        "picking:view",
        "packing:execute",
        "orders:view_all"
      ],
      "userCount": 0,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "error": null
}
```

## Assign Permissions to Role

### Assign Permissions
Assign specific permissions to an existing role.

**Endpoint:** `POST /api/roles/assign-permissions`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "roleId": 3,
  "permissions": [
    "picking:execute",
    "picking:view",
    "orders:view_own"
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/roles/assign-permissions" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": 3,
    "permissions": [
      "picking:execute",
      "picking:view",
      "orders:view_own"
    ]
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "roleId": 3,
    "roleName": "picker",
    "updatedPermissions": [
      "picking:execute",
      "picking:view",
      "orders:view_own"
    ],
    "message": "Permissions assigned successfully",
    "updatedAt": "2024-01-01T13:00:00.000Z"
  },
  "error": null
}
```

## Available Permissions

The system supports the following permission categories:

### User & Role Management
- `users_roles:manage` - Full user and role management
- `users:view` - View user information
- `users:create` - Create new users
- `users:update` - Update user information
- `users:delete` - Deactivate users

### Order Management
- `orders:view_all` - View all orders
- `orders:view_own` - View own orders
- `orders:create` - Create new orders
- `orders:update` - Update orders
- `orders:cancel` - Cancel orders

### Picking Operations
- `picking:view` - View picking information
- `picking:execute` - Execute picking operations
- `picking:assign_manage` - Manage picking assignments
- `picking:reports` - Access picking reports

### Packing Operations
- `packing:execute` - Execute packing operations
- `packing:view` - View packing information
- `packing:manage` - Manage packing operations

### Warehouse Management
- `warehouse:view` - View warehouse information
- `warehouse:manage` - Full warehouse management
- `warehouse:zones` - Manage warehouse zones
- `warehouse:staff` - Manage warehouse staff

### POS Operations
- `pos:execute` - Execute POS operations
- `pos:view` - View POS information
- `pos:reports` - Access POS reports

### System Administration
- `system:config` - System configuration
- `system:logs` - Access system logs
- `system:backup` - System backup operations

## Role Creation Examples

### 1. Senior Picker Role
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "senior_picker",
    "displayName": "Senior Picker",
    "description": "Experienced picker with training responsibilities",
    "permissions": [
      "picking:execute",
      "picking:view",
      "picking:reports",
      "orders:view_own"
    ]
  }'
```

### 2. Quality Control Role
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "quality_control",
    "displayName": "Quality Control",
    "description": "Quality control and inspection operations",
    "permissions": [
      "packing:execute",
      "packing:view",
      "picking:view",
      "orders:view_all"
    ]
  }'
```

### 3. Inventory Manager Role
```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inventory_manager",
    "displayName": "Inventory Manager",
    "description": "Manages inventory and stock levels",
    "permissions": [
      "warehouse:view",
      "warehouse:zones",
      "orders:view_all",
      "picking:view",
      "packing:view"
    ]
  }'
```

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

### Role Already Exists
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Role with name 'warehouse_supervisor' already exists"
}
```

### Invalid Permissions
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid permission: 'invalid:permission'"
}
```

### Role Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "Role not found"
}
```

## Best Practices

### Role Design
- Create roles based on job functions, not individuals
- Use descriptive names and descriptions
- Follow the principle of least privilege
- Group related permissions together

### Permission Assignment
- Start with minimal permissions and add as needed
- Regularly review and audit role permissions
- Remove unused permissions
- Document permission changes

### Security Considerations
- Only admins should manage roles
- Log all role and permission changes
- Regular security audits
- Monitor role usage patterns

## Mobile App Integration

### Role Display
- Show user's role and permissions
- Display available actions based on permissions
- Hide unauthorized features
- Provide clear feedback on permission errors

### Offline Handling
- Cache role information
- Validate permissions locally when possible
- Sync role changes when online
- Handle permission updates gracefully

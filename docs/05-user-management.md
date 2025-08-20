# User Management

This module handles user creation, management, and role assignments. Most operations require `users_roles:manage` permission.

## Create User

### Create New User
Create a new user in the system with a specific role.

**Endpoint:** `POST /api/users`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "picker@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Picker",
  "phone": "+1234567890",
  "roleId": 3,
  "warehouseId": 1
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "picker@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Picker",
    "phone": "+1234567890",
    "roleId": 3,
    "warehouseId": 1
  }'
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": 15,
    "email": "picker@example.com",
    "firstName": "John",
    "lastName": "Picker",
    "phone": "+1234567890",
    "role": {
      "id": 3,
      "name": "picker",
      "displayName": "Picker"
    },
    "warehouse": {
      "id": 1,
      "name": "Main Warehouse"
    },
    "status": "active",
    "createdAt": "2024-01-01T15:00:00.000Z"
  },
  "error": null
}
```

## List Users

### Get All Users
Retrieve a list of all users in the system.

**Endpoint:** `GET /api/users`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**Query Parameters:**
- `role` (optional): Filter by role name
- `warehouse` (optional): Filter by warehouse ID
- `status` (optional): Filter by user status (active, inactive)
- `search` (optional): Search in names and emails

**cURL Example:**
```bash
# Get all users
curl -X GET "http://localhost:3000/api/users" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by role
curl -X GET "http://localhost:3000/api/users?role=picker" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Filter by warehouse
curl -X GET "http://localhost:3000/api/users?warehouse=1" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json"

# Search users
curl -X GET "http://localhost:3000/api/users?search=john" \
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
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "phone": "+1234567890",
      "role": {
        "id": 1,
        "name": "admin",
        "displayName": "Administrator"
      },
      "warehouse": {
        "id": 1,
        "name": "Main Warehouse"
      },
      "status": "active",
      "lastLogin": "2024-01-01T14:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "email": "manager@example.com",
      "firstName": "Sarah",
      "lastName": "Manager",
      "phone": "+1234567891",
      "role": {
        "id": 2,
        "name": "manager",
        "displayName": "Manager"
      },
      "warehouse": {
        "id": 1,
        "name": "Main Warehouse"
      },
      "status": "active",
      "lastLogin": "2024-01-01T13:45:00.000Z",
      "createdAt": "2024-01-01T01:00:00.000Z"
    },
    {
      "id": 15,
      "email": "picker@example.com",
      "firstName": "John",
      "lastName": "Picker",
      "phone": "+1234567890",
      "role": {
        "id": 3,
        "name": "picker",
        "displayName": "Picker"
      },
      "warehouse": {
        "id": 1,
        "name": "Main Warehouse"
      },
      "status": "active",
      "lastLogin": null,
      "createdAt": "2024-01-01T15:00:00.000Z"
    }
  ],
  "error": null
}
```

## Update User Status

### Change User Status
Activate or deactivate a user account.

**Endpoint:** `PUT /api/users/:userId/status`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "inactive",
  "reason": "User left the company"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/users/15/status" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "reason": "User left the company"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 15,
    "email": "picker@example.com",
    "firstName": "John",
    "lastName": "Picker",
    "status": "inactive",
    "statusReason": "User left the company",
    "statusChangedAt": "2024-01-01T16:00:00.000Z",
    "statusChangedBy": 1
  },
  "error": null
}
```

## Change User Role

### Update User Role
Change a user's role and associated permissions.

**Endpoint:** `PUT /api/users/:userId/role`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "roleId": 4,
  "reason": "Promoted to packer position"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/users/15/role" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": 4,
    "reason": "Promoted to packer position"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 15,
    "email": "picker@example.com",
    "firstName": "John",
    "lastName": "Picker",
    "previousRole": {
      "id": 3,
      "name": "picker",
      "displayName": "Picker"
    },
    "newRole": {
      "id": 4,
      "name": "packer",
      "displayName": "Packer"
    },
    "roleChangeReason": "Promoted to packer position",
    "roleChangedAt": "2024-01-01T17:00:00.000Z",
    "roleChangedBy": 1
  },
  "error": null
}
```

## Deactivate User

### Remove User
Deactivate a user account (soft delete).

**Endpoint:** `DELETE /api/users/:userId`

**Headers:**
```bash
X-App-Version: 1.0.0
Authorization: Bearer <your-access-token>
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3000/api/users/15" \
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
    "id": 15,
    "email": "picker@example.com",
    "firstName": "John",
    "lastName": "Picker",
    "status": "deactivated",
    "deactivatedAt": "2024-01-01T18:00:00.000Z",
    "deactivatedBy": 1,
    "message": "User deactivated successfully"
  },
  "error": null
}
```

## User Creation Examples

### 1. Create Warehouse Manager
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "warehouse.manager@example.com",
    "password": "SecurePassword123",
    "firstName": "Michael",
    "lastName": "Warehouse",
    "phone": "+1234567892",
    "roleId": 5,
    "warehouseId": 1
  }'
```

### 2. Create Senior Picker
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "senior.picker@example.com",
    "password": "SecurePassword123",
    "firstName": "Lisa",
    "lastName": "Senior",
    "phone": "+1234567893",
    "roleId": 6,
    "warehouseId": 1
  }'
```

### 3. Create Quality Control Specialist
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "X-App-Version: 1.0.0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quality@example.com",
    "password": "SecurePassword123",
    "firstName": "David",
    "lastName": "Quality",
    "phone": "+1234567894",
    "roleId": 7,
    "warehouseId": 1
  }'
```

## User Status Management

### Available Statuses
- **active**: User can log in and use the system
- **inactive**: User account is temporarily disabled
- **deactivated**: User account is permanently disabled
- **suspended**: User account is temporarily suspended

### Status Change Reasons
Common reasons for status changes:
- **Promotion**: User moved to a different role
- **Performance**: Performance-related status changes
- **Leave**: User on leave or vacation
- **Termination**: User left the company
- **Security**: Security-related account suspension

## User Role Management

### Role Assignment Rules
- Users can only have one role at a time
- Role changes are logged with reasons
- Previous role information is preserved
- Role changes require appropriate permissions

### Role Change Workflow
1. **Assessment**: Evaluate current performance and skills
2. **Approval**: Get management approval for role change
3. **Notification**: Inform user about role change
4. **Training**: Provide necessary training for new role
5. **Implementation**: Execute role change in system

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

### User Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "data": null,
  "error": "User not found"
}
```

### Email Already Exists
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Email already exists"
}
```

### Invalid Role
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Invalid role ID"
}
```

### Cannot Deactivate Admin
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Cannot deactivate admin users"
}
```

## Best Practices

### User Creation
- Use strong, unique passwords
- Assign appropriate roles based on job functions
- Include contact information for communication
- Set proper warehouse assignments

### User Management
- Regularly review user status and roles
- Document all status and role changes
- Provide clear reasons for changes
- Maintain audit trail of all modifications

### Security Considerations
- Never share user credentials
- Implement password policies
- Regular security audits
- Monitor user access patterns

## Mobile App Integration

### User Display
- Show user information based on permissions
- Display role and warehouse information
- Provide status indicators
- Show last login information

### User Management
- Implement role-based feature access
- Handle permission changes gracefully
- Cache user information for offline use
- Sync user updates when online

### Offline Handling
- Cache user data locally
- Queue user management operations
- Sync changes when connection restored
- Handle permission conflicts

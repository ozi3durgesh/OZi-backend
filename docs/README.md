# OZi Backend API Documentation

This document provides comprehensive API documentation for the OZi Backend system, including curl examples for mobile and web applications.

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-production-domain.com`

## API Version
All API endpoints require a version check. Include the following header:
```bash
X-App-Version: 1.0.0
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```bash
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this standard format:
```json
{
  "statusCode": 200,
  "success": true,
  "data": { ... },
  "error": null
}
```

## Error Handling
Errors follow this format:
```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "error": "Error message"
}
```

## Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers

## Modules
1. [Initial Setup & Admin Registration](./01-initial-setup.md)
2. [Authentication & Authorization](./02-authentication.md)
3. [Role Management](./03-role-management.md)
4. [Permission Management](./04-permission-management.md)
5. [User Management](./05-user-management.md)
6. [Place Order](./06-place-order.md)
7. [Coupon Management](./07-coupon-management.md)
8. [Picking Module](./08-picking-module.md)
9. [Packing Operations](./09-packing-operations.md)
10. [Warehouse Management](./10-warehouse-management.md)
11. [Handover & Delivery](./11-handover-delivery.md)

## Getting Started
1. Set up your environment variables (see `env.example`)
2. Start the server
3. Use the Initial Setup endpoints to create your first admin user
4. Authenticate and start using the API

## Testing
You can test the API using:
- **cURL** (examples provided in each module)
- **Postman** or similar API testing tools
- **Mobile/Web applications**

## Support
For API support or questions, please refer to the individual module documentation or contact the development team.

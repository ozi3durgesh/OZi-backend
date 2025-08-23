# Universal API Logging System

This system automatically logs **ALL** API requests and responses to the `universal_log` table for comprehensive audit, debugging, and analytics purposes.

## 🎯 Overview

The universal logging system captures every single API call made to your application, including:
- **Request Data**: Complete request body, headers, query parameters, and route parameters
- **Response Data**: Complete response body, headers, and status codes
- **Metadata**: User information, IP addresses, execution time, and more
- **Performance Metrics**: Request/response sizes and execution time

## 🏗️ Architecture

### UniversalLog Model
- **Table**: `universal_log`
- **Automatic Logging**: Every API request is logged via middleware
- **Non-Intrusive**: Logging failures don't affect API functionality
- **Performance Optimized**: Proper indexes and efficient data types

### UniversalLogger Middleware
- **Global Coverage**: Applied to all routes automatically
- **Response Capture**: Intercepts and logs complete request/response data
- **Smart Parsing**: Extracts endpoint names and modules automatically
- **Security**: Sanitizes sensitive headers (authorization, cookies, etc.)

## 📊 Table Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Auto-incrementing primary key |
| `url` | VARCHAR(1000) | Full URL that was hit |
| `method` | VARCHAR(10) | HTTP method (GET, POST, PUT, DELETE) |
| `req` | JSON | Complete request data (body, headers, params, query) |
| `res` | JSON | Complete response data (body, headers, status) |
| `status_code` | INTEGER | HTTP status code of the response |
| `user_id` | INTEGER | User ID if authenticated |
| `ip_address` | VARCHAR(45) | Client IP address (IPv6 compatible) |
| `user_agent` | TEXT | Browser/client information |
| `execution_time_ms` | INTEGER | Request execution time in milliseconds |
| `created_at` | BIGINT | Unix timestamp when request was processed |
| `endpoint_name` | VARCHAR(255) | Human-readable endpoint name |
| `module` | VARCHAR(100) | Module/controller name |
| `error_message` | TEXT | Error message if request failed |
| `request_size_bytes` | INTEGER | Size of request in bytes |
| `response_size_bytes` | INTEGER | Size of response in bytes |

## 🚀 Setup Instructions

### 1. Create the Universal Log Table

For new databases, the table will be created automatically when running:
```bash
npm run db:setup
```

For existing databases, create just the log table:
```bash
npm run setup-log-table
```

### 2. Fix Table Structure (if needed)

If you encounter database errors, fix the table structure:
```bash
npm run fix-log-table
```

### 3. Verify Setup

Test that the logging system is working:
```bash
npm run test-logging
```

### 4. Start Your Server

The universal logging will automatically work for all API calls:
```bash
npm run dev
```

## 📝 What Gets Logged

### Request Data (`req` field)
```json
{
  "body": { /* Complete request body */ },
  "query": { /* Query parameters */ },
  "params": { /* Route parameters */ },
  "headers": { /* Request headers (sanitized) */ },
  "method": "POST",
  "url": "/api/v1/customer/order/place"
}
```

### Response Data (`res` field)
```json
{
  "body": { /* Complete response body */ },
  "status": 201,
  "headers": { /* Response headers */ }
}
```

### Example Log Entry
```
ID: 2
URL: /api/v1/customer/order/place
Method: POST
Status Code: 201
User ID: 1
Module: v1
Endpoint: order_place
Execution Time: 334ms
Created At: 2025-08-23T08:15:02.000Z
IP Address: ::1
User Agent: curl/8.7.1...
```

## 🔍 Querying the Logs

### View All Logs
```sql
SELECT * FROM universal_log ORDER BY created_at DESC;
```

### View Logs for Specific Endpoint
```sql
SELECT * FROM universal_log 
WHERE endpoint_name = 'order_place' 
ORDER BY created_at DESC;
```

### View Logs for Specific Module
```sql
SELECT * FROM universal_log 
WHERE module = 'v1' 
ORDER BY created_at DESC;
```

### View Logs for Specific User
```sql
SELECT * FROM universal_log 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### View Recent Logs (Last 24 hours)
```sql
SELECT * FROM universal_log 
WHERE created_at > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 DAY))
ORDER BY created_at DESC;
```

### Performance Analysis
```sql
SELECT 
  endpoint_name,
  COUNT(*) as request_count,
  AVG(execution_time_ms) as avg_execution_time,
  MAX(execution_time_ms) as max_execution_time
FROM universal_log 
GROUP BY endpoint_name
ORDER BY avg_execution_time DESC;
```

### Error Analysis
```sql
SELECT * FROM universal_log 
WHERE status_code >= 400 
ORDER BY created_at DESC;
```

## 🛠️ Programmatic Access

### Get Logs with Filtering
```typescript
import { UniversalLogger } from '../middleware/universalLogger';

// Get logs with pagination and filtering
const logs = await UniversalLogger.getLogs({
  page: 1,
  limit: 50,
  module: 'v1',
  endpoint_name: 'order_place',
  status_code: 201,
  user_id: 1
});

// Get log statistics
const stats = await UniversalLogger.getLogStats({
  start_date: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
  module: 'v1'
});
```

## 🔒 Security Features

### Header Sanitization
The following headers are automatically redacted:
- `authorization`
- `cookie`
- `x-api-key`
- `x-auth-token`

### Data Privacy
- Sensitive information is automatically filtered
- Logging failures don't expose sensitive data
- IP addresses are logged for debugging purposes

## 📈 Performance Considerations

### Indexes
The table includes optimized indexes on:
- `user_id` - For user-specific queries
- `created_at` - For time-based queries
- `method` - For HTTP method filtering
- `status_code` - For error analysis
- `endpoint_name` - For endpoint-specific queries
- `module` - For module-based filtering
- `url` - For URL-based queries

### Storage Optimization
- JSON fields for complex data structures
- Unix timestamps for efficient sorting
- VARCHAR with appropriate lengths
- Automatic cleanup recommendations

## 🚨 Error Handling

### Non-Intrusive Design
- If logging fails, the API continues to work normally
- Log errors are logged to console but don't affect responses
- All logging operations are wrapped in try-catch blocks

### Common Issues
1. **Table doesn't exist**: Run `npm run setup-log-table`
2. **Database errors**: Run `npm run fix-log-table`
3. **No logs being created**: Check middleware is properly configured

## 📋 Use Cases

### Development & Debugging
- Track API usage patterns
- Debug request/response issues
- Monitor performance bottlenecks
- Analyze user behavior

### Production Monitoring
- Audit trail for compliance
- Performance monitoring
- Error tracking and analysis
- User activity monitoring

### Analytics
- API usage statistics
- Endpoint popularity
- Response time analysis
- Error rate monitoring

## 🔧 Customization

### Adding Custom Fields
Modify the `UniversalLog` model to add custom fields:
```typescript
// Add to UniversalLog model
custom_field: {
  type: DataTypes.STRING(255),
  allowNull: true
}
```

### Custom Logging Logic
Extend the `UniversalLogger` class for custom logging behavior:
```typescript
class CustomLogger extends UniversalLogger {
  static async customLogMethod(data: any) {
    // Custom logging logic
  }
}
```

## 📚 API Examples

### Test Order Placement (from your requirements)
```bash
curl --location 'http://localhost:3000/api/v1/customer/order/place' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--data '{
  "cart": [
    {"sku":122,"amount":100},
    {"sku":122,"amount":100}
  ],
  "coupon_discount_amount": 0.0,
  "order_amount": 200.0,
  "order_type": "delivery",
  "payment_method": "cash_on_delivery",
  "store_id": 9,
  "distance": 88.6379234112387,
  "discount_amount": 10.0,
  "tax_amount": 10.0,
  "address": "532, Shakti Nagar, New Delhi, Delhi, 110007, India",
  "latitude": 28.67280321318178,
  "longitude": 77.18774400651455,
  "contact_person_name": "John Doe",
  "contact_person_number": "+918987562984",
  "address_type": "others",
  "dm_tips": 0,
  "cutlery": 0,
  "partial_payment": 0,
  "is_buy_now": 0,
  "extra_packaging_amount": 0.0,
  "create_new_user": 0
}'
```

This request will be automatically logged with:
- Complete request body in the `req` field
- Complete response in the `res` field
- URL: `/api/v1/customer/order/place`
- Method: `POST`
- Module: `v1`
- Endpoint: `order_place`
- All metadata and performance metrics

## 🎉 Benefits

✅ **Universal Coverage**: Logs every single API call automatically  
✅ **Complete Data**: Captures request, response, and metadata  
✅ **Performance**: Non-intrusive with optimized database structure  
✅ **Security**: Automatic sanitization of sensitive data  
✅ **Analytics**: Rich data for monitoring and analysis  
✅ **Debugging**: Complete request/response visibility  
✅ **Compliance**: Full audit trail for regulatory requirements  

The universal logging system is now fully operational and will capture all the data from your order placement API and every other API call automatically! 🚀

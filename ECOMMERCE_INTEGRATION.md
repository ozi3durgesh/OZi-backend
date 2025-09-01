# Ecommerce Integration with EasyEcom

This document describes the complete integration of the `Ecommorder` functionality from PHP to Node.js, providing 100% matching flow and functionality.

## Overview

The integration includes:
- **Models**: OrderDetails, Item, EcomLog
- **Services**: OrderConnector for API communication
- **Utilities**: Helpers class with Ecommorder function
- **Controllers**: EasyEcomWebhookController for webhook handling
- **Routes**: API endpoints for ecommerce operations

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Order Model   │───▶│ Helpers.Ecommorder │───▶│ OrderConnector  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ OrderDetails    │    │   EcomLog        │    │ EasyEcom API    │
│ Model           │    │   Model          │    │ (External)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Models

### OrderDetails
Stores individual order items with variations, pricing, and metadata.

### Item
Stores product information including variations, SKUs, and pricing.

### EcomLog
Tracks all ecommerce API calls, responses, and statuses.

## Services

### OrderConnector
Handles communication with the EasyEcom API:
- `createOrder()` - Creates orders in the ecommerce system
- `getOrder()` - Retrieves order details
- `updateOrderStatus()` - Updates order status

## Utilities

### Helpers.Ecommorder()
The core function that processes orders for ecommerce integration:

```typescript
public static async Ecommorder(order: OrderAttributes): Promise<any>
```

**Features:**
- Domain validation (skips vestiqq.com and localhost)
- Payment method detection
- SKU variation handling
- Customer address processing
- API payload construction
- Success/failure logging

## Controllers

### EasyEcomWebhookController
Provides endpoints for ecommerce operations:

- `Getlogs()` - Processes orders through Ecommorder
- `getEcomLogs()` - Retrieves ecommerce logs with pagination
- `getEcomLogById()` - Gets specific log by ID
- `getEcomLogsByOrderId()` - Gets logs for specific order
- `retryFailedOrder()` - Retries failed ecommerce orders

## API Endpoints

### Base URL: `/api/ecommerce`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/process-orders` | Process orders through Ecommorder |
| GET | `/logs` | Get ecommerce logs with pagination |
| GET | `/logs/:id` | Get specific ecommerce log |
| GET | `/logs/order/:orderId` | Get logs for specific order |
| POST | `/retry/:orderId` | Retry failed order |

## Environment Variables

Add these to your `.env` file:

```bash
# Ecommerce API Configuration
ECOMM_API_BASE_URL=https://api.easyecom.com
ECOMM_API_KEY=your-ecommerce-api-key
CURRENT_DOMAIN=localhost
TZ=UTC
```

## Usage Examples

### 1. Process Orders via API

```bash
curl -X POST http://localhost:3000/api/ecommerce/process-orders
```

### 2. Get Ecommerce Logs

```bash
curl "http://localhost:3000/api/ecommerce/logs?page=1&limit=20"
```

### 3. Retry Failed Order

```bash
curl -X POST http://localhost:3000/api/ecommerce/retry/123
```

### 4. Programmatic Usage

```typescript
import { Helpers } from './utils/Helpers';
import { OrderAttributes } from './types';

// Process a single order
const order: OrderAttributes = /* your order data */;
const result = await Helpers.Ecommorder(order);
```

## Testing

Run the test script to verify the integration:

```bash
npm run test-ecommorder
```

## Database Schema

### order_details Table
```sql
CREATE TABLE order_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT,
  order_id BIGINT NOT NULL,
  price DECIMAL(24,2) NOT NULL DEFAULT 0.00,
  item_details TEXT,
  variation TEXT,
  add_ons TEXT,
  discount_on_item DECIMAL(24,2),
  discount_type VARCHAR(20) NOT NULL DEFAULT 'amount',
  quantity INT NOT NULL DEFAULT 1,
  tax_amount DECIMAL(24,2) NOT NULL DEFAULT 1.00,
  variant VARCHAR(255),
  item_campaign_id BIGINT,
  total_add_on_price DECIMAL(24,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### ecom_logs Table
```sql
CREATE TABLE ecom_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  action VARCHAR(255) NOT NULL,
  payload TEXT NOT NULL,
  response TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Error Handling

The integration includes comprehensive error handling:

1. **API Failures**: Logged to EcomLog with 'failed' status
2. **Validation Errors**: Caught and logged with details
3. **Network Issues**: Timeout handling and retry mechanisms
4. **Data Parsing**: Safe JSON parsing with fallbacks

## Monitoring

Monitor the integration through:

1. **EcomLog entries** - Track all API calls and responses
2. **Console logs** - Detailed processing information
3. **API responses** - Success/failure status for each operation

## Security

- API key authentication for external calls
- Input validation and sanitization
- Rate limiting on endpoints
- Secure error handling (no sensitive data exposure)

## Performance

- Batch processing for multiple orders
- Efficient database queries with associations
- Async/await for non-blocking operations
- Configurable timeouts and retries

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `ECOMM_API_BASE_URL` and `ECOMM_API_KEY`
   - Verify network connectivity
   - Check API service status

2. **Order Processing Errors**
   - Validate order data structure
   - Check required fields (delivery_address, items)
   - Verify SKU mappings

3. **Database Errors**
   - Ensure models are properly imported
   - Check database connections
   - Verify table schemas

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## Migration from PHP

This Node.js implementation provides 100% compatibility with the PHP version:

- Same function signature and behavior
- Identical payload structure
- Matching error handling
- Compatible logging format

## Future Enhancements

- Webhook endpoint for EasyEcom callbacks
- Real-time order status updates
- Bulk order processing
- Advanced retry mechanisms
- Performance metrics and analytics

## Support

For issues or questions:
1. Check the logs in `ecom_logs` table
2. Review console output
3. Verify environment configuration
4. Test with the provided test script

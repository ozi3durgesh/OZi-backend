# Order Placement Logging System

This system automatically logs all order placement requests to the `log_place_order` table for audit and debugging purposes.

## Overview

Whenever someone hits the order placement API endpoint:
```
POST http://localhost:3000/api/v1/customer/order/place
```

All the request body data is automatically stored in the `log_place_order` table, including:
- Cart items
- Order details (amount, type, payment method)
- Customer information (name, phone, address)
- Location data (latitude, longitude)
- Additional fields (tips, cutlery, packaging, etc.)
- Request metadata (IP address, user agent, timestamp)

## Table Structure

The `log_place_order` table contains the following fields:

### Core Order Data
- `id` - Auto-incrementing primary key
- `cart` - JSON array of cart items
- `order_amount` - Total order amount
- `order_type` - Delivery, take_away, or parcel
- `payment_method` - Cash on delivery, digital payment, etc.
- `store_id` - Store identifier

### Customer Information
- `contact_person_name` - Customer's name
- `contact_person_number` - Customer's phone number
- `address` - Full delivery address
- `latitude` / `longitude` - GPS coordinates
- `address_type` - Type of address (home, office, others)

### Financial Details
- `coupon_discount_amount` - Discount from coupons
- `discount_amount` - General discount amount
- `tax_amount` - Tax amount
- `dm_tips` - Delivery person tips
- `extra_packaging_amount` - Additional packaging cost

### Additional Options
- `cutlery` - Whether cutlery is requested
- `partial_payment` - Partial payment flag
- `is_buy_now` - Buy now vs cart purchase
- `create_new_user` - Whether to create new user account

### Request Metadata
- `user_id` - User ID (if authenticated)
- `ip_address` - Client IP address
- `user_agent` - Browser/client information
- `created_at` - Unix timestamp of request

## Setup Instructions

### 1. Create the Log Table

For new databases, the table will be created automatically when running:
```bash
npm run db:setup
```

For existing databases, create just the log table:
```bash
npm run setup-log-table
```

### 2. Verify Setup

Test that the logging system is working:
```bash
npm run test-logging
```

### 3. Test Order Placement

Start your server and make a test order:
```bash
npm run dev
```

Then use the curl command from your requirements:
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

## Database Queries

### View All Logs
```sql
SELECT * FROM log_place_order ORDER BY created_at DESC;
```

### View Logs for Specific User
```sql
SELECT * FROM log_place_order WHERE user_id = ? ORDER BY created_at DESC;
```

### View Logs for Specific Store
```sql
SELECT * FROM log_place_order WHERE store_id = ? ORDER BY created_at DESC;
```

### View Recent Logs (Last 24 hours)
```sql
SELECT * FROM log_place_order 
WHERE created_at > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 DAY))
ORDER BY created_at DESC;
```

### Count Orders by Type
```sql
SELECT order_type, COUNT(*) as count 
FROM log_place_order 
GROUP BY order_type;
```

### Count Orders by Payment Method
```sql
SELECT payment_method, COUNT(*) as count 
FROM log_place_order 
GROUP BY payment_method;
```

## Error Handling

The logging system is designed to be non-intrusive:
- If logging fails, the order creation continues normally
- Log errors are logged to console but don't affect the API response
- All logging operations are wrapped in try-catch blocks

## Performance Considerations

- The table includes indexes on frequently queried fields
- JSON fields are used for complex data structures (cart, attachments)
- Timestamps are stored as Unix timestamps for efficient sorting
- The logging happens within the same transaction as order creation

## Security Notes

- IP addresses and user agents are logged for debugging
- Sensitive data like passwords are logged if provided (consider encryption in production)
- The logging table should have appropriate access controls in production

## Troubleshooting

### Table Not Created
- Ensure the LogPlaceOrder model is imported in `src/models/index.ts`
- Check that the setup script runs without errors
- Verify database connection and permissions

### No Logs Being Created
- Check that the LogPlaceOrder import is added to the order controller
- Verify the logging code is placed before transaction commit
- Check console for any logging errors

### Performance Issues
- Consider archiving old logs periodically
- Monitor table size and query performance
- Add additional indexes if needed for specific query patterns

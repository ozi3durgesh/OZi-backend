# Error Handling Guide

## Overview
This guide explains the improved error handling system and how to troubleshoot common database issues in the OZi Backend.

## Enhanced Error Messages

### Before (Raw Sequelize Errors)
```json
{
  "statusCode": 400,
  "success": false,
  "error": "notNull Violation: OrderDetail.created_at cannot be null,\nnotNull Violation: OrderDetail.updated_at cannot be null"
}
```

### After (User-Friendly Messages)
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Database schema error: Missing required fields (created_at, updated_at) in order_details table. Please contact support."
}
```

## Common Error Types & Solutions

### 1. Database Schema Errors

#### Error: "Missing required fields (created_at, updated_at)"
**Cause**: The `order_details` table is missing required timestamp columns
**Solution**: Run the database fix script
```bash
npm run db:fix
```

#### Error: "Database schema error: Required fields are missing"
**Cause**: Table structure doesn't match the Sequelize model
**Solution**: Validate and fix the schema
```bash
npm run db:validate
npm run db:fix
```

### 2. Constraint Violation Errors

#### Error: "Referenced record not found"
**Cause**: Foreign key constraint failure (e.g., store_id doesn't exist)
**Solution**: Ensure referenced records exist
```bash
# Check if warehouse/store exists
npx tsx src/script/checkWarehouse.ts

# Create missing warehouse
npx tsx src/script/addWarehouse11.ts
```

#### Error: "Record already exists"
**Cause**: Duplicate entry violation
**Solution**: Check for existing records or use unique constraints

### 3. Validation Errors

#### Error: "Product with SKU X not found"
**Cause**: Product doesn't exist in the database
**Solution**: Create the product
```bash
npm run add-product-1191
```

#### Error: "Insufficient stock for SKU X"
**Cause**: Product stock is lower than requested quantity
**Solution**: Update product stock or reduce order quantity

#### Error: "Selected store is not available"
**Cause**: Store/warehouse doesn't exist or is inactive
**Solution**: Verify store exists and is active

## Error Handling Architecture

### 1. Service Layer (OrderTransactionService)
- Catches database errors early
- Provides context-specific error messages
- Logs detailed error information for debugging

### 2. Middleware Layer (errorHandler)
- Intercepts all errors
- Transforms technical errors into user-friendly messages
- Maintains consistent error response format

### 3. Response Format
```typescript
interface ErrorResponse {
  statusCode: number;
  success: false;
  error: string;
  data?: null;
}
```

## Debugging Tools

### 1. Schema Validation
```bash
npm run db:validate
```
Checks:
- Table structure
- Required columns
- Foreign key constraints
- Data integrity

### 2. Database Fix
```bash
npm run db:fix
```
- Recreates all tables with proper structure
- Resolves schema mismatches
- **Warning**: This will drop existing data

### 3. Individual Table Fixes
```bash
# Fix specific tables
npx tsx src/script/fixOrderDetailsTable.ts
npx tsx src/script/fixDatabaseSchema.ts
```

## Prevention Best Practices

### 1. Database Migrations
- Always use migrations for schema changes
- Test migrations in development first
- Backup production data before major changes

### 2. Model Validation
- Ensure Sequelize models match database schema
- Use `sync()` carefully in production
- Validate data before database operations

### 3. Error Monitoring
- Log all errors with context
- Monitor error patterns
- Set up alerts for critical errors

## Troubleshooting Checklist

When encountering errors:

1. **Check Database Schema**
   ```bash
   npm run db:validate
   ```

2. **Verify Required Data**
   - Products exist with correct SKUs
   - Warehouses/stores are active
   - Users have proper permissions

3. **Check Error Logs**
   - Look for detailed error context
   - Identify the specific failing operation

4. **Validate API Input**
   - Ensure all required fields are provided
   - Check data types and formats

5. **Run Fix Scripts**
   ```bash
   npm run db:fix  # For schema issues
   npm run init-rbac  # For permission issues
   ```

## Common Issues & Quick Fixes

### Issue: "OrderDetail.created_at cannot be null"
**Quick Fix**: `npm run db:fix`

### Issue: "Store not found"
**Quick Fix**: `npx tsx src/script/addWarehouse11.ts`

### Issue: "Product with SKU X not found"
**Quick Fix**: `npm run add-product-1191`

### Issue: Permission denied
**Quick Fix**: `npm run init-rbac`

## Support

If you continue to encounter issues:

1. Run `npm run db:validate` and share the output
2. Check the server logs for detailed error context
3. Verify the database connection and credentials
4. Ensure all required scripts have been run

## Error Response Examples

### Database Schema Error
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Database schema error: Missing required fields (created_at, updated_at) in order_details table. Please contact support."
}
```

### Validation Error
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Validation failed: price is required, quantity must be greater than 0"
}
```

### Business Logic Error
```json
{
  "statusCode": 400,
  "success": false,
  "error": "Selected store is not available"
}
```

### System Error
```json
{
  "statusCode": 500,
  "success": false,
  "error": "An unexpected error occurred"
}
```

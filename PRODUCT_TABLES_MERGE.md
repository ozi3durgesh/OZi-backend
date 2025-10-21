# Product Tables Merge Documentation

## Overview

This document describes the merge of `parent_product_master` and `product_master` tables into a single unified `product_master` table.

## Background

Previously, the system had two separate product tables:
- `parent_product_master` - More structured with better validation
- `product_master` - Had additional fields like `sku`, `cost`, `dc_id` but with inconsistent data types

## Changes Made

### 1. New Unified Model

**File**: `src/models/ProductMaster.ts`

The new `ProductMaster` model combines the best features from both tables:

#### Fields from ParentProductMasterDC:
- `id`, `name`, `status`, `category_id`, `catalogue_id`
- `description`, `hsn`, `image_url`, `mrp`, `ean_upc`
- `brand_id`, `weight`, `length`, `height`, `width`
- `inventory_threshold`, `gst`, `cess`
- `createdBy`, `updatedBy`, `createdAt`, `updatedAt`

#### Additional Fields from Product:
- `cost` - Product cost (nullable)
- `sku` - Unique stock keeping unit (required)
- `item_code` - Item code (nullable)
- `dc_id` - Distribution center ID (nullable)

#### Key Improvements:
- Consistent data types (DECIMAL for measurements, proper string lengths)
- Better validation rules
- Proper foreign key constraints
- Indexes for performance
- Unique constraints on `catalogue_id` and `sku`

### 2. Database Migration

**File**: `src/migrations/merge-product-tables.js`

The migration script:
1. Creates a new `product_master` table with unified schema
2. Migrates data from both existing tables
3. Handles data conflicts and generates SKUs where missing
4. Updates foreign key references in related tables
5. Drops old tables and renames the new one
6. Adds proper constraints and indexes

### 3. Updated Controllers

**File**: `src/controllers/DC/parentProductControllerDC.ts`

Updated to use the new `ProductMaster` model:
- All CRUD operations now use `ProductMaster`
- Added SKU generation logic
- Enhanced search functionality to include SKU and item_code
- Updated validation to include new fields

### 4. Updated Services

**File**: `src/services/DC/dcPOService.ts`

Updated to use the new `ProductMaster` model for DC Purchase Orders.

### 5. Updated Associations

**File**: `src/models/index.ts`

Updated all model associations to use the new `ProductMaster` model:
- `PicklistItem` → `ProductMaster`
- `POProduct` → `ProductMaster`
- `DCPOProduct` → `ProductMaster`
- `Brand` → `ProductMaster`
- `User` → `ProductMaster`
- `DistributionCenter` → `ProductMaster`

### 6. New Constants

**File**: `src/constants/productMasterConstants.ts`

Comprehensive constants for the unified model:
- Required and optional fields
- Validation patterns
- Error and success messages
- Pagination settings
- Field mappings for migration

## Migration Process

### Prerequisites
1. Database backup
2. Application downtime (recommended)
3. All related services stopped

### Running the Migration

```bash
# Option 1: Using the migration script
cd /path/to/OZi-backend
node src/scripts/run-product-merge-migration.js

# Option 2: Manual execution
# Import and run the migration in your application
```

### Data Migration Logic

1. **Parent Product Master Data**:
   - Direct mapping to new table
   - SKU generated as `PP-{catalogue_id}`
   - Cost set to NULL

2. **Product Master Data**:
   - Only migrated if catalogue_id doesn't exist in parent table
   - ID offset by 1,000,000 to avoid conflicts
   - Default values for missing required fields

3. **Foreign Key Updates**:
   - `DCPOProduct.productId` updated to reference new table
   - All relationships maintained

## API Changes

### No Breaking Changes
The API endpoints remain the same, but now use the unified model internally.

### Enhanced Features
- Search now includes SKU and item_code
- Better validation for all fields
- Consistent data types across all operations

## Testing Checklist

- [ ] Create new product
- [ ] Update existing product
- [ ] Search products (by name, SKU, catalogue_id, etc.)
- [ ] Delete product
- [ ] Bulk upload products
- [ ] DC Purchase Order creation with products
- [ ] All existing product-related functionality

## Rollback Plan

If issues arise:

1. **Database Rollback**:
   ```sql
   -- Restore from backup
   -- Or manually recreate original tables from backup
   ```

2. **Code Rollback**:
   - Revert to previous commit
   - Restore old model files
   - Update imports and associations

## Performance Considerations

### Indexes Added
- `catalogue_id` (unique)
- `sku` (unique)
- `brand_id`
- `category_id`
- `dc_id`
- `status`

### Query Optimization
- All product lookups now use indexed fields
- Search queries optimized with proper indexes
- Foreign key relationships properly indexed

## Future Enhancements

1. **Data Validation**:
   - Add more comprehensive validation rules
   - Implement data quality checks

2. **Performance**:
   - Consider partitioning for large datasets
   - Add more specific indexes based on usage patterns

3. **Features**:
   - Product variants support
   - Advanced search and filtering
   - Product lifecycle management

## Support

For issues or questions regarding this merge:
1. Check the migration logs
2. Verify database constraints
3. Test all product-related functionality
4. Contact the development team

---

**Migration Date**: $(date)
**Version**: 1.0
**Status**: Completed

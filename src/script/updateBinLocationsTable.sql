-- SQL script to update bin_locations table with new columns and sample data
-- Run this script directly in your MySQL database if needed

-- Add new columns to bin_locations table
ALTER TABLE bin_locations 
ADD COLUMN bin_id VARCHAR(50) UNIQUE COMMENT 'Unique bin identifier',
ADD COLUMN bin_name VARCHAR(100) COMMENT 'Human readable bin name',
ADD COLUMN bin_type VARCHAR(50) COMMENT 'Type of bin (Good Bin, Bad Bin, etc.)',
ADD COLUMN zone_type VARCHAR(50) COMMENT 'Type of zone (Each, Bulk, etc.)',
ADD COLUMN zone_name VARCHAR(100) COMMENT 'Name of the zone',
ADD COLUMN bin_dimensions VARCHAR(100) COMMENT 'Physical dimensions of the bin',
ADD COLUMN preferred_product_category VARCHAR(100) COMMENT 'Preferred product category for this bin',
ADD COLUMN no_of_categories INTEGER DEFAULT 0 COMMENT 'Number of categories in this bin',
ADD COLUMN no_of_sku_uom INTEGER DEFAULT 0 COMMENT 'Number of SKU/UOM in this bin',
ADD COLUMN no_of_items INTEGER DEFAULT 0 COMMENT 'Number of items in this bin',
ADD COLUMN bin_capacity INTEGER DEFAULT 0 COMMENT 'Maximum capacity of the bin',
ADD COLUMN bin_created_by VARCHAR(100) COMMENT 'User who created the bin',
ADD COLUMN bin_status VARCHAR(50) DEFAULT 'Unlocked' COMMENT 'Current status of the bin';

-- Update existing records with default values
UPDATE bin_locations SET 
  bin_id = CONCAT('BIN_', id),
  bin_name = bin_code,
  bin_type = 'Good Bin',
  zone_type = 'Each',
  zone_name = zone,
  bin_dimensions = '100 x 100 x 100 cm',
  preferred_product_category = '',
  no_of_categories = CASE WHEN category_mapping IS NOT NULL THEN JSON_LENGTH(category_mapping) ELSE 0 END,
  no_of_sku_uom = CASE WHEN sku_mapping IS NOT NULL THEN JSON_LENGTH(sku_mapping) ELSE 0 END,
  no_of_items = current_quantity,
  bin_capacity = capacity,
  bin_created_by = 'System',
  bin_status = CASE 
    WHEN status = 'active' THEN 'Unlocked'
    WHEN status = 'inactive' THEN 'All bin activities locked'
    WHEN status = 'maintenance' THEN 'All bin activities locked'
    ELSE 'Unlocked'
  END
WHERE bin_id IS NULL;

-- Insert sample data
INSERT INTO bin_locations (
  bin_id, bin_code, zone, aisle, rack, shelf, capacity, current_quantity,
  sku_mapping, category_mapping, status, bin_name, bin_type, zone_type,
  zone_name, bin_dimensions, preferred_product_category, 
  no_of_categories, no_of_sku_uom, no_of_items, bin_capacity, 
  bin_created_by, bin_status, created_at, updated_at
) VALUES 
('3026172', 'BIN_3026172', 'default', 'A01', 'R01', 'S01', 5000, 100, '[]', '[]', 'active', 'default', 'Good Bin', 'Each', 'default', '100 x 100 x 100 cm', '', 0, 0, 100, 5000, 'Amit kumar', 'Unlocked', NOW(), NOW()),
('3026833', 'BIN_3026833', 'ZONE-1', 'A01', 'R01', 'S01', 100, 0, '[]', '[]', 'active', 'R001-S01', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'Unlocked', NOW(), NOW()),
('3026834', 'BIN_3026834', 'ZONE-1', 'A01', 'R01', 'S02', 100, 0, '[]', '[]', 'inactive', 'R001-S02', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'All bin activities locked', NOW(), NOW()),
('3026835', 'BIN_3026835', 'ZONE-1', 'A01', 'R01', 'S03', 100, 0, '[]', '[]', 'inactive', 'R001-S03', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'All bin activities locked', NOW(), NOW()),
('3026836', 'BIN_3026836', 'ZONE-1', 'A01', 'R01', 'S04', 100, 0, '[]', '[]', 'inactive', 'R001-S04', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'All bin activities locked', NOW(), NOW()),
('3026837', 'BIN_3026837', 'ZONE-1', 'A01', 'R01', 'S05', 100, 0, '[]', '[]', 'inactive', 'R001-S05', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'All bin activities locked', NOW(), NOW()),
('3026838', 'BIN_3026838', 'ZONE-1', 'A02', 'R01', 'S01', 100, 0, '[]', '[]', 'inactive', 'R002-S01', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'All bin activities locked', NOW(), NOW()),
('3026839', 'BIN_3026839', 'ZONE-1', 'A02', 'R01', 'S02', 100, 0, '[]', '[]', 'inactive', 'R002-S02', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'All bin activities locked', NOW(), NOW()),
('3026840', 'BIN_3026840', 'ZONE-1', 'A02', 'R01', 'S03', 100, 0, '[]', '[]', 'inactive', 'R002-S03', 'Good Bin', 'Each', 'ZONE-1', '90 x 45 x 48 cm', '', 0, 0, 0, 100, 'Amit kumar', 'All bin activities locked', NOW(), NOW());

-- Add indexes for better performance
CREATE INDEX idx_bin_locations_bin_id ON bin_locations(bin_id);
CREATE INDEX idx_bin_locations_zone_name ON bin_locations(zone_name);
CREATE INDEX idx_bin_locations_bin_status ON bin_locations(bin_status);

-- Show final table structure
DESCRIBE bin_locations;

-- Show record count
SELECT COUNT(*) as total_records FROM bin_locations;

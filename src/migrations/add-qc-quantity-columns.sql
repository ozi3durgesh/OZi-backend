-- Migration to add QC quantity columns to return_request_items table
-- Run this SQL script in your database

-- Add qc_pass_qty column to return_request_items table
ALTER TABLE `return_request_items` 
ADD COLUMN `qc_pass_qty` INT NULL COMMENT 'QC passed quantity for putaway';

-- Add qc_fail_qty column to return_request_items table
ALTER TABLE `return_request_items` 
ADD COLUMN `qc_fail_qty` INT NULL COMMENT 'QC failed quantity';

-- Add indexes for better performance
CREATE INDEX `idx_return_request_items_qc_pass_qty` ON `return_request_items` (`qc_pass_qty`);
CREATE INDEX `idx_return_request_items_qc_fail_qty` ON `return_request_items` (`qc_fail_qty`);

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ozi_backend' 
AND TABLE_NAME = 'return_request_items' 
AND COLUMN_NAME IN ('qc_pass_qty', 'qc_fail_qty');
